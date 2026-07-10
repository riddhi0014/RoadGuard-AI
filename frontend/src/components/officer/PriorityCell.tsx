function band(priority: number) {
  if (priority >= 80) return { bar: "bg-severity-critical", bg: "bg-severity-critical-bg", text: "text-severity-critical" };
  if (priority >= 60) return { bar: "bg-severity-high", bg: "bg-severity-high-bg", text: "text-severity-high" };
  if (priority >= 40) return { bar: "bg-severity-medium", bg: "bg-severity-medium-bg", text: "text-severity-medium" };
  return { bar: "bg-neutral-400", bg: "bg-neutral-100", text: "text-ink-muted" };
}

export function PriorityCell({ priority }: { priority: number }) {
  const b = band(priority);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
        <div className={`h-full ${b.bar}`} style={{ width: `${priority}%` }} />
      </div>
      <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${b.bg} ${b.text}`}>
        {priority}
      </span>
    </div>
  );
}
