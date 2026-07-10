import type { Complaint, ComplaintStatus, Severity } from "./mockComplaints";
import { getWorstSeverity } from "./severity";

interface ApiDetection {
  defectType: string;
  confidence: number;
  severity: Severity;
  estimatedAreaSqM?: number;
}

interface ApiComplaint {
  _id: string;
  description?: string;
  address?: string;
  location: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  detections: ApiDetection[];
  priorityScore?: number;
  status: ComplaintStatus;
  assignedContractor?: { _id: string; name: string } | null;
  assignedOfficer?: { _id: string; name: string } | null;
  createdAt: string;
}

export function adaptComplaint(api: ApiComplaint): Complaint {
  const [lng, lat] = api.location.coordinates;

  return {
    id: api._id,
    location: api.address ?? api.description ?? "Location pending geocoding",
    severity: getWorstSeverity(api.detections ?? []),
    status: api.status,
    contractor: api.assignedContractor?.name ?? null,
    reportedAt: new Date(api.createdAt),
    priority: api.priorityScore ?? 0,
    lat,
    lng,
  };
}