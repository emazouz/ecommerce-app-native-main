import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/order.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";
import { sendSuccess, sendError } from "../helpers/response.js";
import { safeInt } from "../helpers/parse.js";

/** Generate a unique order number: ORD-YYYYMMDD-XXXXX */
const generateOrderNumber = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${date}-${random}`;
};

// @desc    Place a new order (from cart)
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    // Validate shipping address
    if (
      !shippingAddress?.street ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.zipCode ||
      !shippingAddress?.country
    ) {
      return sendError(res, 400, "Complete shipping address is required");
    }

    if (!paymentMethod) {
      return sendError(res, 400, "Payment method is required");
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price stock isActive",
    );

    if (!cart || cart.items.length === 0) {
      return sendError(res, 400, "Cart is empty");
    }

    // Validate stock for every item and build order items
    const orderItems = [];
    for (const item of cart.items) {
      const product = item.product as any; // populated

      if (!product || !product.isActive) {
        return sendError(
          res,
          400,
          `Product "${product?.name ?? "unknown"}" is no longer available`,
        );
      }
      if (product.stock < item.quantity) {
        return sendError(
          res,
          400,
          `Not enough stock for "${product.name}" (available: ${product.stock})`,
        );
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingCost = subtotal >= 100 ? 0 : 10; // Free shipping over 100
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const totalAmount = subtotal + shippingCost + tax;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      orderNumber: generateOrderNumber(),
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "pending" : "pending",
      orderStatus: "placed",
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      notes,
    });

    // Decrease stock for each product
    const stockUpdates = orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      }),
    );
    await Promise.all(stockUpdates);

    // Clear the cart
    if (paymentMethod !== "stripe") {
      cart.items = [] as typeof cart.items;
      cart.totalAmount = 0;
      await cart.save();
    }

    return sendSuccess(res, 201, "Order placed successfully", order);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const page = safeInt(req.query.page, 1);
    const limit = safeInt(req.query.limit, 10);

    const query = { user: req.user._id };

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return sendSuccess(res, 200, "Orders fetched successfully", orders, {
      page,
      limit,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("items.product", "name images")
      .lean();

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    return sendSuccess(res, 200, "Order fetched successfully", order);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Cancel an order (user can only cancel "placed" orders)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (order.orderStatus !== "placed") {
      return sendError(
        res,
        400,
        `Cannot cancel an order that is already "${order.orderStatus}"`,
      );
    }

    order.orderStatus = "cancelled";
    await order.save();

    // Restore stock
    const restoreOps = order.items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      }),
    );
    await Promise.all(restoreOps);

    return sendSuccess(res, 200, "Order cancelled successfully", order);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// ─── Admin Controllers ─────────────────────────────────────────────

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin
// @access  Private (admin)
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = safeInt(req.query.page, 1);
    const limit = safeInt(req.query.limit, 10);
    const { status } = req.query;

    const query: any = {};
    if (status) query.orderStatus = status;

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return sendSuccess(res, 200, "Orders fetched successfully", orders, {
      page,
      limit,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private (admin)
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const update: any = {};
    if (orderStatus) update.orderStatus = orderStatus;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (orderStatus === "delivered") update.deliveredAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    return sendSuccess(res, 200, "Order status updated successfully", order);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};
