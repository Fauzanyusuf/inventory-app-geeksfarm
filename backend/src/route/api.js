import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import rbacMiddleware from "../middleware/rbac-middleware.js";
import productRouter from "../route/product.js";
import categoryRouter from "../route/category.js";
import roleRouter from "../route/role.js";
import userRouter from "../route/user.js";
import authController from "../controller/auth-controller.js";

const apiRouter = express.Router();
apiRouter.use(authMiddleware);
apiRouter.use("/api/products", productRouter);
apiRouter.use("/api/categories", categoryRouter);
apiRouter.use("/api/roles", roleRouter);
apiRouter.use("/api/users", userRouter);

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

export default apiRouter;
