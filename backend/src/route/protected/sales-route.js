import express from "express";
import stockMovementController from "../../controller/stock-movement-controller.js";
import rbacMiddleware from "../../middleware/rbac-middleware.js";

const router = express.Router();

// Commit sales (OUT movements for multiple products)
router.post(
  "/commit",
  rbacMiddleware(["inventory:manage"]),
  stockMovementController.commitSales
);

export default router;
