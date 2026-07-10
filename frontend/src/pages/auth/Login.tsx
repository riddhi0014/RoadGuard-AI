import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { defaultRouteForRole } from "@/routes/roleRoutes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(defaultRouteForRole[user.role], { replace: true });
    } catch (err: any) {
      // Show the backend's specific message when available (e.g. "account
      // deactivated") and only fall back to the generic message for genuine
      // invalid-credentials cases or unexpected errors.
      setError(
        err.response?.data?.message ??
          "That email and password combination doesn't match our records."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
        <div className="flex items-center gap-2">
          <RouteMark />
          <span className="text-lg font-semibold tracking-tight">
            RoadGuard AI
          </span>
        </div>
        <div className="max-w-sm">
          <p className="text-2xl font-medium leading-snug">
            Every reported defect, tracked from report to verified repair.
          </p>
          <p className="mt-4 text-sm text-primary-foreground/70">
            Citizen reports, AI inspection, and contractor accountability in one
            system.
          </p>
        </div>
        <p className="font-mono text-xs text-primary-foreground/50">
          v0.1 — internal build
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center border-t-2 border-dashed border-border p-8 md:border-l-2 md:border-t-0">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Use the account issued to you as a citizen, officer, contractor, or
            admin.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Small mark used next to the wordmark - three short dashes suggesting
// a lane line, reused later as the status-tracker signature element.
function RouteMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="10"
        y1="1"
        x2="10"
        y2="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="8.5"
        x2="10"
        y2="13.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="16"
        x2="10"
        y2="19"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
