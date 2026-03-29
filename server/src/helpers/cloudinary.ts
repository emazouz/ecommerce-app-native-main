import cloudinary from "../config/cloudinary.js";
import { UploadApiResponse } from "cloudinary";

/** Extract the Cloudinary public_id from a secure_url so destroy() works. */
export const getPublicId = (url: string): string | null => {
  // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/folder/id.ext
  const match = url.match(/\/upload\/(?:v\d+\/)?(.*)\.\w+$/);
  return match?.[1] ?? null;
};

/** Upload a single Buffer to Cloudinary via stream. */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder = "ecom-app/products",
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve(result);
      },
    );
    stream.end(buffer);
  });

/** Upload an array of multer files and return their secure URLs. */
export const uploadImages = async (
  files: Express.Multer.File[],
  folder?: string,
): Promise<string[]> => {
  const results = await Promise.all(
    files.map((f) => uploadToCloudinary(f.buffer, folder)),
  );
  return results.map((r) => r.secure_url);
};

/** Delete images from Cloudinary by their URLs. Errors are logged, not thrown. */
export const deleteCloudinaryImages = async (urls: string[]): Promise<void> => {
  const ids = urls.map(getPublicId).filter(Boolean) as string[];
  if (ids.length === 0) return;
  await Promise.allSettled(ids.map((id) => cloudinary.uploader.destroy(id)));
};
