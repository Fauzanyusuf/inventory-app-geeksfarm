import express from "express";
import stockMovementController from "../../controller/stock-movement-controller.js";
import rbacMiddleware from "../../middleware/rbac-middleware.js";

const router = express.Router();

// Get stock movements with filtering
router.get(
  "/",
  rbacMiddleware(["inventory:read"]),
  stockMovementController.getStockMovements
);

export default router;
