import { Outlet } from "react-router-dom";

// No bottom tab nav needed here, unlike CitizenLayout - contractors only
// have one top-level view (Assigned Jobs), with job detail as a drill-in
// page reached by tapping a card, not a separate tab.
export function ContractorLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Outlet />
    </div>
  );
}
