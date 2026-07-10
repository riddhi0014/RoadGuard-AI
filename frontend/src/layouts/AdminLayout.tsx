import { Outlet, NavLink } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-[220px] flex-shrink-0 flex-col bg-[#1E2A47] p-4 text-white">
        <div className="mb-7 flex items-center gap-2 font-bold">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#34456B]">
            R
          </div>
          ROADGUARD AI
        </div>
        <div className="mb-2 mt-4 text-[10px] tracking-wide text-[#8B97B5]">
          MANAGE
        </div>
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `mb-0.5 rounded-md px-2.5 py-2 text-[12.5px] ${
              isActive
                ? "bg-[#34456B] font-semibold text-white"
                : "text-[#C7CFE0]"
            }`
          }
        >
          Users
        </NavLink>
        <NavLink
          to="/admin/analytics"
          className={({ isActive }) =>
            `mb-0.5 rounded-md px-2.5 py-2 text-[12.5px] ${
              isActive
                ? "bg-[#34456B] font-semibold text-white"
                : "text-[#C7CFE0]"
            }`
          }
        >
          Analytics
        </NavLink>
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `mb-0.5 rounded-md px-2.5 py-2 text-[12.5px] ${
              isActive
                ? "bg-[#34456B] font-semibold text-white"
                : "text-[#C7CFE0]"
            }`
          }
        >
          Settings
        </NavLink>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
