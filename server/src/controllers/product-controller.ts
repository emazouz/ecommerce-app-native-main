import { Request, Response } from "express";
import Product from "../models/product.js";
import { sendSuccess, sendError } from "../helpers/response.js";
import { uploadImages, deleteCloudinaryImages } from "../helpers/cloudinary.js";
import { safeInt, parseCSV } from "../helpers/parse.js";
import { fileTypeFromBuffer } from "file-type";

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
    const product = await Product.findById({
      _id: req.params.id,
      isActive: true,
    }).lean();

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
  let images: string[] = [];

  try {
    const files = (req.files ?? []) as Express.Multer.File[];

    if (files.length === 0) {
      return sendError(res, 400, "Please upload at least one image");
    }

    // validation
    for (const file of files) {
      const type = await fileTypeFromBuffer(file.buffer);

      if (!type || !type.mime.startsWith("image/")) {
        return sendError(res, 400, "Only image files are allowed");
      }
    }

    images = await uploadImages(files);

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
      comparePrice,
      category,
      stock,
      isFeatured,
      images,
      sizes,
    });

    return sendSuccess(res, 201, "Product created successfully", product);
  } catch (error: any) {
    // ❌ cleanup Cloudinary
    if (images.length > 0) {
      await deleteCloudinaryImages(images);
    }

    return sendError(res, 500, error.message);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (admin)
export const updateProduct = async (req: Request, res: Response) => {
  let newUploadedImages: string[] = [];

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, 404, "Product not found");
    }

    // ── existing images (kept by user)
    const existing = req.body.existingImages
      ? Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages]
      : [];

    const files = (req.files ?? []) as Express.Multer.File[];

    // ── upload new images
    if (files.length > 0) {
      newUploadedImages = await uploadImages(files);
    }

    // ── final image list
    const finalImages = [...existing, ...newUploadedImages];

    if (finalImages.length === 0) {
      return sendError(res, 400, "Please upload at least one image");
    }

    const sizes = parseCSV(req.body.sizes);

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

    // ── diff: images to delete from Cloudinary
    const imagesToDelete = product.images.filter(
      (img: string) => !existing.includes(img),
    );

    // ── update DB
    const updated = await Product.findByIdAndUpdate(
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
        images: finalImages,
        sizes,
      },
      { new: true, runValidators: true },
    );

    // ── cleanup removed old images
    if (imagesToDelete.length > 0) {
      await deleteCloudinaryImages(imagesToDelete);
    }

    return sendSuccess(res, 200, "Product updated successfully", updated);
  } catch (error: any) {
    // ── cleanup newly uploaded images if failure happens
    if (newUploadedImages.length > 0) {
      await deleteCloudinaryImages(newUploadedImages);
    }

    return sendError(res, 500, error.message);
  }
};
// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (admin)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    // 1️⃣ delete from DB first
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return sendError(res, 404, "Product not found");
    }

    // 2️⃣ Cloudinary cleanup (best-effort)
    try {
      if (product.images?.length > 0) {
        await deleteCloudinaryImages(product.images);
      }
    } catch (cloudError) {
      console.error("Cloudinary cleanup failed:", cloudError);
      // ❗ don't break response
    }

    // 3️⃣ always success if DB succeeded
    return sendSuccess(res, 200, "Product deleted successfully", product);
  } catch (error: any) {
    return sendError(res, 500, error.message);
  }
};
