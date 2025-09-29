import accessPermissionService from "../service/access-permission-service.js";
import { logger } from "../application/logging.js";

async function listAccessPermissions(req, res, next) {
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

async function getAccessPermission(req, res, next) {
  try {
    const permissionId = req.params.id;
    const result = await accessPermissionService.getAccessPermissionById(
      permissionId
    );

    logger.info(`Access permission retrieved: ${permissionId}`);

    res.status(200).json({
      data: result,
      message: "Access permission retrieved successfully",
    });
  } catch (err) {
    logger.error("Access permission get error:", err);
    next(err);
  }
}

export default {
  listAccessPermissions,
  getAccessPermission,
};
