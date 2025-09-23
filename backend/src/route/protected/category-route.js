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

router.patch(
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

router.put(
  "/:id/image",
  rbacMiddleware(["product:manage"]),
  uploadSingle("image"),
  categoryController.uploadCategoryImage
);

router.get(
  "/:id/image",
  rbacMiddleware(["product:read"]),
  categoryController.getCategoryImage
);

router.delete(
  "/:id/image",
  rbacMiddleware(["product:manage"]),
  categoryController.deleteCategoryImage
);

export default router;
