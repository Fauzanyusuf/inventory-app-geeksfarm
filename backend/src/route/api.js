import express from "express";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { rbacMiddleware } from "../middleware/rbac-middleware.js";
import userController from "../controller/user-controller.js";

const apiRouter = express.Router();
apiRouter.use(authMiddleware);

apiRouter.get("/api/testAuth", (req, res) => {
  res.json({
    status: "Approved Test Auth",
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get(
  "/api/testAuthPerm",
  rbacMiddleware(["report:read"]),
  (req, res) => {
    res.json({
      status: "Approved Test Auth with RBAC",
      timestamp: new Date().toISOString(),
    });
  }
);

apiRouter.post("/users/refresh", userController.refresh);
apiRouter.post("/users/logout", userController.logout);

export default apiRouter;
