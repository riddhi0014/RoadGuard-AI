import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// This is the one recurring visual signature across the whole app:
// every place a state or decision is shown - complaint status, defect
// severity, repair-quality verdict, fraud flags - uses this same
// component with the same color mapping. It mirrors traffic-signal
// semantics (red/amber/green), which this audience reads instinctively.
const signalVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning",
        danger: "bg-danger-bg text-danger",
        info: "bg-info-bg text-info",
        neutral: "bg-neutral-100 text-ink-muted",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export interface SignalIndicatorProps
  extends VariantProps<typeof signalVariants> {
  label: string;
  className?: string;
}

export function SignalIndicator({
  tone,
  label,
  className,
}: SignalIndicatorProps) {
  const dotColor = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    neutral: "bg-neutral-400",
  }[tone ?? "neutral"];

  return (
    <span className={cn(signalVariants({ tone }), className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
      {label}
    </span>
  );
}

// Convenience mappers so callers never hand-pick a tone inconsistently -
// pass the actual domain value and get the correct tone automatically.
export const severityToTone = {
  low: "success",
  medium: "warning",
  high: "danger",
} as const;

export const complaintStatusToTone = {
  pending: "neutral",
  ai_analyzed: "info",
  assigned: "info",
  in_progress: "warning",
  completed: "warning",
  verified: "info",
  approved: "success",
  rejected: "danger",
} as const;
