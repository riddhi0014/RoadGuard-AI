import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAssignedJobs } from "@/hooks/useAssignedJobs";
import { getWorstSeverity } from "@/lib/severity";

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: "#FEE2E2", text: "#DC2626" },
  high: { bg: "#FFEDD5", text: "#EA580C" },
  medium: { bg: "#FEF3C7", text: "#D97706" },
  low: { bg: "#CCFBF1", text: "#0D9488" },
};

export function AssignedJobs() {
  const { jobs, loading } = useAssignedJobs();
  const [tab, setTab] = useState<"active" | "completed">("active");
  const navigate = useNavigate();

  const active = useMemo(
    () =>
      jobs.filter((j) => j.status !== "completed" && j.status !== "rejected"),
    [jobs]
  );
  const completed = useMemo(
    () => jobs.filter((j) => j.status === "completed"),
    [jobs]
  );
  const visible = tab === "active" ? active : completed;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-50 pb-24">
      <div className="bg-[#1E2A47] px-5 py-4 text-white">
        <div className="text-base font-bold">Assigned Jobs</div>
        <div className="mt-0.5 text-[11.5px] text-[#A9B4CC]">
          {active.length} active &middot; {completed.length} completed
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3.5 flex gap-2">
          <button
            onClick={() => setTab("active")}
            className={`rounded-full px-3 py-1.5 text-[11px] ${
              tab === "active"
                ? "bg-[#1E2A47] text-white"
                : "border border-border text-ink-muted"
            }`}
          >
            Active ({active.length})
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`rounded-full px-3 py-1.5 text-[11px] ${
              tab === "completed"
                ? "bg-[#1E2A47] text-white"
                : "border border-border text-ink-muted"
            }`}
          >
            Completed ({completed.length})
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            Loading jobs…
          </div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            {tab === "active"
              ? "No active jobs right now."
              : "No completed jobs yet."}
          </div>
        ) : (
          visible.map((job) => {
            const severity = getWorstSeverity(job.detections as any);
            const colors = SEVERITY_COLORS[severity];
            return (
              <div
                key={job._id}
                onClick={() => navigate(`/contractor/jobs/${job._id}`)}
                className="mb-2.5 flex cursor-pointer gap-2.5 rounded-lg border border-border bg-white p-3"
              >
                <div className="h-[54px] w-[54px] flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {job.images[0] && (
                    <img
                      src={job.images[0]}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate text-xs font-bold text-ink">
                      {job.address ?? job.description ?? "Location pending"}
                    </div>
                    <div className="flex-shrink-0 text-[10px] text-ink-muted">
                      {new Date(job.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <span
                    className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {severity} priority
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
