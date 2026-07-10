import type { Severity } from "@/lib/mockComplaints";
import { cn } from "@/lib/utils";

const config: Record<Severity, { label: string; dot: string; bg: string; text: string }> = {
  critical: { label: "Critical", dot: "bg-severity-critical", bg: "bg-severity-critical-bg", text: "text-severity-critical" },
  high: { label: "High", dot: "bg-severity-high", bg: "bg-severity-high-bg", text: "text-severity-high" },
  medium: { label: "Medium", dot: "bg-severity-medium", bg: "bg-severity-medium-bg", text: "text-severity-medium" },
  low: { label: "Low", dot: "bg-severity-low", bg: "bg-severity-low-bg", text: "text-severity-low" },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const c = config[severity];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", c.bg, c.text)}>
        {c.label}
      </span>
    </span>
  );
}
