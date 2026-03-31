import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getDashboardStats,
  getUsers,
  getUser,
  updateUserRole,
} from "../controllers/admin-controller.js";

const adminRouter = Router();

// All admin routes require authentication AND admin privileges
adminRouter.use(requireAuth, requireAdmin);

// Dashboard stats
adminRouter.get("/stats", getDashboardStats);

// User management
adminRouter.get("/users", getUsers);
adminRouter.get("/users/:id", getUser);
adminRouter.put("/users/:id/role", updateUserRole);

export default adminRouter;
