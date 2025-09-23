import express from "express";
import productRoute from "./product-route.js";
import categoryRoute from "./category-route.js";
import userRoute from "./user-route.js";
import stockMovementRoute from "./stock-movement-route.js";
import salesRoute from "./sales-route.js";
import auditLogRoute from "./audit-log-route.js";
import roleRoute from "./role-route.js";
import accessPermissionRoute from "./access-permission-route.js";
import authMiddleware from "../../middleware/auth-middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.use("/products", productRoute);
router.use("/categories", categoryRoute);
router.use("/users", userRoute);
router.use("/stock-movements", stockMovementRoute);
router.use("/sales", salesRoute);
router.use("/audit-logs", auditLogRoute);
router.use("/roles", roleRoute);
router.use("/access-permissions", accessPermissionRoute);

export default router;
