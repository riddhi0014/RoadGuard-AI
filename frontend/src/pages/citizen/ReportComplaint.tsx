import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "@/hooks/useGeolocation";
import { reverseGeocode } from "@/lib/reverseGeocode";
import { api } from "@/lib/api";

export function ReportComplaint() {
  const navigate = useNavigate();
  const { status: geoStatus, latitude, longitude, retry } = useGeolocation();
  const [address, setAddress] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a human-readable address once we have coordinates. useEffect
  // re-runs whenever geoStatus/latitude/longitude change, so this correctly
  // fires once GPS actually succeeds - unlike useState's initializer, which
  // only ever runs on the very first render.
  useEffect(() => {
    if (
      geoStatus === "success" &&
      latitude &&
      longitude &&
      !address &&
      !geocoding
    ) {
      setGeocoding(true);
      reverseGeocode(latitude, longitude).then((result) => {
        setAddress(result);
        setGeocoding(false);
      });
    }
  }, [geoStatus, latitude, longitude]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("Please add at least one photo.");
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
    formData.append("description", description);
    if (address) formData.append("address", address);

    try {
      await api.post("/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/citizen/complaints");
    } catch (err) {
      console.error(err);
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-50 pb-24">
      <div className="bg-[#1E2A47] px-5 py-4 text-white">
        <div className="text-base font-bold">Report a Road Issue</div>
        <div className="mt-0.5 text-[11.5px] text-[#A9B4CC]">
          Takes about 1 minute
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1.5 text-[11.5px] font-bold tracking-wide text-ink-muted">
          PHOTOS
        </div>
        <label className="mb-3.5 block cursor-pointer rounded-xl border-2 border-dashed border-border bg-white p-7 text-center text-xs text-ink-muted">
          <div className="mb-2 text-2xl">📷</div>
          Tap to take a photo or upload from gallery
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

        <div className="mb-1.5 text-[11.5px] font-bold tracking-wide text-ink-muted">
          LOCATION
        </div>
        {geoStatus === "loading" && (
          <div className="mb-3.5 rounded-lg border border-border bg-white px-3 py-2.5 text-xs text-ink-muted">
            Detecting your location…
          </div>
        )}
        {geoStatus === "success" && (
          <div className="mb-3.5 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2.5 text-xs text-[#065F46]">
            📍{" "}
            {geocoding
              ? "Looking up address…"
              : address ?? `${latitude?.toFixed(5)}, ${longitude?.toFixed(5)}`}
          </div>
        )}
        {(geoStatus === "denied" || geoStatus === "error") && (
          <div className="mb-3.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2.5 text-xs text-[#991B1B]">
            {geoStatus === "denied"
              ? "Location access denied. Please enable location permissions for this site in your browser settings, then retry."
              : "Couldn't detect your location."}
            <button onClick={retry} className="ml-2 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        <div className="mb-1.5 text-[11.5px] font-bold tracking-wide text-ink-muted">
          DESCRIBE THE ISSUE (OPTIONAL)
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Large pothole blocking half the road..."
          className="mb-4 h-20 w-full resize-none rounded-lg border border-border p-2.5 font-mono text-xs"
        />

        {error && (
          <div className="mb-3 text-xs text-severity-critical">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-[#1E2A47] py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Report"}
        </button>
      </div>
    </div>
  );
}
