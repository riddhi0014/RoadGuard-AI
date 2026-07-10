import { useMemo, useState } from "react";
import { AlertTriangle, Users, Clock, ArrowUpDown } from "lucide-react";
import { OfficerTopbar } from "@/components/officer/OfficerTopbar";
import { KpiCard } from "@/components/officer/KpiCard";
import { FilterDropdown } from "@/components/officer/FilterDropdown";
import { SeverityBadge } from "@/components/officer/SeverityBadge";
import { StatusBadge } from "@/components/officer/StatusBadge";
import { PriorityCell } from "@/components/officer/PriorityCell";
import { Pagination } from "@/components/officer/Pagination";
import { InspectorPanel } from "@/components/officer/InspectorPanel";
import type { Complaint } from "@/lib/mockComplaints";
import { useComplaints } from "@/hooks/useComplaints";

const PER_PAGE = 9;

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "approved", label: "Approved" },
  { value: "verified", label: "Verified" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const severityOptions = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function OfficerDashboard() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortCol, setSortCol] = useState<"date" | "priority" | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Complaint | null>(null);

  const { complaints, loading, error, refetch } = useComplaints();
  const filtered = useMemo(() => {
    let rows = complaints.filter(
      (c) =>
        (statusFilter === "all" || c.status === statusFilter) &&
        (severityFilter === "all" || c.severity === severityFilter)
    );
    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        const av = sortCol === "date" ? a.reportedAt.getTime() : a.priority;
        const bv = sortCol === "date" ? b.reportedAt.getTime() : b.priority;
        return (av - bv) * sortDir;
      });
    }
    return rows;
  }, [complaints, statusFilter, severityFilter, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleSort(col: "date" | "priority") {
    if (sortCol === col) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortCol(col);
      setSortDir(1);
    }
  }

  const highSeverityCount = complaints.filter(
    (c) => c.severity === "critical" || c.severity === "high"
  ).length;
  const unassignedCount = complaints.filter(
    (c) => !c.contractor && c.status !== "completed"
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === "in_progress"
  ).length;

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <OfficerTopbar
          page="Complaints"
          searchPlaceholder="Search complaints..."
        />

        <div className="grid grid-cols-4 gap-3.5 border-b border-border p-4">
          <KpiCard
            label="High severity"
            value={highSeverityCount}
            icon={AlertTriangle}
            colorClass="text-severity-critical"
            bgClass="bg-severity-critical-bg"
            sparklinePoints="0,15 30,12 60,17 90,8 120,13 150,6 200,9"
          />
          <KpiCard
            label="Unassigned"
            value={unassignedCount}
            icon={Users}
            colorClass="text-severity-medium"
            bgClass="bg-severity-medium-bg"
            sparklinePoints="0,10 30,11 60,9 90,12 120,10 150,11 200,10"
          />
          <KpiCard
            label="In progress"
            value={inProgressCount}
            icon={Clock}
            colorClass="text-accent"
            bgClass="bg-status-approved-bg"
            sparklinePoints="0,12 30,13 60,11 90,12 120,10 150,12 200,11"
          />
          <div className="flex items-center gap-3 rounded-lg border border-border p-3.5">
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              className="flex-shrink-0"
            >
              <circle
                cx="26"
                cy="26"
                r="21"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="6"
              />
              <circle
                cx="26"
                cy="26"
                r="21"
                fill="none"
                className="stroke-status-completed-text"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="132"
                strokeDashoffset="34"
                transform="rotate(-90 26 26)"
              />
              <text
                x="26"
                y="30"
                textAnchor="middle"
                className="fill-ink text-[11px] font-bold"
              >
                74%
              </text>
            </svg>
            <div>
              <div className="text-[10px] tracking-wide text-ink-muted">
                VERIFIED THIS WEEK
              </div>
              <div className="text-[11px] text-neutral-400">since 27/06</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <FilterDropdown
            label="All statuses"
            options={statusOptions}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          />
          <FilterDropdown
            label="All severities"
            options={severityOptions}
            value={severityFilter}
            onChange={(v) => {
              setSeverityFilter(v);
              setPage(1);
            }}
          />
          <span className="ml-auto flex items-center gap-1 text-[11.5px] text-accent">
            <ArrowUpDown className="h-3 w-3" />
            Click column headers to sort
          </span>
        </div>

        <div className="flex-1 overflow-auto px-4">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="w-8 py-2.5" />
                <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                  COMPLAINT
                </th>
                <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                  SEVERITY
                </th>
                <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                  STATUS
                </th>
                <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                  CONTRACTOR
                </th>
                <th
                  className="cursor-pointer px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted"
                  onClick={() => toggleSort("date")}
                >
                  REPORTED
                </th>
                <th
                  className="cursor-pointer px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted"
                  onClick={() => toggleSort("priority")}
                >
                  PRIORITY <ArrowUpDown className="inline h-2.5 w-2.5" />
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                >
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" />
                  </td>
                  <td className="px-2 py-3">
                    <div className="font-bold text-accent">{c.id}</div>
                    <div className="text-[11px] text-ink-muted">
                      {c.location}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <SeverityBadge severity={c.severity} />
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-2 py-3">
                    {c.contractor ? (
                      <span className="text-ink">{c.contractor}</span>
                    ) : (
                      <span className="italic text-neutral-400">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-ink-muted">
                    <div>
                      {c.reportedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1 text-neutral-400">
                      <Clock className="h-2.5 w-2.5" />
                      {c.reportedAt.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <PriorityCell priority={c.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-[11.5px] text-ink-muted">
            Showing {pageRows.length} of {filtered.length}
          </span>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
      <InspectorPanel
        complaint={selected}
        onClose={() => setSelected(null)}
        onUpdated={refetch}
      />{" "}
    </div>
  );
}
