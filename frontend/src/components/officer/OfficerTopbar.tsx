import { Search, Bell } from "lucide-react";

export function OfficerTopbar({ page, searchPlaceholder }: { page: string; searchPlaceholder: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-[22px] py-3">
      <div className="text-[12.5px] text-ink-muted">
        Ward 4 <span className="mx-1 text-neutral-300">&rsaquo;</span>{" "}
        <span className="font-bold text-ink">{page}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-[30px] w-48 items-center gap-1.5 rounded-md border border-border px-2.5">
          <Search className="h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="h-full flex-1 bg-transparent text-[11.5px] text-ink outline-none placeholder:text-neutral-400"
          />
        </div>
        <span className="relative">
          <Bell className="h-4 w-4 text-ink-muted" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-severity-critical" />
        </span>
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-navy text-[9px] font-bold text-white">
          PS
        </div>
      </div>
    </div>
  );
}
