import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { AssignedJob } from "@/hooks/useAssignedJobs";
import { ImageLightbox } from "@/components/shared/ImageLightbox";

export function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { status: geoStatus, latitude, longitude, retry } = useGeolocation();

  const [job, setJob] = useState<AssignedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    api
      .get(`/complaints/${id}`)
      .then(({ data }) => setJob(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length < 3) {
      setError("Please add at least 3 repair photos.");
      return;
    }
    if (geoStatus !== "success" || !latitude || !longitude) {
      setError("Location is required. Please enable location access.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    formData.append("latitude", String(latitude));
    formData.append("longitude", String(longitude));

    try {
      await api.post(`/complaints/${id}/repair-evidence`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/contractor/jobs");
    } catch (err) {
      console.error(err);
      setError("Failed to submit repair evidence. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-ink-muted">
        Loading job…
      </div>
    );
  }
  if (!job) {
    return (
      <div className="py-12 text-center text-xs text-severity-critical">
        Job not found.
      </div>
    );
  }

  // repairEvidence is always a truthy {} object on every complaint due to
  // how Mongoose initializes nested-object schema paths - checking for
  // actual uploaded images is what tells us evidence was really submitted.
  const alreadySubmitted =
    !!job.repairEvidence?.images && job.repairEvidence.images.length > 0;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-50 pb-24">
      <div className="bg-[#1E2A47] px-5 py-4 text-white">
        <button
          onClick={() => navigate("/contractor/jobs")}
          className="mb-1 text-[11px] text-[#A9B4CC]"
        >
          ← Assigned Jobs
        </button>
        <div className="text-base font-bold">
          {job.address ?? job.description ?? "Job detail"}
        </div>
        <div className="mt-0.5 text-[11.5px] text-[#A9B4CC] capitalize">
          Status: {job.status.replace("_", " ")}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1.5 text-[11.5px] font-bold tracking-wide text-ink-muted">
          BEFORE PHOTOS (FROM CITIZEN REPORT)
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {job.images.map((url, i) => (
            <img
              key={i}
              src={url}
              onClick={() => setLightboxIndex(i)}
              className="h-[90px] w-[90px] flex-shrink-0 cursor-pointer rounded-lg object-cover"
              alt=""
            />
          ))}
        </div>

        {job.description && (
          <>
            <div className="mb-1.5 text-[11.5px] font-bold tracking-wide text-ink-muted">
              ISSUE DESCRIPTION
            </div>
            <div className="mb-4 rounded-lg border border-border bg-white p-2.5 text-xs">
              {job.description}
            </div>
          </>
        )}

        {alreadySubmitted ? (
          <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-xs text-[#065F46]">
            Repair evidence already submitted on{" "}
            {new Date(job.repairEvidence!.uploadedAt).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
              }
            )}
            . Waiting on officer review.
          </div>
        ) : (
          <>
            <div className="mb-1.5 text-[11.5px] font-bold tracking-wide text-ink-muted">
              UPLOAD REPAIR EVIDENCE (3-5 PHOTOS)
            </div>
            <label className="mb-3.5 block cursor-pointer rounded-xl border-2 border-dashed border-border bg-white p-6 text-center text-xs text-ink-muted">
              📷 Tap to take "after" photos of the completed repair
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={files.length >= 5}
              />
            </label>

            {files.length > 0 && (
              <div className="mb-3.5 flex gap-2">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl bg-black/60 text-[9px] text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {geoStatus === "loading" && (
              <div className="mb-3.5 text-[11px] text-ink-muted">
                Detecting your location…
              </div>
            )}
            {(geoStatus === "denied" || geoStatus === "error") && (
              <div className="mb-3.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-[11px] text-[#991B1B]">
                Location required to confirm you're on-site.{" "}
                <button onClick={retry} className="font-semibold underline">
                  Retry
                </button>
              </div>
            )}

            {error && (
              <div className="mb-3 text-xs text-severity-critical">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || files.length < 3}
              className="w-full rounded-lg bg-[#1E2A47] py-3.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Submit Repair Evidence"}
            </button>
          </>
        )}
      </div>
      {lightboxIndex !== null && (
        <ImageLightbox
          images={job.images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
