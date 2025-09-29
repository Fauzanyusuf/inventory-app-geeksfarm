import express from "express";
import authController from "../../controller/auth-controller.js";
import { uploadSingle } from "../../middleware/image-middleware.js";

const router = express.Router();

router.post("/register", uploadSingle("image"), authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

export default router;
