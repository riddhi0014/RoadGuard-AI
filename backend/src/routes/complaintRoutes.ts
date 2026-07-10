import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { upload } from "../middleware/upload";
import { Role } from "../types/enums";
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaint,
  getComplaintAnalytics,
  getAssignedComplaints,
  uploadRepairEvidence,
} from "../controllers/complaintController";

const router = Router();

// Citizen submits a new complaint (up to 5 images, matches your doc's
// recommendation of 3-5 photos from different angles - here for the
// initial report; the same limit will apply later to repair evidence).
router.post(
  "/",
  requireAuth,
  requireRole(Role.CITIZEN),
  upload.array("images", 5),
  createComplaint
);

// Citizen views their own submitted complaints
router.get("/mine", requireAuth, requireRole(Role.CITIZEN), getMyComplaints);

// Officer/Admin view all complaints
router.get(
  "/",
  requireAuth,
  requireRole(Role.OFFICER, Role.ADMIN),
  getAllComplaints
);

// Officer/Admin updates status and/or assigns officer/contractor
router.patch(
  "/:id",
  requireAuth,
  requireRole(Role.OFFICER, Role.ADMIN),
  updateComplaint
);

// Officer/Admin analytics dashboard - must come before "/:id" below,
// otherwise Express treats "analytics" as an :id param and this route
// never gets hit.
router.get(
  "/analytics",
  requireAuth,
  requireRole(Role.OFFICER, Role.ADMIN),
  getComplaintAnalytics
);


// Contractor's own assigned jobs - must come before "/:id" for the same
// reason as "/analytics" above.
router.get(
  "/assigned",
  requireAuth,
  requireRole(Role.CONTRACTOR),
  getAssignedComplaints
);

// Contractor uploads repair evidence for a specific assigned job
router.post(
  "/:id/repair-evidence",
  requireAuth,
  requireRole(Role.CONTRACTOR),
  upload.array("images", 5),
  uploadRepairEvidence
);

// Any authenticated role can view a single complaint by id
// (citizen sees their own, officer/contractor/admin see assigned ones -
// we'll tighten this with ownership checks once assignment logic exists)
router.get("/:id", requireAuth, getComplaintById);

export default router;
