// All four user roles in the system.
// The frontend will use the SAME string values for its RBAC routing,
// so keep this in sync with `shared/types` once you set that up.
export enum Role {
  CITIZEN = "citizen",
  OFFICER = "officer",
  CONTRACTOR = "contractor",
  ADMIN = "admin",
}

// Lifecycle of a single complaint, from creation to final officer decision.
export enum ComplaintStatus {
  PENDING = "pending", // just submitted, not yet analyzed by AI
  AI_ANALYZED = "ai_analyzed", // AI detection + severity done
  ASSIGNED = "assigned", // officer assigned a contractor
  IN_PROGRESS = "in_progress", // contractor is working on it
  COMPLETED = "completed", // contractor uploaded "after" evidence
  VERIFIED = "verified", // AI repair verification has run
  APPROVED = "approved", // officer approved the repair
  REJECTED = "rejected", // officer rejected -> back to in_progress or reassigned
}

// Types of road defects the CV model can detect (from your architecture doc).
export enum DefectType {
  POTHOLE = "pothole",
  CRACK = "crack",
  OPEN_MANHOLE = "open_manhole",
  WATERLOGGING = "waterlogging",
}

export enum Severity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}
