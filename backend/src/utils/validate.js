import { ResponseError } from "./response-error.js";
import { logger } from "../application/logging.js";

function sanitizeInput(input) {
  if (typeof input === "object" && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "string") {
        sanitized[key] = value.trim();
      } else if (typeof value === "object") {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  return input;
}

export function validate(schema, request) {
  if (!schema || typeof schema.safeParse !== "function") {
    throw new ResponseError(500, "Invalid validation schema provided");
  }

  const sanitizedRequest = sanitizeInput(input);

  const result = schema.safeParse(sanitizedRequest);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "root";
      return { path, message: issue.message, code: issue.code };
    });

    const message = issues.map((i) => `${i.path}: ${i.message}`).join("; ");

    logger.error("Validation failed", {
      message,
      issues,
      originalRequest: request,
      sanitizedRequest,
    });

    throw new ResponseError(400, message || "Validation failed");
  }

  return result.data;
}
