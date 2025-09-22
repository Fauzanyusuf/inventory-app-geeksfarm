import express from "express";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import auditLogController from "../../controller/audit-log-controller.js";

const router = express.Router();

router.get(
  "/",
  rbacMiddleware(["user:manage"]),
  auditLogController.listAuditLogs
);

export default router;
