import { Request, Response, NextFunction } from "express";
import { Role } from "../types/enums";

// Usage on a route: requireRole(Role.OFFICER, Role.ADMIN)
// Must run AFTER requireAuth, since it depends on req.user being set.
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This should never happen if requireAuth ran first, but it's a
      // cheap safety net in case someone forgets to chain them correctly.
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }

    next();
  };
};
