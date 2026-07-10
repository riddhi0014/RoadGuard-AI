import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { OfficerTopbar } from "@/components/officer/OfficerTopbar";
import { useAnalytics } from "@/hooks/useAnalytics";

// Matches your StatusBadge color mapping from the design system.
const STATUS_COLORS: Record<string, string> = {
  pending: "#9CA3AF",
  assigned: "#818CF8",
  in_progress: "#F59E0B",
  approved: "#2563EB",
  verified: "#A78BFA",
  completed: "#10B981",
  rejected: "#EF4444",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#D97706",
  low: "#0D9488",
};

const SEVERITY_ORDER = ["critical", "high", "medium", "low"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  approved: "Approved",
  verified: "Verified",
  completed: "Completed",
  rejected: "Rejected",
};

export function Analytics() {
  const { data, loading } = useAnalytics(30);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <OfficerTopbar page="Analytics" searchPlaceholder="Search analytics..." />

      {loading || !data ? (
        <div className="py-16 text-center text-sm text-ink-muted">
          Loading analytics…
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-5">
          {/* Complaints over time */}
          <div className="col-span-2 rounded-lg border border-border bg-paper p-4">
            <div className="mb-3.5 text-[11px] font-bold tracking-wide text-ink-muted">
              COMPLAINTS OVER TIME
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.overTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  interval={Math.ceil(data.overTime.length / 8)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  allowDecimals={false}
                />
                <Tooltip
                  labelFormatter={(d) =>
                    new Date(d).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status breakdown */}
          <div className="rounded-lg border border-border bg-paper p-4">
            <div className="mb-3.5 text-[11px] font-bold tracking-wide text-ink-muted">
              STATUS BREAKDOWN
            </div>
            {data.statusBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                No complaints in this window yet.
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie
                      data={data.statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={35}
                      outerRadius={60}
                    >
                      {data.statusBreakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? "#9CA3AF"}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {data.statusBreakdown.map((entry) => (
                    <div
                      key={entry.status}
                      className="flex items-center gap-2 text-[11.5px]"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background: STATUS_COLORS[entry.status] ?? "#9CA3AF",
                        }}
                      />
                      {STATUS_LABELS[entry.status] ?? entry.status} (
                      {entry.count})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Severity distribution */}
          <div className="rounded-lg border border-border bg-paper p-4">
            <div className="mb-3.5 text-[11px] font-bold tracking-wide text-ink-muted">
              SEVERITY DISTRIBUTION
            </div>
            <div className="space-y-3">
              {SEVERITY_ORDER.map((sev) => {
                const entry = data.severityBreakdown.find(
                  (s) => s.severity === sev
                );
                const count = entry?.count ?? 0;
                const max = Math.max(
                  ...data.severityBreakdown.map((s) => s.count),
                  1
                );
                return (
                  <div key={sev} className="flex items-center gap-2.5">
                    <div className="w-14 text-[11.5px] capitalize text-ink-muted">
                      {sev}
                    </div>
                    <div className="h-3.5 flex-1 overflow-hidden rounded bg-neutral-100">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${(count / max) * 100}%`,
                          background: SEVERITY_COLORS[sev],
                        }}
                      />
                    </div>
                    <div className="w-6 text-right text-[11.5px] font-semibold">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contractor performance */}
          <div className="col-span-2 rounded-lg border border-border bg-paper p-4">
            <div className="mb-3.5 text-[11px] font-bold tracking-wide text-ink-muted">
              TOP CONTRACTORS BY COMPLETED JOBS
            </div>
            {data.contractorPerformance.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                No completed jobs yet — this fills in once contractors finish
                assigned work.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(120, data.contractorPerformance.length * 40)}
              >
                <BarChart data={data.contractorPerformance} layout="vertical">
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#6B7280" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: "#111827" }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="completedJobs"
                    fill="#0D9488"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
