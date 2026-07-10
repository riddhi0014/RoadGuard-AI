import { useMemo, useState } from "react";
import { useUsers, type AdminUser } from "@/hooks/useUsers";
import { UserDetailModal } from "@/components/admin/UserDetailModal";

const roleOptions = [
  { value: "all", label: "All roles" },
  { value: "citizen", label: "Citizen" },
  { value: "officer", label: "Officer" },
  { value: "contractor", label: "Contractor" },
  { value: "admin", label: "Admin" },
];

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  citizen: { bg: "#F3F4F6", text: "#6B7280" },
  officer: { bg: "#DBEAFE", text: "#1E40AF" },
  contractor: { bg: "#D1FAE5", text: "#065F46" },
  admin: { bg: "#EDE9FE", text: "#6D28D9" },
};

export function UserManagement() {
  const { users, loading, toggleActive, verifyContractor } = useUsers();
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filtered = useMemo(
    () =>
      roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter),
    [users, roleFilter]
  );

  const total = users.length;
  const citizens = users.filter((u) => u.role === "citizen").length;
  const officers = users.filter((u) => u.role === "officer").length;
  const unverifiedContractors = users.filter(
    (u) => u.role === "contractor" && !u.isVerifiedContractor
  ).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border bg-paper px-6 py-4">
        <div className="text-sm text-ink-muted">
          Admin &gt; <span className="font-bold text-ink">User Management</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3.5 border-b border-border p-4">
        <div className="rounded-lg border border-border p-3.5">
          <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-muted">
            TOTAL USERS
          </div>
          <div className="text-xl font-bold text-ink">{total}</div>
        </div>
        <div className="rounded-lg border border-border p-3.5">
          <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-muted">
            CITIZENS
          </div>
          <div className="text-xl font-bold text-ink">{citizens}</div>
        </div>
        <div className="rounded-lg border border-border p-3.5">
          <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-muted">
            OFFICERS
          </div>
          <div className="text-xl font-bold text-ink">{officers}</div>
        </div>
        <div className="rounded-lg border border-border p-3.5">
          <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-muted">
            UNVERIFIED CONTRACTORS
          </div>
          <div className="text-xl font-bold text-severity-medium">
            {unverifiedContractors}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-border px-2.5 py-1.5 text-xs text-ink-muted"
        >
          {roleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-auto px-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-muted">
            Loading users…
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                  USER
                </th>
                <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                  ROLE
                </th>
                <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                  VERIFICATION
                </th>
                <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                  ACTIVE
                </th>
                <th className="px-2 py-2.5 text-left text-[10.5px] font-bold text-ink-muted">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-b border-neutral-100">
                  <td className="px-2 py-3">
                    <div className="font-bold text-ink">
                      {u.companyName ?? u.name}
                    </div>
                    <div className="text-[11px] text-ink-muted">{u.email}</div>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                      style={ROLE_COLORS[u.role]}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    {u.role === "contractor" ? (
                      <span
                        className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={
                          u.isVerifiedContractor
                            ? { background: "#EDE9FE", color: "#6D28D9" }
                            : { background: "#F3F4F6", color: "#6B7280" }
                        }
                      >
                        {u.isVerifiedContractor ? "Verified" : "Unverified"}
                      </span>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => toggleActive(u._id, !u.isActive)}
                      className="relative h-[18px] w-[34px] rounded-full transition-colors"
                      style={{ background: u.isActive ? "#10B981" : "#D1D5DB" }}
                      aria-label={
                        u.isActive ? "Deactivate user" : "Activate user"
                      }
                    >
                      <span
                        className="absolute top-0.5 h-[14px] w-[14px] rounded-full bg-white transition-all"
                        style={{ left: u.isActive ? 18 : 2 }}
                      />
                    </button>
                  </td>
                  <td className="px-2 py-3">
                    {u.role === "contractor" && !u.isVerifiedContractor ? (
                      <button
                        onClick={() => verifyContractor(u._id)}
                        className="rounded-md border border-border bg-paper px-2.5 py-1 text-[11px]"
                      >
                        Verify
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="rounded-md border border-border bg-paper px-2.5 py-1 text-[11px] text-ink"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggleActive={toggleActive}
          onVerify={verifyContractor}
        />
      )}
    </div>
  );
}
