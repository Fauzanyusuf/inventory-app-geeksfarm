import express from "express";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import accessPermissionController from "../../controller/access-permission-controller.js";

const router = express.Router();

router.get(
  "/",
  rbacMiddleware(["user:read"]),
  accessPermissionController.listAccessPermissions
);

router.get(
  "/:id",
  rbacMiddleware(["user:read"]),
  accessPermissionController.getAccessPermission
);

export default router;