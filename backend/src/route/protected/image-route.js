import express from "express";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import { getImage, deleteImageHandler } from "../../controller/image-controller.js";

const router = express.Router();

router.get(
  "/:id",
  rbacMiddleware(["inventory:read"]),
  getImage
);

router.delete(
  "/:id",
  rbacMiddleware(["inventory:manage"]),
  deleteImageHandler
);

export default router;