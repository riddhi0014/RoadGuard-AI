import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// This is what we'll store inside the JWT payload when a user logs in.
export interface AuthPayload {
  id: string;
  role: string;
}

// Extend Express's Request type so `req.user` is recognized by TypeScript
// everywhere else in the app, instead of using `any`.
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Runs BEFORE any protected route. Checks for a valid "Bearer <token>"
// header, verifies it, and attaches the decoded { id, role } to req.user.
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
