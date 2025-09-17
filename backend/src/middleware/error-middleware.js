import { logger } from "../application/logging.js";
import { ResponseError } from "../utils/response-error.js";

export default function errorMiddleware(err, req, res, next) {
  if (!err) return next();

  const status = err instanceof ResponseError ? err.status || 500 : 500;
  const message = err?.message || "Internal Server Error";

  logger.error("Error middleware caught an error: ", {
    status,
    message,
  });

  res.status(status).json({ errors: message });
}
