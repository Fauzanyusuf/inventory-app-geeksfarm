import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";
import { logger } from "../application/logging.js";

async function listAuditLogs({
  page = 1,
  limit = 10,
  entity,
  action,
  userId,
  startDate,
  endDate,
}) {
  try {
    const skip = (page - 1) * limit;
    const where = {};

    if (entity) {
      where.entity = entity;
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          oldValues: true,
          newValues: true,
          user: {
            select: { id: true, name: true },
          },
          createdAt: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `Audit logs listed: ${auditLogs.length} items, page ${page}/${totalPages}`
    );

    return {
      data: auditLogs,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    logger.error("Audit logs list error:", error);
    throw new ResponseError(500, "Failed to list audit logs");
  }
}

export default {
  listAuditLogs,
};
