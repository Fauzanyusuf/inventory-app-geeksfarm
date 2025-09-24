import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";
import { replaceOneToOneImage, deleteImage } from "./image-service.js";
import { deleteFile } from "../utils/image-utils.js";
import { logger } from "../application/logging.js";
import { createAuditLog } from "../utils/audit-utils.js";

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
      await createAuditLog(prisma, {
        userId,
        action: "CREATE",
        entity: "Category",
        entityId: result.id,
        oldValues: null,
        newValues: { ...result, imageId: imageResult?.image?.id },
      });
    }

    logger.info("Category created:", result.id, "with image:", !!imageResult);

    return {
      category: {
        id: result.id,
        name: result.name,
        description: result.description,
        createdAt: result.createdAt,
        imageId: imageResult?.image?.id,
      },
      image: imageResult?.image,
    };
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

    logger.info("Categories retrieved:", { count: categories.length, total });

    return { data: categories, meta: { total, page, limit, totalPages } };
  } catch (error) {
    logger.error("Category list error:", error);
    throw new ResponseError(500, "Failed to retrieve categories");
  }
}

export async function getById(id) {
  try {
    const result = await prisma.category.findUnique({
      where: { id, isDeleted: false },
      omit: {
        createdAt: true,
        updatedAt: true,
        isDeleted: true,
        imageId: true,
      },
      include: {
        image: {
          select: { id: true, url: true, thumbnailUrl: true },
        },
        products: {
          where: { isDeleted: false },
          select: { id: true, name: true },
        },
      },
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

export async function remove(id, userId = null) {
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

export async function uploadImage(id, fileInfo, userId = null) {
  if (!fileInfo) {
    throw new ResponseError(400, "No file provided");
  }

  // Check if category exists and is not deleted
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });

  if (!category) {
    await deleteFile(fileInfo.filename);
    throw new ResponseError(404, "Category not found");
  }

  if (category.isDeleted) {
    await deleteFile(fileInfo.filename);
    throw new ResponseError(410, "Cannot upload image to deleted category");
  }

  const result = await replaceOneToOneImage("category", id, fileInfo, userId, {
    imageField: "imageId",
  });

  return result.image; // Return single image object
}

export async function getCategoryImage(categoryId) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId, isDeleted: false },
      select: { id: true, name: true, imageId: true },
    });

    if (!category) {
      throw new ResponseError(404, "Category not found");
    }

    if (!category.imageId) {
      throw new ResponseError(404, "Category has no image");
    }

    const image = await prisma.image.findUnique({
      where: { id: category.imageId },
    });

    if (!image) {
      throw new ResponseError(404, "Image not found");
    }

    logger.info(`Retrieved image for category: ${categoryId}`);

    return {
      id: image.id,
      url: image.url,
      thumbnailUrl: image.thumbnailUrl,
      altText: image.altText,
      createdAt: image.createdAt,
    };
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

export async function deleteCategoryImage(categoryId, userId = null) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId, isDeleted: false },
      select: { id: true, name: true, imageId: true },
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
  create,
  list,
  getById,
  update,
  remove,
  uploadImage,
  getCategoryImage,
  deleteCategoryImage,
};
