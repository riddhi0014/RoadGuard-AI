import { X } from "lucide-react";
import type { Contractor } from "@/hooks/useContractors";

interface ContractorPanelProps {
  contractor: Contractor | null;
  onClose: () => void;
}

export function ContractorPanel({ contractor, onClose }: ContractorPanelProps) {
  const open = contractor !== null;

  return (
    <div
      className="flex-shrink-0 overflow-hidden border-l border-border bg-paper transition-[width] duration-200"
      style={{ width: open ? 300 : 0 }}
    >
      {contractor && (
        <div className="h-full w-[300px] overflow-auto p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-bold text-ink">
              {contractor.companyName ?? contractor.name}
            </span>
            <button onClick={onClose} aria-label="Close panel">
              <X className="h-4 w-4 text-ink-muted" />
            </button>
          </div>
          <div className="mb-3 text-xs text-ink-muted">{contractor.name}</div>
          <span
            className="mb-3.5 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={
              contractor.isVerifiedContractor
                ? { background: "#EDE9FE", color: "#6D28D9" }
                : { background: "#F3F4F6", color: "#6B7280" }
            }
          >
            {contractor.isVerifiedContractor ? "Verified" : "Unverified"}
          </span>
          <div className="space-y-1 text-xs text-ink-muted">
            <div className="flex justify-between border-b border-neutral-100 py-1">
              <span>Email</span>
              <span className="text-ink">{contractor.email ?? "—"}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 py-1">
              <span>Active jobs</span>
              <span className="font-semibold text-ink">
                {contractor.activeJobs ?? 0}
              </span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 py-1">
              <span>Completed jobs</span>
              <span className="font-semibold text-ink">
                {contractor.completedJobs ?? 0}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Joined</span>
              <span className="text-ink">
                {contractor.createdAt
                  ? new Date(contractor.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
