import express from "express";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import roleController from "../../controller/role-controller.js";

const router = express.Router();

router.get("/", rbacMiddleware(["user:read"]), roleController.listRoles);
router.get("/:id", rbacMiddleware(["user:read"]), roleController.getRole);

export default router;
