import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "citizen" | "officer" | "contractor" | "admin";
  companyName?: string;
  isVerifiedContractor?: boolean;
  isActive: boolean;
  createdAt: string;
}

export function useUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/users/${id}/status`, { isActive });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to update user status");
    }
  };

  const verifyContractor = async (id: string) => {
    await api.patch(`/users/${id}/verify`);
    fetchUsers();
  };

  return { users, loading, toggleActive, verifyContractor };
}