import { logger } from "../application/logging.js";

function serializeForAudit(obj, seen = new WeakSet()) {
  if (obj == null) return null;

  if (typeof obj === "object") {
    if (seen.has(obj)) return "[Circular Reference]";
    seen.add(obj);
  }

  try {
    if (typeof obj === "function" || typeof obj === "symbol") return null;

    if (Array.isArray(obj)) {
      return obj.map((item) => serializeForAudit(item, seen));
    }

    if (isPrismaModel(obj)) {
      return extractEssentialFields(obj);
    }

    if (typeof obj !== "object") return obj;

    const cleanObj = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        key.startsWith("$") ||
        key.startsWith("_") ||
        typeof value === "function"
      ) {
        continue;
      }

      cleanObj[key] = serializeForAudit(value, seen);
    }

    return cleanObj;
  } finally {
    if (typeof obj === "object" && obj !== null) {
      seen.delete(obj);
    }
  }
}

function isPrismaModel(obj) {
  return (
    obj &&
    typeof obj === "object" &&
    (obj._prisma ||
      (obj.id &&
        typeof obj.id === "string" &&
        (obj.createdAt instanceof Date || obj.updatedAt instanceof Date)))
  );
}

function extractEssentialFields(model) {
  const essentialFields = [
    "id",
    "name",
    "email",
    "phone",
    "description",
    "isDeleted",
    "isActive",
    "status",
    "quantity",
    "unit",
    "sellingPrice",
    "costPrice",
    "barcode",
    "isPerishable",
  ];

  return essentialFields.reduce((result, field) => {
    if (model[field] !== undefined) {
      const value = model[field];
      result[field] = value instanceof Date ? value.toISOString() : value;
    }
    return result;
  }, {});
}

export async function createAuditLog(
  prisma,
  { userId, action, entity, entityId, oldValues, newValues }
) {
  try {
    const serializedOldValues = serializeForAudit(oldValues);
    const serializedNewValues = serializeForAudit(newValues);

    if (serializedOldValues !== null) JSON.stringify(serializedOldValues);
    if (serializedNewValues !== null) JSON.stringify(serializedNewValues);

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: serializedOldValues,
        newValues: serializedNewValues,
      },
    });
  } catch (error) {
    logger.error("Audit log creation failed:", {
      error: error.message,
      stack: error.stack,
      context: { userId, action, entity, entityId },
    });
  }
}
