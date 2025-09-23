import express from "express";
import productController from "../../controller/product-controller.js";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import { uploadArray } from "../../middleware/image-middleware.js";

const router = express.Router();

router.get(
  "/",
  rbacMiddleware(["product:read"]),
  productController.listProducts
);

router.get(
  "/:id",
  rbacMiddleware(["product:read"]),
  productController.getProductById
);

router.patch(
  "/:id",
  rbacMiddleware(["product:manage"]),
  productController.updateProduct
);

router.post(
  "/",
  rbacMiddleware(["product:manage"]),
  uploadArray("images", 5),
  productController.createProduct
); // Supports both single product (object) and bulk products (array) creation with image upload

router.post(
  "/:id/images",
  rbacMiddleware(["product:manage"]),
  uploadArray("images", 5),
  productController.uploadProductImages
);

router.get(
  "/:id/images",
  rbacMiddleware(["product:read"]),
  productController.getProductImages
);

router.patch(
  "/:id/images",
  rbacMiddleware(["product:manage"]),
  uploadArray("images", 5),
  productController.updateProductImages
);

router.delete(
  "/:productId/images/:imgId",
  rbacMiddleware(["product:manage"]),
  productController.deleteProductImage
);

router.get(
  "/:id/batches",
  rbacMiddleware(["inventory:read"]),
  productController.listProductBatchesByProduct
);

router.patch(
  "/:productId/batches/:batchId",
  rbacMiddleware(["inventory:manage"]),
  productController.updateProductBatch
);

router.post(
  "/:id/stock",
  rbacMiddleware(["inventory:manage"]),
  productController.addProductStock
);

export default router;
