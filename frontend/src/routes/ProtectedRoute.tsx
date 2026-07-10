import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/roles";

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

// Wraps a group of routes. If not logged in -> /login.
// If logged in but wrong role -> /unauthorized (not silently redirected
// to their own dashboard - being explicit about "you can't be here" is
// better UX than a confusing silent redirect).
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-ink-muted">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
