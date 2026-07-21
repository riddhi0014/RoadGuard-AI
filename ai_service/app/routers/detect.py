"""
app/routers/detect.py

End-to-end endpoint: image in -> YOLO detection -> (stubbed area/severity)
-> RAG report generation -> structured output.

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

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import require_service_auth
from app.models.schemas import DetectionInput, InspectionReportOutput
from app.services import rag_service, yolo_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/detect", tags=["detect"])


def _stub_estimate_area(detection: dict) -> float:
    """
    TODO(area-estimation): NOT REAL. Returns a placeholder based on
    pixel bbox fraction of image, with no real-world scale grounding.
    Replace once a scale-reference approach is decided (see module
    docstring). Tracked as an open item in the v3 project handoff.
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
    the real threshold logic (confidence? area? per-defect-type
    always-critical?) before relying on this. Tracked as an open item
    in the v3 project handoff.
    """
    if detection["confidence"] > 0.7:
        return "high"
    return "medium"


@router.post(
    "/analyze-image",
    response_model=InspectionReportOutput,
    response_model_by_alias=True,
    dependencies=[Depends(require_service_auth)],
)
async def analyze_image(image_path: str) -> InspectionReportOutput:
    logger.info(f"DEBUG: analyze_image called with image_path={image_path!r}")
    detections = yolo_service.detect_defects(image_path)

    if not detections:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No defects detected in image.",
        )

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
        return rag_service.generate_inspection_report(detection_input)
    except ValueError as e:
        logger.warning(f"Report generation failed: {e}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))