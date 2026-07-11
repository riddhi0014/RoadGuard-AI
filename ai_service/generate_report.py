"""
generate_report.py

Given a detection result (defect type, confidence, severity, area), this:
  1. Retrieves the most relevant IRC guideline chunks for that defect type
     (same retrieval logic as test_retrieval.py)
  2. Sends those chunks + the detection details to Gemini
  3. Gets back structured JSON matching your Complaint schema's
     `inspectionReport` and `recommendedRepair` fields

USAGE (standalone test, from the same ai_service folder):
    export GEMINI_API_KEY="your-key-here"
    python3 generate_report.py

Later, this becomes a function the FastAPI service calls per-complaint —
see generate_inspection_report() below, which is the reusable piece.
"""

import json
import os
from pathlib import Path

import faiss
from google import genai
from google.genai import types
from google.genai import errors as genai_errors
from sentence_transformers import SentenceTransformer
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

BASE_DIR = Path(__file__).parent
INDEX_PATH = BASE_DIR / "data" / "index" / "irc_guidelines.faiss"
META_PATH = BASE_DIR / "data" / "index" / "irc_guidelines_meta.json"

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
GEMINI_MODEL_NAME = "gemini-3.5-flash"

# Explicit schema for structured output — stricter than just asking for
# JSON via response_mime_type alone. This tells Gemini exactly what shape
# to produce, which avoids the occasional malformed-JSON output that can
# happen with free-form "please respond in JSON" prompting, especially
# when the prompt itself contains lots of quotes/symbols (as ours does,
# from the IRC excerpts).
REPORT_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "inspectionReport": {"type": "string"},
        "recommendedRepair": {"type": "string"},
    },
    "required": ["inspectionReport", "recommendedRepair"],
}


def load_index_and_meta():
    index = faiss.read_index(str(INDEX_PATH))
    with open(META_PATH) as f:
        meta = json.load(f)
    return index, meta


def retrieve_chunks(query: str, defect_type: str, model, index, meta, top_k: int = 4):
    """Same scoped-retrieval logic as test_retrieval.py — see that file for
    the fuller explanation of why filtering happens after search."""
    query_vec = model.encode([query], convert_to_numpy=True).astype("float32")
    search_k = min(50, index.ntotal)
    distances, indices = index.search(query_vec, search_k)

    matches = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        chunk_meta = meta[idx]
        if defect_type in chunk_meta["defect_types"]:
            matches.append(chunk_meta)
        if len(matches) >= top_k:
            break
    return matches


def build_prompt(detection: dict, grounding_chunks: list) -> str:
    """
    Assembles the prompt Gemini will see: the detection details, followed
    by the retrieved IRC guideline text as grounding context, followed by
    strict instructions on what to output and in what format.
    """
    grounding_text = "\n\n".join(
        f"[Source: {c['irc_code']} - {c['irc_title']}]\n{c['text']}"
        for c in grounding_chunks
    )

    prompt = f"""You are an assistant helping a municipal road inspection officer understand an automatically detected road defect. Use ONLY the IRC guideline excerpts provided below as your factual basis for repair recommendations — do not invent standards or numbers not supported by the excerpts.

DETECTION DETAILS:
- Defect type: {detection['defectType']}
- Detection confidence: {detection['confidence']}
- Assessed severity: {detection['severity']}
- Estimated damaged area: {detection['estimatedAreaSqM']} square meters

RELEVANT IRC GUIDELINE EXCERPTS:
{grounding_text}

Based on the above, produce a JSON object with exactly these two fields:

- "inspectionReport": A short, factual, officer-facing summary (2-4 sentences) describing what was detected and its severity/scale. Plain, professional tone — this is read by a government road officer, not a citizen.
- "recommendedRepair": A short, actionable recommendation (2-4 sentences) for what repair action should be taken, grounded in the IRC excerpts above. Reference the relevant IRC code (e.g. "per IRC:82-2015") where applicable.

Respond with ONLY the JSON object, no other text."""
    return prompt


