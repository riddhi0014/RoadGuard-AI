import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string; // e.g. "text-severity-critical"
  bgClass: string; // e.g. "bg-severity-critical-bg"
  sparklinePoints?: string; // SVG polyline points, in a 0-200 x 0-22 viewBox
}

export function KpiCard({ label, value, icon: Icon, colorClass, bgClass, sparklinePoints }: KpiCardProps) {
  return (
    <Card className="p-3.5 shadow-none">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </span>
        <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full ${bgClass}`}>
          <Icon className={`h-3.5 w-3.5 ${colorClass}`} strokeWidth={2} />
        </span>
      </div>
      <div className={`mb-1.5 text-2xl font-bold ${colorClass}`}>{value}</div>
      {sparklinePoints && (
        <svg width="100%" height="22" viewBox="0 0 200 22" preserveAspectRatio="none">
          <polyline
            points={sparklinePoints}
            fill="none"
            className={colorClass}
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      )}
    </Card>
  );
}
