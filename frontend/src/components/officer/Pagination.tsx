import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  // Show up to 6 page numbers, then an ellipsis - keeps this readable
  // even when there are 100+ pages of complaints.
  const visiblePages = Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-1 text-xs">
      {visiblePages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded",
            p === page ? "bg-accent font-semibold text-accent-foreground" : "text-ink-muted hover:bg-neutral-50"
          )}
        >
          {p}
        </button>
      ))}
      {totalPages > 6 && <span className="px-1 text-ink-muted">&hellip;</span>}
    </div>
  );
}
