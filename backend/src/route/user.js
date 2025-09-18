import express from "express";
import rbacMiddleware from "../middleware/rbac-middleware.js";
import userController from "../controller/user-controller.js";
import { upload, wrapMulter } from "../middleware/upload-middleware.js";

const router = express.Router();

// upload/replace a user's single image
router.post(
  "/:id/image",
  rbacMiddleware(["user:manage"]),
  wrapMulter(upload.single("image")),
  userController.uploadUserImage
);

export default router;
