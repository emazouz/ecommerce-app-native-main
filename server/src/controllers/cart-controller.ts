import { Request, Response } from "express";
import Cart from "../models/cart.js";
import Product from "../models/product.js";
import { sendSuccess, sendError } from "../helpers/response.js";

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price images stock isActive",
    );

    if (!cart) {
      return sendSuccess(res, 200, "Cart is empty", { items: [], totalAmount: 0 });
    }

    return sendSuccess(res, 200, "Cart fetched successfully", cart);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { productId, quantity = 1, size } = req.body;

    if (!productId) {
      return sendError(res, 400, "Product ID is required");
    }

    // Validate product exists and is in stock
    const product = await Product.findById(productId).lean();
    if (!product) {
      return sendError(res, 404, "Product not found");
    }
    if (!product.isActive) {
      return sendError(res, 400, "Product is no longer available");
    }
    if (product.stock < quantity) {
      return sendError(res, 400, "Not enough stock available");
    }

    // Find or create cart for this user
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
    }

    // Check if product (with same size) already exists in cart
    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === (size ?? undefined),
    );

    if (existingIndex > -1) {
      // Update quantity
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > product.stock) {
        return sendError(res, 400, "Not enough stock available");
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        price: product.price,
        size,
      });
    }

    cart.calculateTotal();
    await cart.save();

    return sendSuccess(res, 200, "Item added to cart", cart);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/item/:productId
// @access  Private
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { quantity, size } = req.body;
    const { productId } = req.params;

    if (!productId || quantity == null) {
      return sendError(res, 400, "Product ID and quantity are required");
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return sendError(res, 404, "Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === (size ?? undefined),
    );

    if (itemIndex === -1) {
      return sendError(res, 404, "Item not found in cart");
    }

    // Validate stock
    const product = await Product.findById(productId).lean();
    if (!product || product.stock < quantity) {
      return sendError(res, 400, "Not enough stock available");
    }

    if (Number(quantity) <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Number(quantity);
    }

    cart.calculateTotal();
    await cart.save();

    return sendSuccess(res, 200, "Cart updated successfully", cart);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:productId
// @access  Private
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { size } = req.query;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return sendError(res, 404, "Cart not found");
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) =>
        !(item.product.toString() === productId && item.size === (size ?? undefined)),
    ) as typeof cart.items;

    if (cart.items.length === initialLength) {
      return sendError(res, 404, "Item not found in cart");
    }

    cart.calculateTotal();
    await cart.save();

    return sendSuccess(res, 200, "Item removed from cart", cart);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return sendError(res, 404, "Cart not found");
    }

    cart.items = [] as typeof cart.items;
    cart.totalAmount = 0;
    await cart.save();

    return sendSuccess(res, 200, "Cart cleared successfully", cart);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};
