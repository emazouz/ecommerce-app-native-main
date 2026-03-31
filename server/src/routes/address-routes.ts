import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address-controller.js";

const addressRouter = Router();

// All address routes require authentication
addressRouter.use(requireAuth);

addressRouter.get("/", getAddresses);
addressRouter.get("/:id", getAddress);
addressRouter.post("/", createAddress);
addressRouter.put("/:id", updateAddress);
addressRouter.delete("/:id", deleteAddress);
addressRouter.put("/:id/default", setDefaultAddress);

export default addressRouter;
