import { Request, Response } from "express";
import Address from "../models/address.js";
import { sendSuccess, sendError } from "../helpers/response.js";

// @desc    Get all addresses for the user
// @route   GET /api/addresses
// @access  Private
export const getAddresses = async (req: Request, res: Response) => {
  try {
    const addresses = await Address.find({ user: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, "Addresses fetched successfully", addresses);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get single address
// @route   GET /api/addresses/:id
// @access  Private
export const getAddress = async (req: Request, res: Response) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!address) {
      return sendError(res, 404, "Address not found");
    }

    return sendSuccess(res, 200, "Address fetched successfully", address);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Create address
// @route   POST /api/addresses
// @access  Private
export const createAddress = async (req: Request, res: Response) => {
  try {
    const { type, street, city, state, zipCode, country, isDefault } = req.body;

    if (!type || !street || !city || !state || !zipCode || !country) {
      return sendError(res, 400, "All address fields are required");
    }

    // If this is set as default, unset any existing default for this user
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id, isDefault: true },
        { isDefault: false },
      );
    }

    // If this is the user's first address, make it default automatically
    const addressCount = await Address.countDocuments({ user: req.user._id });

    const address = await Address.create({
      user: req.user._id,
      type,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || addressCount === 0,
    });

    return sendSuccess(res, 201, "Address created successfully", address);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const { type, street, city, state, zipCode, country, isDefault } = req.body;

    // If setting as default, unset any existing default first
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id, isDefault: true },
        { isDefault: false },
      );
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { type, street, city, state, zipCode, country, isDefault },
      { new: true, runValidators: true },
    );

    if (!address) {
      return sendError(res, 404, "Address not found");
    }

    return sendSuccess(res, 200, "Address updated successfully", address);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return sendError(res, 404, "Address not found");
    }

    // If the deleted address was the default, promote the most recent one
    if (address.isDefault) {
      const nextDefault = await Address.findOne({ user: req.user._id })
        .sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    return sendSuccess(res, 200, "Address deleted successfully", address);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private

export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    // Unset all defaults for this user
    await Address.updateMany(
      { user: req.user._id, isDefault: true },
      { isDefault: false },
    );

    // Set the target address as default
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDefault: true },
      { new: true },
    );

    if (!address) {
      return sendError(res, 404, "Address not found");
    }

    return sendSuccess(res, 200, "Default address updated", address);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};