@retry(
    retry=retry_if_exception_type(genai_errors.ServerError),
    stop=stop_after_attempt(4),  # original attempt + 3 retries
    wait=wait_exponential(multiplier=1, min=2, max=20),  # 2s, 4s, 8s (capped at 20s)
    reraise=True,  # if all retries exhausted, raise the real error, not a wrapper
)
def _call_gemini_with_retry(gemini_client, prompt: str):
    """
    Calls Gemini with automatic retry on transient server-side failures
    (e.g. the 503 'high demand' error seen during testing). Only retries
    on ServerError (5xx) — a ClientError (4xx, like a malformed request)
    won't be fixed by retrying, so those fail immediately instead of
    wasting time on 3 doomed retries.
    """
    return gemini_client.models.generate_content(
        model=GEMINI_MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=REPORT_RESPONSE_SCHEMA,
            temperature=0.2,  # low temperature: this is factual/grounded, not creative
        ),
    )


def generate_inspection_report(detection: dict, embedding_model, faiss_index, meta, gemini_client) -> dict:
    """
    The reusable function the FastAPI service will eventually call.

    detection: {"defectType": str, "confidence": float, "severity": str, "estimatedAreaSqM": float}
    Returns: {"inspectionReport": str, "recommendedRepair": str}
    """
    query = f"{detection['defectType']} {detection['severity']} severity repair maintenance"
    chunks = retrieve_chunks(query, detection["defectType"], embedding_model, faiss_index, meta, top_k=4)

    if not chunks:
        raise ValueError(
            f"No grounding chunks found for defect_type='{detection['defectType']}'. "
            f"Check DOCUMENT_MAP tagging in ingest_guidelines.py."
        )

    prompt = build_prompt(detection, chunks)

    response = _call_gemini_with_retry(gemini_client, prompt)

    try:
        result = json.loads(response.text)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Gemini did not return valid JSON despite the schema constraint. "
            f"Raw response was:\n{response.text}\n\nParse error: {e}"
        )

    if "inspectionReport" not in result or "recommendedRepair" not in result:
        raise ValueError(f"Gemini response missing expected fields: {result}")

    return result


if __name__ == "__main__":
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit(
            "GEMINI_API_KEY environment variable not set.\n"
            "Get a free key at https://aistudio.google.com/apikey and run:\n"
            "  export GEMINI_API_KEY=\"your-key-here\"\n"
            "before running this script."
        )

    print(f"Loading embedding model '{EMBEDDING_MODEL_NAME}'...")
    embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    print("Loading FAISS index and metadata...")
    faiss_index, meta = load_index_and_meta()
    print(f"Loaded {faiss_index.ntotal} chunks.\n")

    gemini_client = genai.Client(api_key=api_key)

    # One test case per defect type — in the real pipeline these come from
    # YOLO + OpenCV, but these stand-ins let us verify grounding across
    # every category, not just the easiest one (pothole).
    test_detections = [
        {"defectType": "pothole", "confidence": 0.91, "severity": "high", "estimatedAreaSqM": 0.45},
        {"defectType": "crack", "confidence": 0.84, "severity": "medium", "estimatedAreaSqM": 1.2},
        {"defectType": "waterlogging", "confidence": 0.78, "severity": "high", "estimatedAreaSqM": 3.5},
        {"defectType": "open_manhole", "confidence": 0.95, "severity": "critical", "estimatedAreaSqM": 0.3},
    ]

    for test_detection in test_detections:
        print("#" * 70)
        print(f"# DEFECT TYPE: {test_detection['defectType']}")
        print("#" * 70)
        print(f"Generating report for detection: {test_detection}\n")

        query = f"{test_detection['defectType']} {test_detection['severity']} severity repair maintenance"
        chunks_used = retrieve_chunks(query, test_detection["defectType"], embedding_model, faiss_index, meta, top_k=4)

        print("=" * 70)
        print("GROUNDING CHUNKS ACTUALLY RETRIEVED (verify claims below against this):")
        print("=" * 70)
        if not chunks_used:
            print("  *** NO CHUNKS RETRIEVED FOR THIS DEFECT TYPE ***")
        for i, c in enumerate(chunks_used, 1):
            print(f"\n[{i}] {c['irc_code']} - {c['irc_title']}")
            print(f"    {c['text']}")
        print("\n" + "=" * 70 + "\n")

        try:
            result = generate_inspection_report(test_detection, embedding_model, faiss_index, meta, gemini_client)
            print("--- inspectionReport ---")
            print(result["inspectionReport"])
            print("\n--- recommendedRepair ---")
            print(result["recommendedRepair"])
        except Exception as e:
            print(f"*** ERROR generating report for {test_detection['defectType']}: {e} ***")

        print("\n")