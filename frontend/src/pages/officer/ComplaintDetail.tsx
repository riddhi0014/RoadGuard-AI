import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { SeverityBadge } from "@/components/officer/SeverityBadge";
import { StatusBadge } from "@/components/officer/StatusBadge";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { getWorstSeverity } from "@/lib/severity";

interface FullComplaint {
  _id: string;
  images: string[];
  description?: string;
  address?: string;
  detections: { defectType: string; confidence: number; severity: string }[];
  priorityScore?: number;
  status: string;
  assignedContractor?: { name: string; companyName?: string } | null;
  assignedOfficer?: { name: string } | null;
  repairEvidence?: { images: string[]; uploadedAt: string };
  createdAt: string;
  updatedAt: string;
}

export function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<FullComplaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  useEffect(() => {
    api
      .get(`/complaints/${id}`)
      .then(({ data }) => setComplaint(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <div className="p-8 text-sm text-ink-muted">Loading complaint…</div>;
  if (!complaint)
    return (
      <div className="p-8 text-sm text-severity-critical">
        Complaint not found.
      </div>
    );

  const severity = getWorstSeverity(complaint.detections as any);
  const hasRepairEvidence =
    !!complaint.repairEvidence?.images &&
    complaint.repairEvidence.images.length > 0;

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b border-border bg-paper px-6 py-3.5">
        <button onClick={() => navigate(-1)} className="text-xs text-ink-muted">
          ← Back
        </button>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-[1.4fr_1fr] gap-4 p-6">
        <div>
          <div className="mb-4 rounded-lg border border-border bg-paper p-4">
            <div className="mb-3 text-[11px] font-bold tracking-wide text-ink-muted">
              CITIZEN REPORT PHOTOS
            </div>
            <div className="flex flex-wrap gap-2">
              {complaint.images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  onClick={() =>
                    setLightbox({ images: complaint.images, index: i })
                  }
                  className="h-24 w-24 cursor-pointer rounded-lg object-cover"
                  alt=""
                />
              ))}
            </div>
          </div>

          {complaint.description && (
            <div className="mb-4 rounded-lg border border-border bg-paper p-4">
              <div className="mb-3 text-[11px] font-bold tracking-wide text-ink-muted">
                DESCRIPTION
              </div>
              <div className="text-xs text-ink">{complaint.description}</div>
            </div>
          )}

          <div className="mb-4 rounded-lg border border-border bg-paper p-4">
            <div className="mb-3 text-[11px] font-bold tracking-wide text-ink-muted">
              REPAIR EVIDENCE (SUBMITTED BY CONTRACTOR)
            </div>
            {hasRepairEvidence ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {complaint.repairEvidence!.images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      onClick={() =>
                        setLightbox({
                          images: complaint.repairEvidence!.images,
                          index: i,
                        })
                      }
                      className="h-24 w-24 cursor-pointer rounded-lg object-cover"
                      alt=""
                    />
                  ))}
                </div>
                <div className="mt-2.5 text-[11px] text-ink-muted">
                  Submitted {formatDate(complaint.repairEvidence!.uploadedAt)}
                </div>
              </>
            ) : (
              <div className="text-[11.5px] text-ink-muted">
                No repair evidence submitted yet.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-paper p-4">
            <div className="mb-3 text-[11px] font-bold tracking-wide text-ink-muted">
              TIMELINE
            </div>
            <div className="relative space-y-4 pl-4">
              <div className="relative before:absolute before:-left-4 before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-accent">
                <div className="text-xs font-bold text-ink">Reported</div>
                <div className="text-[11px] text-ink-muted">
                  {formatDate(complaint.createdAt)}
                </div>
              </div>
              {hasRepairEvidence && (
                <div className="relative before:absolute before:-left-4 before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-accent">
                  <div className="text-xs font-bold text-ink">
                    Repair evidence submitted
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    {formatDate(complaint.repairEvidence!.uploadedAt)}
                  </div>
                </div>
              )}
              {complaint.updatedAt !== complaint.createdAt && (
                <div className="relative before:absolute before:-left-4 before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-accent">
                  <div className="text-xs font-bold text-ink">Last updated</div>
                  <div className="text-[11px] text-ink-muted">
                    {formatDate(complaint.updatedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4 rounded-lg border border-border bg-paper p-4">
            <div className="mb-3 text-[11px] font-bold tracking-wide text-ink-muted">
              DETAILS
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between border-b border-neutral-100 py-1.5">
                <span className="text-ink-muted">Severity</span>
                <SeverityBadge severity={severity as any} />
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1.5">
                <span className="text-ink-muted">Status</span>
                <StatusBadge status={complaint.status as any} />
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1.5">
                <span className="text-ink-muted">Priority score</span>
                <span className="font-semibold text-ink">
                  {complaint.priorityScore ?? 0}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1.5">
                <span className="text-ink-muted">Reported</span>
                <span className="text-ink">
                  {formatDate(complaint.createdAt)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-ink-muted">Contractor</span>
                <span className="text-ink">
                  {complaint.assignedContractor?.companyName ??
                    complaint.assignedContractor?.name ??
                    "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-border bg-paper p-4">
            <div className="mb-3 text-[11px] font-bold tracking-wide text-ink-muted">
              DETECTED DEFECTS
            </div>
            {complaint.detections.length === 0 ? (
              <div className="text-[11.5px] text-ink-muted">
                No detections yet — the AI detection pipeline hasn't been
                integrated.
              </div>
            ) : (
              complaint.detections.map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-neutral-100 py-1.5 text-xs"
                >
                  <span className="capitalize text-ink">{d.defectType}</span>
                  <span className="text-ink-muted">
                    {Math.round(d.confidence * 100)}% confidence
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="rounded-lg border border-border bg-paper p-4">
            <div className="mb-3 text-[11px] font-bold tracking-wide text-ink-muted">
              AI VERIFICATION
            </div>
            <div className="text-[11.5px] text-ink-muted">
              Not yet available — the AI verification service hasn't been built.
            </div>
          </div>
        </div>
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
