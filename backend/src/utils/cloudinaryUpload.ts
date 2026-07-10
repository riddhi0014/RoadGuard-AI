import cloudinary from "../config/cloudinary";

// Cloudinary's SDK expects a stream, but multer gives us a Buffer in memory.
// This wraps that mismatch in a small Promise so callers can just `await` it.
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder }, // e.g. "roadguard/complaints" - keeps uploads organized
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};
