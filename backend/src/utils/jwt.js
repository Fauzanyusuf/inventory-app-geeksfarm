import jwt from "jsonwebtoken";
import { logger } from "../application/logging.js";
import { ResponseError } from "./response-error.js";

export function signToken(payload) {
  if (!process.env.JWT_SECRET) {
    logger.error("JWT_SECRET is not set");
    throw new ResponseError(500, "Server configuration error");
  }

  if (!payload || typeof payload !== "object") {
    throw new ResponseError(400, "Invalid token payload");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

export function signRefreshToken(payload) {
  if (!process.env.JWT_SECRET) {
    logger.error("JWT_SECRET is not set");
    throw new ResponseError(500, "Server configuration error");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

export function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    logger.error("JWT_SECRET is not set in environment");
    throw new ResponseError(500, "Server configuration error");
  }

  if (!token || typeof token !== "string") {
    throw new ResponseError(401, "Invalid token");
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      logger.warn("JWT token expired", { message: err.message });
      throw new ResponseError(401, "Token has expired");
    }

    if (err instanceof jwt.JsonWebTokenError) {
      logger.warn("JWT token error", { message: err.message });
      throw new ResponseError(401, "Invalid token");
    }

    logger.warn("JWT verify failed", { message: err?.message || err });
    throw new ResponseError(401, "Invalid or expired token");
  }
}
