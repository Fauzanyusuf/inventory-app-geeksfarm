import { ResponseError } from "../utils/response-error.js";
import { logger } from "../application/logging.js";

function sanitizeInput(input) {
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  } else if (typeof input === "object" && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "string") {
        sanitized[key] = value.trim();
      } else {
        sanitized[key] = sanitizeInput(value);
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

  const sanitizedRequest = sanitizeInput(request);

  const result = schema.safeParse(sanitizedRequest);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const field = issue.path.length ? issue.path.join(".") : "root";
      return { field, message: issue.message };
    });

    logger.error("Validation failed", {
      errors,
      originalRequest: request,
      sanitizedRequest,
    });

    throw new ResponseError(400, errors);
  }

  return result.data;
}
