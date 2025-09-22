import multer from "multer";
import { uploadsDir } from "../config/uploads.js";
import { ResponseError } from "../utils/response-error.js";
import {
  generateUniqueFilename,
  IMAGE_MIME_TYPES,
} from "../utils/image-utils.js";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  try {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      return cb(new ResponseError(400, "Only image files are allowed"), false);
    }
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

function wrapMulter(handler) {
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err) {
        const isMulterError = err.name === "MulterError";
        const message = err.message || "File upload error";

        if (isMulterError && err.code === "LIMIT_FILE_SIZE") {
          return next(new ResponseError(413, "File too large (max 5MB)"));
        }

        if (isMulterError && err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(new ResponseError(400, "Unexpected file field"));
        }

        return next(new ResponseError(400, message));
      } else {
        // No error occurred, continue to next middleware
        next();
      }
    });
  };
}

export function uploadSingle(fieldName) {
  return wrapMulter(upload.single(fieldName));
}

export function uploadArray(fieldName, maxCount = 5) {
  return wrapMulter(upload.array(fieldName, maxCount));
}
