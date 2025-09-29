import { validate } from "../validation/validate.js";
import { auditLogQuerySchema } from "../validation/audit-log-validation.js";
import auditLogService from "../service/audit-log-service.js";
import { logger } from "../application/logging.js";

async function listAuditLogs(req, res, next) {
  try {
    const query = validate(auditLogQuerySchema, req.query);

    const result = await auditLogService.listAuditLogs(query);

    logger.info(`Audit logs retrieved: ${result.data.length} items`);

    return res.status(200).json({
      data: result.data,
      meta: result.meta,
      message: "Audit logs retrieved successfully",
    });
  } catch (err) {
    logger.error("Audit logs list error:", err);
    next(err);
  }
}

export default {
  listAuditLogs,
};
