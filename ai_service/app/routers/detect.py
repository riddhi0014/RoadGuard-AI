"""
app/routers/detect.py

End-to-end endpoint: image URL in -> download -> YOLO detection ->
(stubbed area/severity) -> RAG report generation -> structured output,
including the raw detection details (defectType, confidence, severity,
estimatedAreaSqM) alongside the report text, so the Node backend can
save everything to the complaint in one response.

IMPORTANT: this route intentionally has NO response_model and NO return
type annotation. FastAPI uses either of those to filter/strip the
returned dict down to only the declared fields — since we deliberately
return extra fields (defectType, confidence, severity, estimatedAreaSqM)
beyond what InspectionReportOutput declares, adding either back will
silently drop those fields from the response again (this happened twice
already — once via response_model, then again via the -> return type
hint after removing response_model alone didn't fix it).

STUBBED — see TODOs below. Two pieces are deliberately NOT implemented
yet because they're product decisions, not technical ones:
  1. estimated_area_sq_m — needs a real-world scale reference (camera
     height, GPS-based scale, or reference object) that the platform
     doesn't currently capture at photo-submission time.
  2. severity — needs a decided rule (confidence threshold? area
     threshold? always-CRITICAL for certain defect types?).
Both currently return placeholder values so the pipeline is testable
end-to-end. DO NOT ship these placeholders to production — replace
before this endpoint is used for real citizen reports.
"""

import logging
import tempfile
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import require_service_auth
from app.models.schemas import DetectionInput
from app.services import rag_service, yolo_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/detect", tags=["detect"])


def _stub_estimate_area(detection: dict) -> float:
    """
    TODO(area-estimation): NOT REAL. Returns a placeholder based on
    pixel bbox fraction of image, with no real-world scale grounding.
    Replace once a scale-reference approach is decided.
    """
    bbox = detection["bbox_pixels"]
    img = detection["image_dims"]
    pixel_area = (bbox["x2"] - bbox["x1"]) * (bbox["y2"] - bbox["y1"])
    total_area = img["width"] * img["height"]
    fraction = pixel_area / total_area
    ASSUMED_ROAD_PATCH_SQ_M = 20.0  # arbitrary placeholder, NOT calibrated
    return round(fraction * ASSUMED_ROAD_PATCH_SQ_M, 2)


def _stub_assign_severity(detection: dict, estimated_area_sq_m: float) -> str:
    """
    TODO(severity-rule): NOT DECIDED. Placeholder rule only — confirm
    the real threshold logic before relying on this.
    """
    if detection["confidence"] > 0.7:
        return "high"
    return "medium"


def _download_image(image_url: str) -> str:
    """Downloads a remote image (e.g. a Cloudinary URL) to a temp file
    and returns the local path, since YOLO/the ML server need a local
    file path to read from."""
    response = httpx.get(image_url, timeout=15.0)
    response.raise_for_status()

    suffix = Path(image_url.split("?")[0]).suffix or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(response.content)
    tmp.close()
    return tmp.name


@router.post(
    "/analyze-image",
    dependencies=[Depends(require_service_auth)],
)
async def analyze_image(image_url: str):
    """
    Downloads the image at image_url (e.g. a Cloudinary URL), runs YOLO
    detection, then generates a grounded report via the RAG pipeline.
    Returns the report text PLUS the raw detection fields (defectType,
    confidence, severity, estimatedAreaSqM) in one flat JSON object.
    """
    try:
        local_path = _download_image(image_url)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not download image: {e}")

    try:
        detections = yolo_service.detect_defects(local_path)
    finally:
        Path(local_path).unlink(missing_ok=True)  # clean up temp file either way

    if not detections:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No defects detected in image.")

    top_detection = max(detections, key=lambda d: d["confidence"])
    area = _stub_estimate_area(top_detection)
    severity = _stub_assign_severity(top_detection, area)

    detection_input = DetectionInput(
        defect_type=top_detection["defect_type"],
        confidence=top_detection["confidence"],
        severity=severity,
        estimated_area_sq_m=area,
    )

    try:
        report = rag_service.generate_inspection_report(detection_input)
    except ValueError as e:
        logger.warning(f"Report generation failed: {e}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    return {
        **report.model_dump(by_alias=True),
        "defectType": top_detection["defect_type"],
        "confidence": top_detection["confidence"],
        "severity": severity,
        "estimatedAreaSqM": area,
    }