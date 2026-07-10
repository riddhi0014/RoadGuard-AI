import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface AnalyticsData {
  overTime: { date: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  severityBreakdown: { severity: string; count: number }[];
  contractorPerformance: { contractorId: string; name: string; completedJobs: number }[];
}

export function useAnalytics(days = 30) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/complaints/analytics", { params: { days } })
      .then(({ data }) => setData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [days]);

  return { data, loading };
}