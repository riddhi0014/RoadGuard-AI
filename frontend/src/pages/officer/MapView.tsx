import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { OfficerTopbar } from "@/components/officer/OfficerTopbar";
import { FilterDropdown } from "@/components/officer/FilterDropdown";
import { InspectorPanel } from "@/components/officer/InspectorPanel";
import type { Complaint, Severity } from "@/lib/mockComplaints";
import { useComplaints } from "@/hooks/useComplaints";
import { cn } from "@/lib/utils";

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

// Matches the SeverityBadge color mapping - kept as hex here since
// Leaflet renders to canvas/SVG outside Tailwind's class scanning.
const severityHex: Record<Severity, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#D97706",
  low: "#0D9488",
};

const WARD_CENTER: [number, number] = [27.1767, 78.0081];

export function MapView() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const { complaints, loading, error, refetch } = useComplaints();

  const visible = complaints.filter(
    (c) =>
      (statusFilter === "all" || c.status === statusFilter) &&
      (severityFilter === "all" || c.severity === severityFilter)
  );

  const sortedByPriority = [...visible].sort((a, b) => b.priority - a.priority);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <OfficerTopbar page="Map view" searchPlaceholder="Search location" />

        <div className="flex items-center gap-2.5 border-b border-border px-4 py-2.5">
          <FilterDropdown
            label="All statuses"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="All severities"
            options={severityOptions}
            value={severityFilter}
            onChange={setSeverityFilter}
          />
          {loading && (
            <span className="ml-auto text-[11px] text-ink-muted">Loading…</span>
          )}
          {error && (
            <span className="ml-auto text-[11px] text-severity-critical">
              {error}
            </span>
          )}
          {!loading && !error && (
            <span className="ml-auto text-[11px] text-ink-muted">
              {visible.length} complaints visible on map
            </span>
          )}
        </div>

        <div className="flex min-h-0 flex-1">
          {/* List panel - sorted by priority, independent of map position,
              since triage priority matters more than geographic order. */}
          <div className="w-[280px] flex-shrink-0 overflow-auto border-r border-border">
            {sortedByPriority.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  "block w-full border-b border-neutral-100 px-3.5 py-2.5 text-left transition-colors",
                  selected?.id === c.id
                    ? "border-l-[3px] border-l-accent bg-status-approved-bg"
                    : "border-l-[3px] border-l-transparent hover:bg-neutral-50"
                )}
              >
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-[11.5px] font-bold text-accent">
                    {c.id}
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {c.priority}
                  </span>
                </div>
                <div className="mb-1 text-[11px] text-ink">{c.location}</div>
                <span className="flex items-center gap-1 text-[10.5px] text-ink-muted">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: severityHex[c.severity] }}
                  />
                  {c.severity}
                </span>
              </button>
            ))}
          </div>

          {/* Map */}
          <div className="relative flex-1">
            <MapContainer
              center={WARD_CENTER}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {visible.map((c) => (
                <CircleMarker
                  key={c.id}
                  center={[c.lat, c.lng]}
                  radius={selected?.id === c.id ? 10 : 7}
                  pathOptions={{
                    color: "#fff",
                    weight: 2,
                    fillColor: severityHex[c.severity],
                    fillOpacity: 0.9,
                  }}
                  eventHandlers={{ click: () => setSelected(c) }}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    {c.id} &middot; {c.location}
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>

            <div className="absolute bottom-3.5 left-3.5 z-[400] rounded-md border border-border bg-surface px-2.5 py-2 text-[10.5px] shadow-sm">
              <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-muted">
                SEVERITY
              </div>
              <div className="mb-0.5 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: severityHex.critical }}
                />
                Critical / High
              </div>
              <div className="mb-0.5 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: severityHex.medium }}
                />
                Medium
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: severityHex.low }}
                />
                Low
              </div>
            </div>
          </div>
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
