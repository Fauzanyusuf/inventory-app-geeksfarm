import express from "express";
import authController from "../controller/auth-controller.js";

const publicRouter = express.Router();

publicRouter.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    data: {
      name: "PUBLIC API",
      version: "1.0.0",
    },
    timestamp: new Date().toISOString(),
  });
});

publicRouter.post("/api/auth/login", authController.login);
publicRouter.post("/api/auth/refresh", authController.refresh);
publicRouter.post("/api/auth/logout", authController.logout);

export default publicRouter;
