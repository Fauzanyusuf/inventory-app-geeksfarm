import express from "express";
import authController from "../controller/auth-controller.js";

const publicRouter = express.Router();

publicRouter.get("/", (req, res) => {
  res.json({
    status: "ok",
    data: { name: "Public API" },
    timestamp: new Date().toISOString(),
  });
});

publicRouter.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

publicRouter.post("/auth/login", authController.login);

export default publicRouter;
