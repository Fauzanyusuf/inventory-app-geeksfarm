import express from "express";
import productController from "../controller/product-controller.js";
import rbacMiddleware from "../middleware/rbac-middleware.js";
import { upload, wrapMulter } from "../middleware/upload-middleware.js";

const router = express.Router();

// listing (with pagination)
router.get(
  "/",
  rbacMiddleware(["inventory:read"]),
  productController.listProducts
);

// create product/batch
router.post(
  "/",
  rbacMiddleware(["inventory:manage"]),
  productController.createProduct
);

// read one
router.get(
  "/:id",
  rbacMiddleware(["inventory:read"]),
  productController.getProduct
);

// update product
router.put(
  "/:id",
  rbacMiddleware(["inventory:manage"]),
  productController.updateProduct
);

// delete product
router.delete(
  "/:id",
  rbacMiddleware(["inventory:manage"]),
  productController.deleteProduct
);

// upload image for product with explicit multer error handling
router.post(
  "/:id/images",
  rbacMiddleware(["inventory:manage"]),
  wrapMulter(upload.single("image")),
  productController.uploadProductImage
);

export default router;
