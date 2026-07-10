import type { Severity } from "./mockComplaints";

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const getWorstSeverity = (
  detections: { severity: Severity }[]
): Severity => {
  if (!detections || detections.length === 0) return "low";
  return detections.reduce((worst, d) => {
    return SEVERITY_RANK[d.severity] > SEVERITY_RANK[worst] ? d.severity : worst;
  }, detections[0].severity);
};