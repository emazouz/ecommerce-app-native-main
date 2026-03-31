import mongoose from "mongoose";
import { ICart, ICartItem } from "../types/index.js";

const cartItemSchema = new mongoose.Schema<ICartItem>(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    size: {
      type: String,
    },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema<ICart>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One cart per user
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

// Auto-calculate totalAmount before saving
cartSchema.methods.calculateTotal = function (): number {
  this.totalAmount = this.items.reduce(
    (sum: number, item: ICartItem) => sum + item.price * item.quantity,
    0,
  );
  return this.totalAmount;
};

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;