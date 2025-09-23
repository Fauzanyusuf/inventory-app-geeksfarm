import { ResponseError } from "../utils/response-error.js";
import { logger } from "../application/logging.js";

function sanitizeInput(input) {
  if (input == null) return input;
  if (Array.isArray(input)) return input.map(sanitizeInput);
  if (typeof input === "object") return sanitizeObject(input);
  if (typeof input === "string") return input.trim();
  return input;
}

function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeInput(value);
  }
  return sanitized;
}

export function validate(schema, request) {
  if (!schema?.safeParse) {
    throw new ResponseError(500, "Invalid validation schema provided");
  }

  const sanitizedRequest = sanitizeInput(request);
  const result = schema.safeParse(sanitizedRequest);

  if (!result.success) {
    logger.error("Validation failed", {
      errors: result.error.issues,
      originalRequest: request,
      sanitizedRequest,
    });
    throw result.error;
  }
  return result.data;
}
