// Must stay in sync with backend/src/types/enums.ts -> Role
export type Role = "citizen" | "officer" | "contractor" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
