import { prisma } from "../application/database.js";
import { logger } from "../application/logging.js";
import { createAuditLog } from "../utils/audit-utils.js";
import { cleanupFilesOnError, deleteFile } from "../utils/image-utils.js";
import { ResponseError } from "../utils/response-error.js";
import { deleteImage, replaceOneToOneImage } from "./image-service.js";

async function createCategory(data, file = null, userId = null) {
  try {
    const existing = await prisma.category.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new ResponseError(409, "Category name already exists");
    }

    const result = await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data,
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      await createAuditLog(tx, {
        action: "CREATE",
        entity: "Category",
        entityId: category.id,
        newValues: category,
        userId,
      });
      return category;
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

    return { category: result, image: imageResult?.image ?? null };
  } catch (err) {
    logger.error("Category creation error:", err);
    if (file) await cleanupFilesOnError([file]);
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, "Failed to create category: Server error");
  }
}

async function listCategories({ page = 1, limit = 10, search }) {
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
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          image: {
            select: { id: true, url: true, thumbnailUrl: true, altText: true },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return { data: categories, meta: { total, page, limit, totalPages } };
  } catch (error) {
    logger.error("Category list error:", error);
    throw new ResponseError(500, "Failed to retrieve categories");
  }
}

async function getCategoryById(id) {
  try {
    const result = await prisma.category.findUnique({
      where: { id, isDeleted: false },
      omit: {
        isDeleted: true,
        imageId: true,
      },
      include: {
        image: {
          select: { id: true, url: true, thumbnailUrl: true },
        },
        products: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            barcode: true,
            sellingPrice: true,
            unit: true,
            batches: {
              select: { quantity: true },
              where: { status: "AVAILABLE" },
            },
          },
        },
      },
    });

    if (!result) {
      throw new ResponseError(404, "Category not found");
    }

    if (result && Array.isArray(result.products)) {
      result.products = result.products.map((p) => {
        const totalQuantity = (p.batches || []).reduce(
          (sum, b) => sum + (b.quantity || 0),
          0
        );
        // Buang batches jika tidak ingin mengembalikannya
        const { batches, ...rest } = p;
        return { ...rest, totalQuantity };
      });
    }

    logger.info("Category retrieved:", result);
    return result;
  } catch (error) {
    if (error instanceof ResponseError) throw error;
    logger.error("Category retrieval error:", error);
    throw new ResponseError(500, "Failed to retrieve category");
  }
}

async function updateCategory(id, data, userId = null) {
  try {
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
        omit: { isDeleted: true },
      });

      if (userId) {
        await createAuditLog(tx, {
          userId,
          action: "UPDATE",
          entity: "Category",
          entityId: id,
          oldValues: oldRecord,
          newValues: updated,
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

async function deleteCategory(id, userId = null) {
  try {
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

      if (userId) {
        await createAuditLog(tx, {
          userId,
          action: "DELETE",
          entity: "Category",
          entityId: id,
          oldValues: oldRecord,
          newValues: deleted,
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

async function uploadCategoryImage(id, fileInfo, userId = null) {
  try {
    const category = await prisma.category.findUnique({
      where: { id, isDeleted: false },
      select: { id: true },
    });

    if (!category) {
      await deleteFile(fileInfo.filename);
      throw new ResponseError(404, "Category not found");
    }

    const result = await replaceOneToOneImage(
      "category",
      id,
      fileInfo,
      userId,
      {
        imageField: "imageId",
      }
    );

    return result.image;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(
      500,
      `Failed to upload category image: ${err.message}`
    );
  }
}

async function getCategoryImage(categoryId) {
  try {
    const result = await prisma.category.findUnique({
      where: { id: categoryId, isDeleted: false },
      select: {
        id: true,
        name: true,
        image: { omit: { productId: true } },
      },
    });

    if (!result) {
      throw new ResponseError(404, "Category not found");
    }

    if (!result.image) {
      return null;
    }

    logger.info(`Retrieved image for category: ${categoryId}`);

    return result.image;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(
      `Error getting image for category ${categoryId}: ${err.message}`
    );
    throw new ResponseError(
      500,
      `Failed to get category image: ${err.message}`
    );
  }
}

async function deleteCategoryImage(categoryId, userId = null) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId, isDeleted: false },
      select: { imageId: true },
    });

    if (!category) {
      throw new ResponseError(404, "Category not found");
    }

    if (!category.imageId) {
      throw new ResponseError(404, "Category has no image");
    }

    await deleteImage(category.imageId, userId);

    await prisma.category.update({
      where: { id: categoryId },
      data: { imageId: null },
    });

    logger.info(`Deleted image for category: ${categoryId}`);
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(
      `Error deleting image for category ${categoryId}: ${err.message}`
    );
    throw new ResponseError(
      500,
      `Failed to delete category image: ${err.message}`
    );
  }
}

export default {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  getCategoryImage,
  deleteCategoryImage,
};
