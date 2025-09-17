import express from "express";
import { createCategoryHandler } from "../controller/category-controller.js";
import { rbacMiddleware } from "../middleware/rbac-middleware.js";

const router = express.Router();

// list categories (pagination)
router.get("/", rbacMiddleware(["product:read"]), async (req, res, next) => {
  try {
    const controller = await import("../controller/category-controller.js");
    return controller.listCategoriesHandler(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.post("/", rbacMiddleware(["product:manage"]), createCategoryHandler);

// update category
router.put(
  "/:id",
  rbacMiddleware(["product:manage"]),
  async (req, res, next) => {
    try {
      const controller = await import("../controller/category-controller.js");
      return controller.updateCategoryHandler(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// read category details
router.get("/:id", rbacMiddleware(["product:read"]), async (req, res, next) => {
  try {
    const controller = await import("../controller/category-controller.js");
    return controller.getCategoryHandler(req, res, next);
  } catch (err) {
    next(err);
  }
});

// delete category
router.delete(
  "/:id",
  rbacMiddleware(["product:manage"]),
  async (req, res, next) => {
    try {
      const controller = await import("../controller/category-controller.js");
      return controller.deleteCategoryHandler(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
