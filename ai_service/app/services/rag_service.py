"""
app/services/rag_service.py

The RAG retrieval + Gemini generation logic, refactored from the tested
standalone scripts (test_retrieval.py, generate_report.py) into a service
module the FastAPI app can use.

Key difference from the standalone scripts: the embedding model and FAISS
index are expensive to load (a few seconds each) and should only be loaded
ONCE when the app starts — not on every request. load_resources() is
called from the FastAPI startup event in app/main.py; every other function
here assumes it's already been called.
"""

import json
import logging

import faiss
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from sentence_transformers import SentenceTransformer
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings
from app.models.schemas import DetectionInput, InspectionReportOutput

logger = logging.getLogger(__name__)

# Populated once by load_resources(), used by every function below.
_embedding_model = None
_faiss_index = None
_meta = None
_gemini_client = None

REPORT_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "inspectionReport": {"type": "string"},
        "recommendedRepair": {"type": "string"},
    },
    "required": ["inspectionReport", "recommendedRepair"],
}


def load_resources() -> None:
    """
    Loads the embedding model, FAISS index, chunk metadata, and Gemini
    client into module-level globals. Call once, at app startup.
    """
    global _embedding_model, _faiss_index, _meta, _gemini_client

    logger.info(f"Loading embedding model '{settings.embedding_model_name}'...")
    _embedding_model = SentenceTransformer(settings.embedding_model_name)

    logger.info(f"Loading FAISS index from {settings.faiss_index_path}...")
    if not settings.faiss_index_path.exists():
        raise FileNotFoundError(
            f"FAISS index not found at {settings.faiss_index_path}. "
            f"Run ingest_guidelines.py first to build it."
        )
    _faiss_index = faiss.read_index(str(settings.faiss_index_path))

    with open(settings.faiss_meta_path) as f:
        _meta = json.load(f)

    logger.info(f"Loaded {_faiss_index.ntotal} chunks.")

    _gemini_client = genai.Client(api_key=settings.gemini_api_key)
    logger.info("RAG service resources loaded successfully.")


def _ensure_loaded() -> None:
    if _embedding_model is None or _faiss_index is None or _meta is None or _gemini_client is None:
        raise RuntimeError(
            "RAG service resources not loaded. load_resources() must be "
            "called at app startup before handling requests."
        )


def retrieve_chunks(query: str, defect_type: str, top_k: int = 4) -> list:
    """Scoped retrieval: searches the whole index, then filters to chunks
    tagged with the given defect_type. See test_retrieval.py for the
    fuller explanation of this approach and its limits at larger scale."""
    _ensure_loaded()

    query_vec = _embedding_model.encode([query], convert_to_numpy=True).astype("float32")
    search_k = min(50, _faiss_index.ntotal)
    distances, indices = _faiss_index.search(query_vec, search_k)

    matches = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        chunk_meta = _meta[idx]
        if defect_type in chunk_meta["defect_types"]:
            matches.append(chunk_meta)
        if len(matches) >= top_k:
            break
    return matches


def _build_prompt(detection: DetectionInput, grounding_chunks: list) -> str:
    grounding_text = "\n\n".join(
        f"[Source: {c['irc_code']} - {c['irc_title']}]\n{c['text']}"
        for c in grounding_chunks
    )

    return f"""You are an assistant helping a municipal road inspection officer understand an automatically detected road defect. Use ONLY the IRC guideline excerpts provided below as your factual basis for repair recommendations — do not invent standards or numbers not supported by the excerpts.

DETECTION DETAILS:
- Defect type: {detection.defect_type.value}
- Detection confidence: {detection.confidence}
- Assessed severity: {detection.severity.value}
- Estimated damaged area: {detection.estimated_area_sq_m} square meters

RELEVANT IRC GUIDELINE EXCERPTS:
{grounding_text}

Based on the above, produce a JSON object with exactly these two fields:

- "inspectionReport": A short, factual, officer-facing summary (2-4 sentences) describing what was detected and its severity/scale. Plain, professional tone — this is read by a government road officer, not a citizen.
- "recommendedRepair": A short, actionable recommendation (2-4 sentences) for what repair action should be taken, grounded in the IRC excerpts above. Reference the relevant IRC code (e.g. "per IRC:82-2015") where applicable.

Respond with ONLY the JSON object, no other text."""


@retry(
    retry=retry_if_exception_type(genai_errors.ServerError),
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=2, max=20),
    reraise=True,
)
def _call_gemini_with_retry(prompt: str):
    return _gemini_client.models.generate_content(
        model=settings.gemini_model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=REPORT_RESPONSE_SCHEMA,
            temperature=0.2,
        ),
    )


def generate_inspection_report(detection: DetectionInput) -> InspectionReportOutput:
    """
    The main entry point the API endpoint calls. Retrieves grounding
    chunks for the detection's defect type, sends them + the detection
    details to Gemini, and returns validated structured output.

    Raises ValueError if no grounding chunks exist for the defect type,
    or if Gemini's response doesn't parse/validate — the router is
    responsible for turning these into appropriate HTTP error responses.
    """
    _ensure_loaded()

    query = f"{detection.defect_type.value} {detection.severity.value} severity repair maintenance"
    chunks = retrieve_chunks(query, detection.defect_type.value, top_k=4)

    if not chunks:
        raise ValueError(
            f"No grounding chunks found for defect_type='{detection.defect_type.value}'."
        )

    prompt = _build_prompt(detection, chunks)
    response = _call_gemini_with_retry(prompt)

    try:
        result = json.loads(response.text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini did not return valid JSON: {e}. Raw: {response.text}")

    return InspectionReportOutput(
        inspectionReport=result["inspectionReport"],
        recommendedRepair=result["recommendedRepair"],
    )
