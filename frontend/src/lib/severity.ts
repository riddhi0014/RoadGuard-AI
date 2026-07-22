import type { Severity } from "./mockComplaints";

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const getWorstSeverity = (
  detections: { severity?: Severity }[]
): Severity => {
  const valid = (detections || []).filter(
    (d): d is { severity: Severity } => !!d.severity && d.severity in SEVERITY_RANK
  );
  if (valid.length === 0) return "low";
  return valid.reduce((worst, d) =>
    SEVERITY_RANK[d.severity] > SEVERITY_RANK[worst] ? d.severity : worst,
    valid[0].severity
  );
};