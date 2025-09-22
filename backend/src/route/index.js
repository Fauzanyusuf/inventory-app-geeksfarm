import express from "express";
import publicRoutes from "./public/index.js";
import protectedRoutes from "./protected/index.js";

const router = express.Router();

router.use(publicRoutes);
router.use(protectedRoutes);

export default router;
