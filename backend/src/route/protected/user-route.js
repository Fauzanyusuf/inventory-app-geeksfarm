import express from "express";
import userController from "../../controller/user-controller.js";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import { uploadSingle } from "../../middleware/image-middleware.js";

const router = express.Router();

router.get("/", rbacMiddleware(["user:read"]), userController.listUsers);

router.get("/me", userController.getCurrentUser);
router.patch("/me", userController.updateCurrentUser);

router.post(
  "/:id/image",
  rbacMiddleware(["user:manage"]),
  uploadSingle("image"),
  userController.uploadUserImage
);

router.patch(
  "/:id/approve",
  rbacMiddleware(["user:manage"]),
  userController.patchApproveUser
);

export default router;
