import express from "express";
import rbacMiddleware from "../middleware/rbac-middleware.js";
import {
  listRoles,
  getRole,
  updateRolePermissions,
} from "../controller/role-controller.js";

const router = express.Router();

// List all roles
router.get("/", rbacMiddleware(["user:manage"]), listRoles);
// Get role by id
router.get("/:id", rbacMiddleware(["user:manage"]), getRole);
// Update role permissions
router.put("/:id", rbacMiddleware(["user:manage"]), updateRolePermissions);

export default router;
