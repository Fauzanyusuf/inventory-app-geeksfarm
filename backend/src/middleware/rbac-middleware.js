import { ResponseError } from "../utils/response-error.js";
import { logger } from "../application/logging.js";

export function rbacMiddleware(requiredPermissions = []) {
  return (req, res, next) => {
    try {
      const { permissions: userPermissions = [], id: userId } = req.user || {};

      if (!userId) {
        throw new ResponseError(401, "Unauthorized: Missing user data");
      }

      const isAuthorized = requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!isAuthorized) {
        logger.error("RBAC denied", {
          userId,
          required: requiredPermissions,
          current: userPermissions,
        });

        throw new ResponseError(403, "Forbidden: insufficient permissions");
      }

      next();
    } catch (err) {
      logger.debug("RBAC middleware error", { error: err?.message });
      next(err);
    }
  };
}
