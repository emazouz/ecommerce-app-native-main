import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/order-controller.js";

const orderRouter = Router();

// All order routes require authentication
orderRouter.use(requireAuth);

// User routes
orderRouter.post("/", createOrder);
orderRouter.get("/", getUserOrders);
// Admin routes (MUST be defined before /:id routes)
orderRouter.get("/admin", requireAdmin, getAllOrders);
orderRouter.put("/admin/:id/status", requireAdmin, updateOrderStatus);

// User explicit item routes
orderRouter.get("/:id", getOrder);
orderRouter.put("/:id/cancel", cancelOrder);

export default orderRouter;
