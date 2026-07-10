import { useState } from "react";
import { X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/officer/SeverityBadge";
import { StatusBadge } from "@/components/officer/StatusBadge";
import { AssignModal } from "@/components/officer/AssignModal";
import type { Complaint } from "@/lib/mockComplaints";
import { useNavigate } from "react-router-dom";

interface InspectorPanelProps {
  complaint: Complaint | null;
  onClose: () => void;
  onUpdated?: () => void; // parent's refetch, called after a successful assign
}

export function InspectorPanel({
  complaint,
  onClose,
  onUpdated,
}: InspectorPanelProps) {
  const [showAssign, setShowAssign] = useState(false);
  const open = complaint !== null;
  const navigate = useNavigate();

  return (
    <div
      className="flex-shrink-0 overflow-hidden border-l border-border bg-paper transition-[width] duration-200"
      style={{ width: open ? 320 : 0 }}
    >
      {complaint && (
        <div className="h-full w-80 overflow-auto p-4 opacity-100 transition-opacity delay-75 duration-150">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-semibold text-accent">{complaint.id}</span>
            <button onClick={onClose} aria-label="Close inspector">
              <X className="h-4 w-4 text-ink-muted" />
            </button>
          </div>
          <div className="mb-2.5 text-sm font-bold text-ink">
            {complaint.location}
          </div>
          <div className="mb-3.5 flex items-center gap-1.5">
            <SeverityBadge severity={complaint.severity} />
            <StatusBadge status={complaint.status} />
          </div>
          <div className="mb-3.5 flex h-24 items-center justify-center rounded-md bg-neutral-100">
            <ImageIcon className="h-5 w-5 text-ink-muted" />
          </div>
          <div className="space-y-1 text-xs text-ink-muted">
            <div className="flex justify-between py-0.5">
              <span>Reported</span>
              <span className="text-ink">
                {complaint.reportedAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                ,{" "}
                {complaint.reportedAt.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Priority score</span>
              <span className="font-semibold text-ink">
                {complaint.priority}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Contractor</span>
              <span className="text-ink">
                {complaint.contractor ?? "Unassigned"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => setShowAssign(true)}
            >
              Assign
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/officer/complaints/${complaint.id}`)}
            >
              View full
            </Button>
          </div>
        </div>
      )}

      {showAssign && complaint && (
        <AssignModal
          complaint={complaint}
          onClose={() => setShowAssign(false)}
          onSuccess={() => onUpdated?.()}
        />
      )}
    </div>
  );
}
