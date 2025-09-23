import express from "express";
import userController from "../../controller/user-controller.js";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import { uploadSingle } from "../../middleware/image-middleware.js";

const router = express.Router();

router.get("/", rbacMiddleware(["user:read"]), userController.listUsers);

router.get("/me", userController.getCurrentUser);
router.patch("/me", userController.updateCurrentUser);

router.put("/me/image", uploadSingle("image"), userController.uploadUserImage);

router.get("/me/image", userController.getUserImage);

router.delete("/me/image", userController.deleteUserImage);

router.get("/:id", rbacMiddleware(["user:read"]), userController.getUserById);

router.patch(
  "/:id/approve",
  rbacMiddleware(["user:manage"]),
  userController.patchApproveUser
);

export default router;
