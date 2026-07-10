import { NavLink } from "react-router-dom";
import { ShieldCheck, FileText, Map, Users, BarChart3, Settings, AlertTriangle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const views = [{ to: "/officer/dashboard", label: "Complaints", icon: FileText, count: 142 }];
const mapView = { to: "/officer/map", label: "Map view", icon: Map };
const manage = [
  { to: "/officer/contractors", label: "Contractors", icon: Users },
  { to: "/officer/analytics", label: "Analytics", icon: BarChart3 },
];

export function OfficerSidebar() {
  return (
    <div className="flex w-[230px] flex-shrink-0 flex-col bg-navy text-white">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4.5">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-navy-elevated">
          <ShieldCheck className="h-[18px] w-[18px] text-white" />
        </div>
        <span className="text-sm font-bold tracking-wide">ROADGUARD AI</span>
      </div>

      <div className="flex-1 px-3 py-3.5">
        <div className="mb-1.5 px-2.5 text-[10px] tracking-wider text-[#8B96AE]">VIEWS</div>
        {views.map((v) => (
          <NavLink
            key={v.to}
            to={v.to}
            className={({ isActive }) =>
              cn(
                "mb-0.5 flex items-center justify-between rounded-md px-2.5 py-2 text-[13px]",
                isActive ? "bg-white/10 font-semibold text-white" : "text-[#B7C0D6]"
              )
            }
          >
            <span className="flex items-center gap-2">
              <v.icon className="h-4 w-4" />
              {v.label}
            </span>
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10.5px]">{v.count}</span>
          </NavLink>
        ))}
        <NavLink
          to={mapView.to}
          className={({ isActive }) =>
            cn(
              "mb-0.5 flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px]",
              isActive ? "bg-white/10 font-semibold text-white" : "text-[#B7C0D6]"
            )
          }
        >
          <mapView.icon className="h-4 w-4" />
          {mapView.label}
        </NavLink>

        <div className="mb-1.5 mt-3.5 px-2.5 text-[10px] tracking-wider text-[#8B96AE]">MANAGE</div>
        {manage.map((v) => (
          <NavLink
            key={v.to}
            to={v.to}
            className={({ isActive }) =>
              cn(
                "mb-0.5 flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px]",
                isActive ? "bg-white/10 font-semibold text-white" : "text-[#B7C0D6]"
              )
            }
          >
            <v.icon className="h-4 w-4" />
            {v.label}
          </NavLink>
        ))}
      </div>

      <div className="px-3">
        <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-[#B7C0D6]">
          <Settings className="h-4 w-4" />
          Settings
        </div>
      </div>

      <div className="m-3 rounded-lg border border-[#6B3540] bg-[#3D2530] px-3 py-2.5">
        <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#F0A5A5]">
          <AlertTriangle className="h-3.5 w-3.5" />3 OVERDUE &gt; 48H
        </div>
        <div className="text-[10.5px] text-[#C99DA3]">Needs reassignment today</div>
      </div>

      <div className="flex items-center gap-2.5 border-t border-white/10 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-elevated text-[11px] font-bold">
          PS
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-xs font-semibold">P. Sharma</div>
          <div className="text-[10px] text-[#8B96AE]">Senior Inspector</div>
        </div>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9.5px] text-[#B7C0D6]">Ward 4</span>
        <LogOut className="h-3.5 w-3.5 text-[#8B96AE]" />
      </div>
    </div>
  );
}
