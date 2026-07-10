import { useMemo, useState } from "react";
import { OfficerTopbar } from "@/components/officer/OfficerTopbar";
import { FilterDropdown } from "@/components/officer/FilterDropdown";
import { ContractorPanel } from "@/components/officer/ContractorPanel";
import { useContractors, type Contractor } from "@/hooks/useContractors";

const verificationOptions = [
  { value: "all", label: "All verification statuses" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
];

export function Contractors() {
  const { contractors, loading } = useContractors();
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [selected, setSelected] = useState<Contractor | null>(null);

  const filtered = useMemo(() => {
    return contractors.filter((c) => {
      if (verificationFilter === "verified") return c.isVerifiedContractor;
      if (verificationFilter === "unverified") return !c.isVerifiedContractor;
      return true;
    });
  }, [contractors, verificationFilter]);

  const totalContractors = contractors.length;
  const verifiedCount = contractors.filter(
    (c) => c.isVerifiedContractor
  ).length;
  const unverifiedCount = totalContractors - verifiedCount;
  const activeJobsSum = contractors.reduce(
    (sum, c) => sum + (c.activeJobs ?? 0),
    0
  );

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <OfficerTopbar
          page="Contractors"
          searchPlaceholder="Search contractors..."
        />

        <div className="grid grid-cols-4 gap-3.5 border-b border-border p-4">
          <div className="rounded-lg border border-border p-3.5">
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-muted">
              TOTAL CONTRACTORS
            </div>
            <div className="text-xl font-bold text-ink">{totalContractors}</div>
          </div>
          <div className="rounded-lg border border-border p-3.5">
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-muted">
              VERIFIED
            </div>
            <div className="text-xl font-bold" style={{ color: "#6D28D9" }}>
              {verifiedCount}
            </div>
          </div>
          <div className="rounded-lg border border-border p-3.5">
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-muted">
              ACTIVE JOBS
            </div>
            <div className="text-xl font-bold text-severity-medium">
              {activeJobsSum}
            </div>
          </div>
          <div className="rounded-lg border border-border p-3.5">
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-muted">
              UNVERIFIED
            </div>
            <div className="text-xl font-bold text-ink-muted">
              {unverifiedCount}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <FilterDropdown
            label="All verification statuses"
            options={verificationOptions}
            value={verificationFilter}
            onChange={setVerificationFilter}
          />
        </div>

        <div className="flex-1 overflow-auto px-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-ink-muted">
              Loading contractors…
            </div>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                    CONTRACTOR
                  </th>
                  <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                    VERIFICATION
                  </th>
                  <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                    ACTIVE JOBS
                  </th>
                  <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                    COMPLETED
                  </th>
                  <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                    CONTACT
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                  >
                    <td className="px-2 py-3">
                      <div className="font-bold text-accent">
                        {c.companyName ?? c.name}
                      </div>
                      <div className="text-[11px] text-ink-muted">{c.name}</div>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={
                          c.isVerifiedContractor
                            ? { background: "#EDE9FE", color: "#6D28D9" }
                            : { background: "#F3F4F6", color: "#6B7280" }
                        }
                      >
                        {c.isVerifiedContractor ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-2 py-3 font-semibold text-severity-medium">
                      {c.activeJobs ?? 0}
                    </td>
                    <td className="px-2 py-3 font-semibold text-severity-low">
                      {c.completedJobs ?? 0}
                    </td>
                    <td className="px-2 py-3 text-ink-muted">
                      {c.email ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-[11.5px] text-ink-muted">
            Showing {filtered.length} of {contractors.length}
          </span>
        </div>
      </div>

      <ContractorPanel
        contractor={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
