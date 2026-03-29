import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import User from "../models/user.js";
import { sendError } from "../helpers/response.js";

/**
 * Require authentication.
 * Verifies the Clerk session and attaches the DB user to `req.user`.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return sendError(res, 401, "Authentication required");
    }

    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user) {
      return sendError(res, 401, "User not found");
    }

    // Attach user to request for downstream handlers
    req.user = user;
    next();
  } catch (error: any) {
    return sendError(res, 401, "Authentication failed");
  }
};

/**
 * Require admin role.
 * Must be used AFTER `requireAuth` — it reads `req.user.role`.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "admin") {
    return sendError(res, 403, "Admin access required");
  }
  next();
};
