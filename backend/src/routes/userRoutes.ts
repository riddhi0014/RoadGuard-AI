import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { Role } from "../types/enums";
import {
  getContractors,
  getAllUsers,
  updateUserStatus,
  verifyContractor,
} from "../controllers/userController";

const router = Router();

router.get("/contractors", requireAuth, requireRole(Role.OFFICER, Role.ADMIN), getContractors);

// Admin-only user management routes
router.get("/", requireAuth, requireRole(Role.ADMIN), getAllUsers);
router.patch("/:id/status", requireAuth, requireRole(Role.ADMIN), updateUserStatus);
router.patch("/:id/verify", requireAuth, requireRole(Role.ADMIN), verifyContractor);

export default router;