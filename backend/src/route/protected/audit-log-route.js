import express from "express";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import auditLogController from "../../controller/audit-log-controller.js";

const router = express.Router();

router.get(
	"/",
	rbacMiddleware(["user:manage"]),
	auditLogController.listAuditLogs
);

router.get(
	"/creator/:entity/:entityId",
	rbacMiddleware(["product:read"]),
	auditLogController.getEntityCreator
);

export default router;
