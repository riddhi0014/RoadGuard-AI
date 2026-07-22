import axios from "axios";
import Complaint from "../models/Complaint";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET as string;

interface AiAnalysisResult {
  inspectionReport: string;
  recommendedRepair: string;
  defectType: string;
  confidence: number;
  severity: string;
  estimatedAreaSqM: number;
}

/**
 * Calls the Python AI service to analyze a complaint's first photo, and
 * saves the result directly onto the complaint document. Runs in the
 * background (fire-and-forget from the controller's perspective) so the
 * citizen's request doesn't wait on YOLO/Gemini latency.
 *
 * If the AI service finds no defects, or the call fails for any reason,
 * this logs the issue and leaves the complaint's detections empty rather
 * than throwing — a complaint with no AI analysis is still a valid,
 * reviewable complaint; an officer can assess it manually.
 */
export async function analyzeComplaintPhoto(complaintId: string, imageUrl: string): Promise<void> {
  try {
    const response = await axios.post<AiAnalysisResult>(
      `${AI_SERVICE_URL}/detect/analyze-image`,
      null,
      {
        params: { image_url: imageUrl },
        headers: { "X-Internal-Secret": AI_SERVICE_SECRET },
        timeout: 300000, // 5 minutes 
      }
    );

    const { inspectionReport, recommendedRepair, defectType, confidence, severity, estimatedAreaSqM } =
      response.data;

    await Complaint.findByIdAndUpdate(complaintId, {
      inspectionReport,
      recommendedRepair,
      detections: [
        {
          defectType,
          confidence,
          severity,
          estimatedAreaSqM,
        },
      ],
    });

    console.log(`AI analysis complete for complaint ${complaintId}`);
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`AI service found no defects for complaint ${complaintId} — leaving detections empty.`);
    } else {
      console.error(`AI analysis failed for complaint ${complaintId}:`, error.message);
    }
    // Deliberately not re-thrown — a failed/empty AI analysis should never
    // block or break the complaint itself.
  }
}