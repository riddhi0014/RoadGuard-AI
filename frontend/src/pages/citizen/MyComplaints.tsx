import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toCitizenStatus, CITIZEN_STATUS_COLORS } from "@/lib/citizenStatus";

interface RawComplaint {
  _id: string;
  address?: string;
  description?: string;
  images: string[];
  status: string;
  createdAt: string;
}

export function MyComplaints() {
  const [complaints, setComplaints] = useState<RawComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/complaints/mine")
      .then(({ data }) => setComplaints(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-50 pb-24">
      <div className="bg-[#1E2A47] px-5 py-4 text-white">
        <div className="text-base font-bold">My Reports</div>
        <div className="mt-0.5 text-[11.5px] text-[#A9B4CC]">
          {complaints.length} report{complaints.length !== 1 ? "s" : ""}{" "}
          submitted
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            Loading your reports…
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            You haven't reported any issues yet.
          </div>
        ) : (
          complaints.map((c) => {
            const citizenStatus = toCitizenStatus(c.status as any);
            const colors = CITIZEN_STATUS_COLORS[citizenStatus];
            return (
              <div
                key={c._id}
                className="mb-2.5 flex gap-2.5 rounded-lg border border-border bg-white p-3"
              >
                <div className="h-[54px] w-[54px] flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {c.images[0] && (
                    <img
                      src={c.images[0]}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate text-xs font-bold text-ink">
                      {c.address ?? c.description ?? "Location pending"}
                    </div>
                    <div className="flex-shrink-0 text-[10px] text-ink-muted">
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <span
                    className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {citizenStatus}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
