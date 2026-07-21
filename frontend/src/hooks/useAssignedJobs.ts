import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface AssignedJob {
  _id: string;
  address?: string;
  description?: string;
          images: string[];
  status: string;
  detections: { severity: string }[];
  createdAt: string;
  repairEvidence?: { images: string[]; uploadedAt: string };
}

export function useAssignedJobs() {
  const [jobs, setJobs] = useState<AssignedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/complaints/assigned");
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, refetch: fetchJobs };
}