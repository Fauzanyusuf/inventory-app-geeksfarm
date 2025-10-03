import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { ResponseError } from "../utils/response-error.js";
import {
  uploadsBaseUrl,
  uploadsDir,
  uploadsUrlPrefix,
} from "../config/uploads.js";
import { logger } from "../application/logging.js";

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export function validateImageFile(file) {
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  if (!file) {
    throw new ResponseError(400, "No file uploaded");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ResponseError(
      413,
      `File too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`
    );
  }

  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw new ResponseError(
      400,
      "Only image files are allowed (JPEG, PNG, WebP, GIF, SVG)"
    );
  }

  return file;
}

export function generateUniqueFilename(originalFilename) {
  const ext = path.extname(originalFilename) || ".jpg";
  const rnd = crypto.randomBytes(6).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${rnd}${ext}`;
}

export function generateImageUrl(filename) {
  return `${uploadsUrlPrefix}/${filename}`;
}

// Convert a stored (relative) image path into an absolute URL using configured base
export function absoluteImageUrl(pathOrUrl) {
  if (!pathOrUrl) return pathOrUrl;
  // Already absolute?
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!uploadsBaseUrl) return pathOrUrl;
  // Ensure single slash between base and path
  const base = uploadsBaseUrl.replace(/\/+$/, "");
  const rel = String(pathOrUrl).replace(/^\/+/, "");
  return `${base}/${rel}`;
}

export function absoluteImageObject(image) {
  if (!image) return image;
  return {
    ...image,
    url: absoluteImageUrl(image.url),
    thumbnailUrl: absoluteImageUrl(image.thumbnailUrl),
  };
}

export function extractFilename(urlOrPath) {
  if (!urlOrPath) return null;
  try {
    return path.basename(String(urlOrPath));
  } catch {
    return null;
  }
}

export async function deleteFile(filename) {
  if (!filename) return true;
  try {
    const name = path.basename(filename);
    const filePath = path.join(uploadsDir, name);

    await fs.rm(filePath, { force: true });

    return true;
  } catch (error) {
    logger.warn(`Failed to delete file ${filename}:`, error.message);
    return false;
  }
}

export async function cleanupFilesOnError(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return { success: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    files.map(async (file) => {
      try {
        const filePath = file.path || path.join(uploadsDir, file.filename);
        await fs.unlink(filePath);
        logger.info(`Cleaned up file: ${file.filename || file.originalname}`);
        return true;
      } catch (err) {
        logger.warn(
          `Failed to cleanup file ${file.filename || file.originalname}: ${
            err.message
          }`
        );
        return false;
      }
    })
  );

  const success = results.filter(
    (r) => r.status === "fulfilled" && r.value
  ).length;
  const failed = results.length - success;

  return { success, failed };
}
