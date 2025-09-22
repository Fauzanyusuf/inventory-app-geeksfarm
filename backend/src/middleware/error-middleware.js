import { logger } from "../application/logging.js";
import { ResponseError } from "../utils/response-error.js";

export default function errorMiddleware(err, req, res, next) {
  if (!err) return next();

  const status = err instanceof ResponseError ? err.status || 500 : 500;
  let message = err?.originalMessage || err?.message || "Internal Server Error";

  // Try to parse JSON string back to array for validation errors
  if (
    typeof message === "string" &&
    message.startsWith("[") &&
    message.endsWith("]")
  ) {
    try {
      message = JSON.parse(message);
    } catch {
      // If parsing fails, keep as string
    }
  }

  logger.error("Error middleware caught an error: ", {
    status,
    message,
  });

  // Handle structured error format (array of {field, message})
  if (Array.isArray(message)) {
    return res.status(status).json({ errors: message });
  }

  // Handle legacy string error format for backward compatibility
  // Convert to structured format
  return res.status(status).json({
    errors: [{ field: "general", message: message }],
  });
}
