import { Request, Response } from "express";
import User from "../models/user.js";
import Product from "../models/product.js";
import Order from "../models/order.js";
import { sendSuccess, sendError } from "../helpers/response.js";
import { safeInt } from "../helpers/parse.js";

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (admin)
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueResult] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
      ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    return sendSuccess(res, 200, "Dashboard stats fetched", {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      ordersByStatus,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = safeInt(req.query.page, 1);
    const limit = safeInt(req.query.limit, 10);

    const [total, users] = await Promise.all([
      User.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return sendSuccess(res, 200, "Users fetched successfully", users, {
      page,
      limit,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (admin)
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Also fetch user's order count and total spent
    const [orderCount, spentResult] = await Promise.all([
      Order.countDocuments({ user: user._id }),
      Order.aggregate([
        { $match: { user: user._id, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    return sendSuccess(res, 200, "User fetched successfully", {
      ...user,
      orderCount,
      totalSpent: spentResult[0]?.total ?? 0,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      return sendError(res, 400, "Valid role (user or admin) is required");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    );

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "User role updated successfully", user);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};
