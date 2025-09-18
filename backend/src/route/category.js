import express from "express";
import categoryController from "../controller/category-controller.js";
import rbacMiddleware from "../middleware/rbac-middleware.js";
import { upload, wrapMulter } from "../middleware/upload-middleware.js";

const router = express.Router();

// list categories (pagination)
router.get(
  "/",
  rbacMiddleware(["product:read"]),
  categoryController.listCategoriesHandler
);

router.post(
  "/",
  rbacMiddleware(["product:manage"]),
  categoryController.createCategoryHandler
);

// update category
router.put(
  "/:id",
  rbacMiddleware(["product:manage"]),
  categoryController.updateCategoryHandler
);

// read category details
router.get(
  "/:id",
  rbacMiddleware(["product:read"]),
  categoryController.getCategoryHandler
);

// delete category
router.delete(
  "/:id",
  rbacMiddleware(["product:manage"]),
  categoryController.deleteCategoryHandler
);

// upload/replace category image
router.post(
  "/:id/image",
  rbacMiddleware(["product:manage"]),
  wrapMulter(upload.single("image")),
  categoryController.uploadCategoryImageHandler
);

export default router;
