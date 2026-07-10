import type { ComplaintStatus } from "@/lib/mockComplaints";
import { cn } from "@/lib/utils";

const config: Record<ComplaintStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-status-pending-bg", text: "text-status-pending-text" },
  assigned: { label: "Assigned", bg: "bg-status-assigned-bg", text: "text-status-assigned-text" },
  in_progress: { label: "In Progress", bg: "bg-status-progress-bg", text: "text-status-progress-text" },
  approved: { label: "Approved", bg: "bg-status-approved-bg", text: "text-status-approved-text" },
  verified: { label: "Verified", bg: "bg-status-verified-bg", text: "text-status-verified-text" },
  completed: { label: "Completed", bg: "bg-status-completed-bg", text: "text-status-completed-text" },
  rejected: { label: "Rejected", bg: "bg-status-rejected-bg", text: "text-status-rejected-text" },
};

export function StatusBadge({ status, className }: { status: ComplaintStatus; className?: string }) {
  const c = config[status];
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", c.bg, c.text, className)}>
      {c.label}
    </span>
  );
}
