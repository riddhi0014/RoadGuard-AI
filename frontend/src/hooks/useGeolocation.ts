import { useEffect, useState } from "react";

export type GeoStatus = "loading" | "success" | "denied" | "error";

interface GeoResult {
  status: GeoStatus;
  latitude: number | null;
  longitude: number | null;
  retry: () => void;
}

export function useGeolocation(): GeoResult {
  const [status, setStatus] = useState<GeoStatus>("loading");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setStatus("success");
      },
      (err) => {
        // err.code === 1 means the user explicitly denied permission -
        // distinguishing this from a generic error lets us show a more
        // helpful message ("enable location in your browser settings")
        // instead of a vague "something went wrong".
        setStatus(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [attempt]);

  return { status, latitude, longitude, retry: () => setAttempt((a) => a + 1) };
}