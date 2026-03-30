import { Request, Response } from "express";
import Product from "../models/product.js";
import { sendSuccess, sendError } from "../helpers/response.js";
import { uploadImages, deleteCloudinaryImages } from "../helpers/cloudinary.js";
import { safeInt, parseCSV } from "../helpers/parse.js";

// @desc    Get all products (paginated)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = safeInt(req.query.page, 1);
    const limit = safeInt(req.query.limit, 10);
    const { search } = req.query;

    const query: any = { isActive: true };
    if (search) {
      query.name = { $regex: search as string, $options: "i" };
    }

    // Run count and find in parallel for speed
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return sendSuccess(res, 200, "Products fetched successfully", products, {
      page,
      limit,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return sendError(res, 404, "Product not found");
    }
    return sendSuccess(res, 200, "Product fetched successfully", product);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (admin)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const files = (req.files ?? []) as Express.Multer.File[];

    if (files.length === 0) {
      return sendError(res, 400, "Please upload at least one image");
    }

    const images = await uploadImages(files);
    const sizes = parseCSV(req.body.sizes);

    const {
      name,
      description,
      price,
      comparePrice,
      category,
      stock,
      isFeatured,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      comparePrice: 120,
      category,
      stock,
      isFeatured,
      images,
      sizes,
    });

    return sendSuccess(res, 201, "Product created successfully", product);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (admin)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    // ── Collect images ──────────────────────────────────────────
    const images: string[] = [];

    // Keep existing images the client wants to retain
    if (req.body.existingImages) {
      const existing = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
      images.push(...existing);
    }

    // Upload any new files
    const files = (req.files ?? []) as Express.Multer.File[];
    if (files.length > 0) {
      const newUrls = await uploadImages(files);
      images.push(...newUrls);
    }

    if (images.length === 0) {
      return sendError(res, 400, "Please upload at least one image");
    }

    const sizes = parseCSV(req.body.sizes);

    // Pick only known fields — prevents leaking existingImages into MongoDB
    const {
      name,
      description,
      price,
      comparePrice,
      category,
      stock,
      isFeatured,
      isActive,
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        comparePrice,
        category,
        stock,
        isFeatured,
        isActive,
        images,
        sizes,
      },
      { new: true, runValidators: true },
    );

    if (!product) {
      return sendError(res, 404, "Product not found");
    }

    return sendSuccess(res, 200, "Product updated successfully", product);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (admin)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return sendError(res, 404, "Product not found");
    }

    // Clean up Cloudinary images using their public_id
    if (product.images.length > 0) {
      await deleteCloudinaryImages(product.images);
    }

    return sendSuccess(res, 200, "Product deleted successfully", product);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};
