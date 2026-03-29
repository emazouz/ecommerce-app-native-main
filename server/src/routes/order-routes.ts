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
orderRouter.get("/:id", getOrder);
orderRouter.put("/:id/cancel", cancelOrder);

// Admin routes
orderRouter.get("/admin", requireAdmin, getAllOrders);
orderRouter.put("/admin/:id/status", requireAdmin, updateOrderStatus);

export default orderRouter;
