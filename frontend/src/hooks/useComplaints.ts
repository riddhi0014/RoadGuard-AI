import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { adaptComplaint } from "@/lib/adaptComplaint";
import type { Complaint } from "@/lib/mockComplaints";

export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // limit=1000 fetches effectively "all" complaints so the existing
      // client-side filter/sort/pagination logic on both pages keeps
      // working unchanged. Switch to server-side page/limit params later
      // if complaint volume grows large enough to make this wasteful.
      const { data } = await api.get("/complaints", { params: { limit: 1000 } });
      setComplaints(data.complaints.map(adaptComplaint));
    } catch (err) {
      console.error(err);
      setError("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return { complaints, loading, error, refetch: fetchComplaints };
}