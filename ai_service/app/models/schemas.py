"""
app/models/schemas.py

Pydantic models for request/response validation. These deliberately mirror
the field names in the Node backend's Complaint schema and enums.ts, so
there's no translation layer needed between what this service returns and
what Node's PATCH /api/complaints/:id/ai-analysis endpoint expects to save.
"""

from enum import Enum

from pydantic import BaseModel, Field


class DefectType(str, Enum):
    """Must stay in sync with backend/src/types/enums.ts DefectType."""
    POTHOLE = "pothole"
    CRACK = "crack"
    OPEN_MANHOLE = "open_manhole"
    WATERLOGGING = "waterlogging"


class Severity(str, Enum):
    """Must stay in sync with backend/src/types/enums.ts Severity."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DetectionInput(BaseModel):
    """
    A single detection result. Eventually this will be produced by YOLO +
    OpenCV; for now, it's what the caller (you, testing manually, or later
    Node) supplies directly to test the RAG report generation in isolation.
    """
    defect_type: DefectType = Field(..., alias="defectType")
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: Severity
    estimated_area_sq_m: float = Field(..., alias="estimatedAreaSqM", gt=0)

    model_config = {"populate_by_name": True}


class InspectionReportOutput(BaseModel):
    """Matches the Complaint schema's inspectionReport/recommendedRepair fields."""
    inspection_report: str = Field(..., alias="inspectionReport")
    recommended_repair: str = Field(..., alias="recommendedRepair")

    model_config = {"populate_by_name": True}
