import express from "express";
import rbacMiddleware from "../../middleware/rbac-middleware.js";
import roleController from "../../controller/role-controller.js";

const router = express.Router();

router.get("/", rbacMiddleware(["user:read"]), roleController.listRoles);

export default router;
