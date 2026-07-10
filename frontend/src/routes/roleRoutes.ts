import type { Role } from "@/types/roles";

// Where each role lands immediately after logging in.
export const defaultRouteForRole: Record<Role, string> = {
  citizen: "/citizen/dashboard",
  officer: "/officer/dashboard",
  contractor: "/contractor/dashboard",
  admin: "/admin/dashboard",
};
