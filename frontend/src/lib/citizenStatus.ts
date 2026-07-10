import type { ComplaintStatus } from "./mockComplaints";

export type CitizenStatus = "Pending" | "In Progress" | "Under Review" | "Completed" | "Rejected";

const STATUS_MAP: Record<ComplaintStatus, CitizenStatus> = {
  pending: "Pending",
  assigned: "In Progress",
  in_progress: "In Progress",
  approved: "Under Review",
  verified: "Under Review",
  completed: "Completed",
  rejected: "Rejected",
};

export const CITIZEN_STATUS_COLORS: Record<CitizenStatus, { bg: string; text: string }> = {
  Pending: { bg: "#F3F4F6", text: "#6B7280" },
  "In Progress": { bg: "#FEF3C7", text: "#92400E" },
  "Under Review": { bg: "#DBEAFE", text: "#1E40AF" },
  Completed: { bg: "#D1FAE5", text: "#065F46" },
  Rejected: { bg: "#FEE2E2", text: "#991B1B" },
};

export function toCitizenStatus(status: ComplaintStatus): CitizenStatus {
  return STATUS_MAP[status] ?? "Pending";
}