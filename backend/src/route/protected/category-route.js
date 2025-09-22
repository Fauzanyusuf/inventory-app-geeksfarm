import express from "express";
import categoryController from "../../controller/category-controller.js";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import { uploadSingle } from "../../middleware/image-middleware.js";

const router = express.Router();

router.get(
  "/",
  rbacMiddleware(["product:read"]),
  categoryController.listCategories
);

router.get(
  "/:id",
  rbacMiddleware(["product:read"]),
  categoryController.getCategory
);

router.post(
  "/",
  rbacMiddleware(["product:manage"]),
  uploadSingle("image"),
  categoryController.createCategory
);

router.put(
  "/:id",
  rbacMiddleware(["product:manage"]),
  uploadSingle("image"),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  rbacMiddleware(["product:manage"]),
  categoryController.deleteCategory
);

router.post(
  "/:id/image",
  rbacMiddleware(["product:manage"]),
  uploadSingle("image"),
  categoryController.uploadCategoryImage
);

export default router;