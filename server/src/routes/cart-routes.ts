import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart-controller.js";

const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(requireAuth);

cartRouter.get("/", getCart);
cartRouter.post("/", addToCart);
cartRouter.put("/item/:productId", updateCartItem);
cartRouter.delete("/item/:productId", removeFromCart);
cartRouter.delete("/", clearCart);

export default cartRouter;
