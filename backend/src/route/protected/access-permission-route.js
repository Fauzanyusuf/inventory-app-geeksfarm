import express from "express";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import accessPermissionController from "../../controller/access-permission-controller.js";

const router = express.Router();

router.get(
  "/",
  rbacMiddleware(["user:read"]),
  accessPermissionController.listAccessPermissions
);

export default router;