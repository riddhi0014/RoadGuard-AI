"""
app/routers/analysis.py

The actual HTTP endpoint exposing the RAG report generation pipeline.

Note on scope: this endpoint takes a DetectionInput directly (defect type,
confidence, severity, area) rather than a complaint ID + image URLs. That's
intentional for now — YOLO detection and OpenCV area estimation aren't
built yet, so there's no way to go from "a photo" to "a DetectionInput"
inside this service. Once those pieces exist, the real end-to-end flow
(Section 8.3 of the handoff doc: POST /analyze with complaint ID + images,
async callback to Node's PATCH /api/complaints/:id/ai-analysis) gets built
as an additional endpoint that internally calls YOLO -> OpenCV -> this
same generate_inspection_report() function. This endpoint lets you keep
testing the RAG piece in isolation, over real HTTP, in the meantime.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import require_service_auth
from app.models.schemas import DetectionInput, InspectionReportOutput
from app.services import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post(
    "/generate-report",
    response_model=InspectionReportOutput,
    response_model_by_alias=True,
    dependencies=[Depends(require_service_auth)],
)
def generate_report(detection: DetectionInput) -> InspectionReportOutput:
    """
    Given a single detection result, retrieves grounding IRC guideline
    chunks and generates an inspectionReport + recommendedRepair via
    Gemini. Requires the X-Internal-Secret header (see app/core/security.py).
    """
    try:
        return rag_service.generate_inspection_report(detection)
    except ValueError as e:
        logger.warning(f"Report generation failed for {detection}: {e}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error generating report for {detection}: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Report generation failed.")
