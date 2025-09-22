import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";
import { replaceOneToOneImage } from "./image-service.js";
import { logger } from "../application/logging.js";

export async function create(data, userId = null, file = null) {
  try {
    const result = await prisma.category.create({
      data: {
        ...data,
        isDeleted: false,
      },
    });

    let imageResult = null;
    if (file) {
      imageResult = await replaceOneToOneImage(
        "category",
        result.id,
        file,
        userId
      );
    }

    // Audit logging
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          entity: "Category",
          entityId: result.id,
          oldValues: null,
          newValues: JSON.stringify({ ...result, image: imageResult?.image }),
        },
      });
    }

    logger.info("Category created:", result.id, "with image:", !!imageResult);
    return { category: result, image: imageResult?.image };
  } catch (error) {
    logger.error("Category creation error:", error);
    throw new ResponseError(500, "Failed to create category");
  }
}

export async function list({ page = 1, limit = 10, search }) {
  try {
    const skip = (page - 1) * limit;
    const where = { isDeleted: false };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    logger.info("Categories retrieved:", { count: categories.length, total });

    return { items: categories, meta: { total, page, limit, totalPages } };
  } catch (error) {
    logger.error("Category list error:", error);
    throw new ResponseError(500, "Failed to retrieve categories");
  }
}

export async function getById(id) {
  try {
    const result = await prisma.category.findUnique({
      where: { id, isDeleted: false },
    });

    if (!result) {
      throw new ResponseError(404, "Category not found");
    }

    logger.info("Category retrieved:", result);
    return result;
  } catch (error) {
    if (error instanceof ResponseError) throw error;
    logger.error("Category retrieval error:", error);
    throw new ResponseError(500, "Failed to retrieve category");
  }
}

export async function update(id, data, userId = null) {
  try {
    // Get old values for audit
    const oldRecord = await prisma.category.findUnique({
      where: { id, isDeleted: false },
    });

    if (!oldRecord) {
      throw new ResponseError(404, "Category not found");
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      // Audit logging
      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: "UPDATE",
            entity: "Category",
            entityId: id,
            oldValues: JSON.stringify(oldRecord),
            newValues: JSON.stringify(updated),
          },
        });
      }

      return updated;
    });

    logger.info("Category updated:", result);
    return result;
  } catch (error) {
    if (error instanceof ResponseError) throw error;
    logger.error("Category update error:", error);
    throw new ResponseError(500, "Failed to update category");
  }
}

export async function remove(id, userId = null) {
  try {
    // Get old values for audit
    const oldRecord = await prisma.category.findUnique({
      where: { id, isDeleted: false },
    });

    if (!oldRecord) {
      throw new ResponseError(404, "Category not found");
    }

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.category.update({
        where: { id },
        data: {
          isDeleted: true,
        },
      });

      // Audit logging
      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: "DELETE",
            entity: "Category",
            entityId: id,
            oldValues: JSON.stringify(oldRecord),
            newValues: JSON.stringify(deleted),
          },
        });
      }

      return deleted;
    });

    logger.info("Category soft deleted:", result);
    return result;
  } catch (error) {
    if (error instanceof ResponseError) throw error;
    logger.error("Category delete error:", error);
    throw new ResponseError(500, "Failed to delete category");
  }
}

export async function uploadImages(id, filesInfo, userId = null) {
  // Category hanya support satu image (one-to-one relationship)
  if (!filesInfo || filesInfo.length === 0) {
    throw new ResponseError(400, "No files provided");
  }

  const fileInfo = filesInfo[0]; // Ambil file pertama saja
  const result = await replaceOneToOneImage("Category", id, fileInfo, userId, {
    imageField: "imageId",
  });

  return [result.image]; // Return sebagai array untuk konsistensi
}

export default {
  create,
  list,
  getById,
  update,
  remove,
  uploadImages,
};
