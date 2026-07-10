import { Link } from "react-router-dom";

export function Unauthorized() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
      <p className="font-mono text-sm text-danger">403</p>
      <h1 className="text-xl font-semibold text-ink">
        You don't have access to this page
      </h1>
      <p className="max-w-sm text-ink-muted">
        Your account role doesn't include this section. If this seems wrong,
        contact your administrator.
      </p>
      <Link
        to="/login"
        className="mt-2 text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to login
      </Link>
    </div>
  );
}
