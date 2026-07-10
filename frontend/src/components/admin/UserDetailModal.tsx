import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { AdminUser } from "@/hooks/useUsers";

interface UserDetailModalProps {
  user: AdminUser;
  onClose: () => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onVerify: (id: string) => void;
}

export function UserDetailModal({
  user,
  onClose,
  onToggleActive,
  onVerify,
}: UserDetailModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-96 rounded-lg border border-border bg-paper p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-sm font-bold text-ink">
            {user.companyName ?? user.name}
          </span>
          <button onClick={onClose} aria-label="Close">
            <X className="h-4 w-4 text-ink-muted" />
          </button>
        </div>

        <div className="mb-3.5 text-xs text-ink-muted">{user.name}</div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between border-b border-neutral-100 py-1.5">
            <span className="text-ink-muted">Email</span>
            <span className="text-ink">{user.email}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 py-1.5">
            <span className="text-ink-muted">Role</span>
            <span className="capitalize text-ink">{user.role}</span>
          </div>
          {user.role === "contractor" && (
            <div className="flex justify-between border-b border-neutral-100 py-1.5">
              <span className="text-ink-muted">Verification</span>
              <span className="text-ink">
                {user.isVerifiedContractor ? "Verified" : "Unverified"}
              </span>
            </div>
          )}
          <div className="flex justify-between border-b border-neutral-100 py-1.5">
            <span className="text-ink-muted">Account status</span>
            <span className="text-ink">
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-ink-muted">Joined</span>
            <span className="text-ink">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {user.role === "contractor" && !user.isVerifiedContractor && (
            <button
              onClick={() => onVerify(user._id)}
              className="flex-1 rounded-md bg-[#1E2A47] py-2 text-xs font-semibold text-white"
            >
              Verify contractor
            </button>
          )}
          <button
            onClick={() => onToggleActive(user._id, !user.isActive)}
            className="flex-1 rounded-md border border-border py-2 text-xs font-semibold text-ink"
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
