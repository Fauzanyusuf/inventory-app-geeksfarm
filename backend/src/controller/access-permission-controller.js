import accessPermissionService from "../service/access-permission-service.js";
import { logger } from "../application/logging.js";

export async function listAccessPermissions(req, res, next) {
  try {
    const result = await accessPermissionService.listAccessPermissions();

    logger.info(`Access permissions retrieved: ${result.length} items`);

    res.status(200).json({
      data: result,
      message: "Access permissions retrieved successfully",
    });
  } catch (err) {
    logger.error("Access permissions list error:", err);
    next(err);
  }
}

export default {
  listAccessPermissions,
};
