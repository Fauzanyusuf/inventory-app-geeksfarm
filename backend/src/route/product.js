import express from "express";
import {
  createProduct,
  getProduct,
  listProducts,
  uploadProductImage,
  updateProduct,
  deleteProduct,
} from "../controller/product-controller.js";
import { rbacMiddleware } from "../middleware/rbac-middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
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

const router = express.Router();

// listing (with pagination)
router.get("/", rbacMiddleware(["inventory:read"]), listProducts);

// create product/batch
router.post("/", rbacMiddleware(["inventory:manage"]), createProduct);

// read one
router.get("/:id", rbacMiddleware(["inventory:read"]), getProduct);

// update product
router.put("/:id", rbacMiddleware(["inventory:manage"]), updateProduct);

// delete product
router.delete("/:id", rbacMiddleware(["inventory:manage"]), deleteProduct);

// upload image for product with explicit multer error handling
function wrapMulter(handler) {
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err) {
        // Multer errors or fileFilter errors
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

router.post(
  "/:id/images",
  rbacMiddleware(["inventory:manage"]),
  wrapMulter(upload.single("image")),
  uploadProductImage
);

export default router;
