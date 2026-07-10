import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export interface Contractor {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  isVerifiedContractor?: boolean;
  activeJobs?: number;
  completedJobs?: number;
  createdAt?: string;
}

export function useContractors() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContractors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/contractors");
      setContractors(
        data.map((c: any) => ({
          id: c._id,
          name: c.name,
          companyName: c.companyName,
          email: c.email,
          phone: c.phone,
          isVerifiedContractor: c.isVerifiedContractor,
          activeJobs: c.activeJobs,
          completedJobs: c.completedJobs,
          createdAt: c.createdAt,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  return { contractors, loading, refetch: fetchContractors };
}