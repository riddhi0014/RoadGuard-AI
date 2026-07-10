import multer from "multer";

// We use memoryStorage (not disk) because we immediately stream the buffer
// to Cloudinary - we never need the file to sit on our own server's disk.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image, adjust if needed
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});
