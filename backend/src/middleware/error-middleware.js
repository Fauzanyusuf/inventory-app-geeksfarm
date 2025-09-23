import { logger } from "../application/logging.js";
import { ResponseError } from "../utils/response-error.js";
import { ZodError } from "zod";

export default function errorMiddleware(err, req, res, next) {
  if (!err) return next();

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join(".") || "root",
      message: issue.message,
    }));
    return res.status(400).json({ errors });
  }

  const status = err instanceof ResponseError ? err.status || 500 : 500;
  let message = err.originalMessage || err.message || "Internal Server Error";

  if (typeof message === "string" && message.match(/^\[.*\]$/)) {
    try {
      message = JSON.parse(message);
    } catch (err) {
      logger.warn("Failed to parse error message as JSON array", {
        originalMessage: message,
        parseError: err.message,
      });
    }
  }

  logger.error("Error middleware caught an error: ", {
    status,
    message,
  });

  const errors = Array.isArray(message)
    ? message
    : [{ field: "general", message }];

  return res.status(status).json({ errors });
}
