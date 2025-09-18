import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadsDir } from "../config/uploads.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

function fileFilter(req, file, cb) {
  if (IMAGE_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
  return cb(new Error("Only image files are allowed"), false);
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

// helper to wrap multer handlers and return express middleware
function wrapMulter(handler) {
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err) {
        const isMulterError = err.name === "MulterError";
        const message = err.message || "File upload error";
        if (isMulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ errors: "File too large (max 5MB)" });
        }
        return res.status(400).json({ errors: message });
      }
      next();
    });
  };
}

export { upload, wrapMulter };
