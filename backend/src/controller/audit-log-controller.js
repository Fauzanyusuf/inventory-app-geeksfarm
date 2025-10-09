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

async function getEntityCreator(req, res, next) {
	try {
		const { entity, entityId } = req.params;

		if (!entity || !entityId) {
			return res.status(400).json({
				message: "Entity and entityId are required",
			});
		}

		const creator = await auditLogService.getEntityCreator(entity, entityId);

		if (!creator) {
			return res.status(404).json({
				message: "Creator information not found",
			});
		}

		return res.status(200).json({
			data: creator,
			message: "Creator information retrieved successfully",
		});
	} catch (err) {
		logger.error("Get entity creator error:", err);
		next(err);
	}
}

export default {
	listAuditLogs,
	getEntityCreator,
};
