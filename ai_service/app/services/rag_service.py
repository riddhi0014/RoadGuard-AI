"""
app/services/rag_service.py

Retrieval now happens via HTTP against yolo_server.py's /retrieve
endpoint instead of loading the embedding model + FAISS index
in-process (see yolo_server.py docstring for why). Gemini generation
stays here — it's a remote API call with no local tensor math, so it's
safe to run in the main app process.
"""

import json
import logging

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings
from app.models.schemas import DetectionInput, InspectionReportOutput

logger = logging.getLogger(__name__)

_gemini_client = None

ML_SERVICE_URL = "http://localhost:8001"

REPORT_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "inspectionReport": {"type": "string"},
        "recommendedRepair": {"type": "string"},
    },
    "required": ["inspectionReport", "recommendedRepair"],
}


def load_resources() -> None:
    global _gemini_client
    _gemini_client = genai.Client(api_key=settings.gemini_api_key)
    logger.info("RAG service ready (retrieval delegated to yolo_server.py on port 8001).")


def _ensure_loaded() -> None:
    if _gemini_client is None:
        raise RuntimeError("RAG service not loaded. load_resources() must be called at startup.")


def retrieve_chunks(query: str, defect_type: str, top_k: int = 4) -> list:
    try:
        response = httpx.post(
            f"{ML_SERVICE_URL}/retrieve",
            params={"query": query, "defect_type": defect_type, "top_k": top_k},
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.ConnectError:
        raise RuntimeError(
            "Could not reach ML service. Is it running? "
            "Start it with: python -m uvicorn yolo_server:app --port 8001"
        )


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