import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { Role } from "../types/enums";

const router = Router();

// Only officers and admins can hit this. Try calling it as a citizen
// (using a citizen's token) and you should get a 403.
router.get(
  "/officer-only",
  requireAuth,
  requireRole(Role.OFFICER, Role.ADMIN),
  (req, res) => {
    res.json({ message: `Welcome officer/admin, user id: ${req.user?.id}` });
  }
);

export default router;
