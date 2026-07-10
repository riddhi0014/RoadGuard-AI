import { Outlet, NavLink } from "react-router-dom";

export function CitizenLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Outlet />

      {/* Fixed bottom tab bar - mobile-first pattern, so it's always
          reachable with a thumb regardless of scroll position. */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md border-t border-border bg-paper">
        <NavLink
          to="/citizen/report"
          className={({ isActive }) =>
            `flex-1 py-2.5 text-center text-[10.5px] ${
              isActive ? "font-bold text-accent" : "text-ink-muted"
            }`
          }
        >
          Report
        </NavLink>
        <NavLink
          to="/citizen/complaints"
          className={({ isActive }) =>
            `flex-1 py-2.5 text-center text-[10.5px] ${
              isActive ? "font-bold text-accent" : "text-ink-muted"
            }`
          }
        >
          My Reports
        </NavLink>
      </div>
    </div>
  );
}
