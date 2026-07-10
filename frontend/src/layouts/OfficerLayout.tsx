import { Outlet } from "react-router-dom";
import { OfficerSidebar } from "@/components/officer/OfficerSidebar";

export function OfficerLayout() {
  return (
    <div className="flex min-h-screen bg-paper">
      <OfficerSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-[3px] bg-navy" />
        <Outlet />
      </div>
    </div>
  );
}
