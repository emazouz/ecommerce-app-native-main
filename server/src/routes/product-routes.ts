import { Router } from "express";
import upload from "../config/multer.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product-controller.js";

const productRouter = Router();

// Public routes
productRouter.get("/", getProducts);
productRouter.get("/:id", getProduct);

// Admin routes — requireAuth verifies session, requireAdmin checks role
productRouter.post("/", requireAuth, requireAdmin, upload.array("images", 5), createProduct);
productRouter.put("/:id", requireAuth, requireAdmin, upload.array("images", 5), updateProduct);
productRouter.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default productRouter;
