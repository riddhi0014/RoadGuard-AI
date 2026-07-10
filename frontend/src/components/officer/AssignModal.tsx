import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterDropdown } from "@/components/officer/FilterDropdown";
import { useContractors } from "@/hooks/useContractors";
import { api } from "@/lib/api";
import type { Complaint, ComplaintStatus } from "@/lib/mockComplaints";

interface AssignModalProps {
  complaint: Complaint;
  onClose: () => void;
  onSuccess: () => void;
}

const statusOptions: { value: ComplaintStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "approved", label: "Approved" },
  { value: "verified", label: "Verified" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

export function AssignModal({
  complaint,
  onClose,
  onSuccess,
}: AssignModalProps) {
  const { contractors } = useContractors();
  const [status, setStatus] = useState<string>(complaint.status);
  const [contractorId, setContractorId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractorOptions = [
    { value: "", label: "Unassigned" },
    ...contractors.map((c) => ({
      value: c.id,
      label: c.companyName ?? c.name,
    })),
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, string> = { status };
      if (contractorId) body.assignedContractor = contractorId;

      await api.patch(`/complaints/${complaint.id}`, body);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to update complaint");
    } finally {
      setSubmitting(false);
    }
  };

  // Rendered via portal directly into <body>, at a z-index above Leaflet's
  // internal panes (which can reach z-index 700). Without this, the modal
  // gets visually buried under the map's tiles/markers/tooltips on the
  // Map view page, even though it's still technically "open" in React state.
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-lg border border-border bg-paper p-4 shadow-lg">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-sm font-bold text-ink">Assign complaint</span>
          <button onClick={onClose} aria-label="Close">
            <X className="h-4 w-4 text-ink-muted" />
          </button>
        </div>

        <div className="mb-3 text-xs">
          <div className="mb-1 text-ink-muted">Status</div>
          <FilterDropdown
            label="Status"
            options={statusOptions}
            value={status}
            onChange={setStatus}
          />
        </div>

        <div className="mb-4 text-xs">
          <div className="mb-1 text-ink-muted">Contractor</div>
          <FilterDropdown
            label="Contractor"
            options={contractorOptions}
            value={contractorId}
            onChange={setContractorId}
          />
        </div>

        {error && (
          <div className="mb-3 text-xs text-severity-critical">{error}</div>
        )}

        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
