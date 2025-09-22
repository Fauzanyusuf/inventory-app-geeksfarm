import path from "path";
import fs from "fs/promises";
import { prisma } from "../application/database.js";
import { uploadsDir } from "../config/uploads.js";
import { logger } from "../application/logging.js";
import { generateImageUrl, deleteFile } from "../utils/image-utils.js";

export async function processAndCreateImage(
  fileInfo,
  actorUserId = null,
  options = {},
  tx = null
) {
  const processed = await processFile(fileInfo);

  const imageData = {
    url: processed.url,
    thumbnailUrl: processed.thumbnailUrl || null,
    altText: fileInfo.originalname || null,
  };

  if (options.productId) {
    imageData.productId = options.productId;
  }

  const image = await createImageRecord(tx, imageData, actorUserId);

  return { image };
}

export async function processFile(fileInfo) {
  const imageUrl = generateImageUrl(fileInfo.filename);
  let thumbUrl = null;

  try {
    const sharpModule = await import("sharp");
    const sharpLib = sharpModule.default || sharpModule;

    const inputPath = fileInfo.path || path.join(uploadsDir, fileInfo.filename);
    const ext = fileInfo.filename?.includes(".")
      ? fileInfo.filename.split(".").pop()
      : "jpg";
    const baseName = fileInfo.filename
      ? fileInfo.filename.replace(/\.[^/.]+$/, "")
      : String(Date.now());

    let resizedBuffer;
    if (fileInfo.buffer) {
      resizedBuffer = await sharpLib(fileInfo.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .toBuffer();
    } else {
      try {
        await fs.access(inputPath);
      } catch {
        logger.warn(`processFile input missing for file ${fileInfo.filename}`);
        return { url: imageUrl, thumbnailUrl: null };
      }
      resizedBuffer = await sharpLib(inputPath)
        .resize({ width: 1200, withoutEnlargement: true })
        .toBuffer();
    }

    const thumbName = `${baseName}-thumb.${ext}`;
    const thumbPath = path.join(uploadsDir, thumbName);
    await sharpLib(resizedBuffer).resize(200).toFile(thumbPath);
    thumbUrl = generateImageUrl(thumbName);
    logger.info(`Created thumbnail ${thumbPath}`);
  } catch (err) {
    logger.warn(
      `processFile error for file ${fileInfo.filename}: ${err.stack || err}`
    );
    thumbUrl = null;
  }

  return { url: imageUrl, thumbnailUrl: thumbUrl };
}

export async function replaceOneToOneImage(
  ownerType,
  ownerId,
  fileInfo,
  actorUserId = null
) {
  const processed = await processFile(fileInfo);

  const txResult = await prisma.$transaction(async (tx) => {
    let ownerExisting;
    let prevImage = null;

    if (ownerType === "user") {
      ownerExisting = await tx.user.findUnique({ where: { id: ownerId } });
      if (!ownerExisting) throw new Error("User not found");
      if (ownerExisting.imageId) {
        prevImage = await tx.image.findUnique({
          where: { id: ownerExisting.imageId },
        });
      }
    } else if (ownerType === "category") {
      ownerExisting = await tx.category.findUnique({ where: { id: ownerId } });
      if (!ownerExisting) throw new Error("Category not found");
      if (ownerExisting.imageId) {
        prevImage = await tx.image.findUnique({
          where: { id: ownerExisting.imageId },
        });
      }
    } else if (ownerType === "product") {
      ownerExisting = await tx.product.findUnique({ where: { id: ownerId } });
      if (!ownerExisting) throw new Error("Product not found");
      prevImage = await tx.image.findFirst({ where: { productId: ownerId } });
    } else {
      throw new Error("Unsupported ownerType");
    }

    const imageData = {
      url: processed.url,
      thumbnailUrl: processed.thumbnailUrl || null,
      altText: fileInfo.originalname || null,
    };
    if (ownerType === "product") imageData.productId = ownerId;

    const image = await createImageRecord(tx, imageData, actorUserId);

    let updatedOwner;
    if (ownerType === "user") {
      updatedOwner = await tx.user.update({
        where: { id: ownerId },
        data: { imageId: image.id },
      });
    } else if (ownerType === "category") {
      updatedOwner = await tx.category.update({
        where: { id: ownerId },
        data: { imageId: image.id },
      });
    } else if (ownerType === "product") {
      updatedOwner = ownerExisting;
    }

    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: ownerType === "user" ? "User" : "Category",
        entityId: ownerId,
        oldValues: ownerExisting,
        newValues: updatedOwner,
        userId: actorUserId || null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "ImageReplacement",
        entityId: image.id,
        newValues: {
          newImageId: image.id,
          prevImageId: prevImage?.id || null,
          ownerType,
          ownerId,
        },
        userId: actorUserId || null,
      },
    });

    let deletedPrev = null;
    if (prevImage) {
      deletedPrev = await tx.image.delete({ where: { id: prevImage.id } });
    }

    return { image, prevImage: deletedPrev, updatedOwner };
  });

  const fileCleanup = { success: true, errors: [] };
  if (txResult.prevImage) {
    const prev = txResult.prevImage;
    try {
      if (prev.url) {
        const prevFilename = prev.url.replace(/^\/uploads\//, "");
        const success = await deleteFile(prevFilename);
        if (!success) {
          fileCleanup.success = false;
          fileCleanup.errors.push({
            file: prevFilename,
            error: "Delete failed",
          });
          logger.warn(`Failed to delete previous image file ${prevFilename}`);
        }
      }
      if (prev.thumbnailUrl) {
        const thumbFilename = prev.thumbnailUrl.replace(/^\/uploads\//, "");
        const success = await deleteFile(thumbFilename);
        if (!success) {
          fileCleanup.success = false;
          fileCleanup.errors.push({
            file: thumbFilename,
            error: "Delete failed",
          });
          logger.warn(`Failed to delete previous thumbnail ${thumbFilename}`);
        }
      }
    } catch (err) {
      fileCleanup.success = false;
      fileCleanup.errors.push({ file: "unknown", error: String(err) });
      logger.warn(`Error during previous image cleanup: ${err}`);
    }
  }

  return {
    image: txResult.image,
    prevImage: txResult.prevImage,
    owner: txResult.updatedOwner,
    fileCleanup,
  };
}

export async function createImageRecord(tx, imageData, actorUserId = null) {
  if (tx && tx.image && tx.auditLog) {
    // Jika tx diberikan, gunakan dalam tx yang ada
    const image = await tx.image.create({ data: imageData });
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Image",
        entityId: image.id,
        newValues: image,
        userId: actorUserId || null,
      },
    });
    return image;
  } else {
    // Jika tidak ada tx, buat transaction baru
    return await prisma.$transaction(async (prismaTx) => {
      const image = await prismaTx.image.create({ data: imageData });
      await prismaTx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Image",
          entityId: image.id,
          newValues: image,
          userId: actorUserId || null,
        },
      });
      return image;
    });
  }
}

export async function processAndCreateImages(
  filesInfo,
  actorUserId = null,
  options = {},
  tx = null
) {
  if (!Array.isArray(filesInfo)) throw new Error("filesInfo must be an array");

  const results = [];
  for (const fileInfo of filesInfo) {
    const result = await processAndCreateImage(
      fileInfo,
      actorUserId,
      options,
      tx
    );
    results.push(result);
  }

  return results;
}

export async function getImageById(id) {
  try {
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!image) {
      throw new Error("Image not found");
    }

    return image;
  } catch (error) {
    logger.error("Get image by ID error:", error);
    throw error;
  }
}

export async function deleteImage(id, userId = null) {
  try {
    const image = await prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new Error("Image not found");
    }

    // Delete from database
    await prisma.image.delete({
      where: { id },
    });

    // Delete physical files
    const fileCleanup = { success: true, errors: [] };

    try {
      if (image.url && image.url.startsWith("/uploads/")) {
        const filename = image.url.replace(/^\/uploads\//, "");
        const success = await deleteFile(filename);
        if (!success) {
          fileCleanup.success = false;
          fileCleanup.errors.push({
            file: filename,
            error: "Delete failed",
          });
          logger.warn(`Failed to delete image file ${filename}`);
        }
      }
      if (image.thumbnailUrl && image.thumbnailUrl.startsWith("/uploads/")) {
        const thumbFilename = image.thumbnailUrl.replace(/^\/uploads\//, "");
        const success = await deleteFile(thumbFilename);
        if (!success) {
          fileCleanup.success = false;
          fileCleanup.errors.push({
            file: thumbFilename,
            error: "Delete failed",
          });
          logger.warn(`Failed to delete thumbnail ${thumbFilename}`);
        }
      }
    } catch (fileError) {
      logger.error("File deletion error:", fileError);
      fileCleanup.success = false;
      fileCleanup.errors.push({
        error: fileError.message,
      });
    }

    // Audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          action: "DELETE",
          entity: "Image",
          entityId: id,
          oldValues: image,
          userId,
        },
      });
    }

    logger.info(
      `Image deleted: ${id}, file cleanup: ${
        fileCleanup.success ? "success" : "partial"
      }`
    );

    return { image, fileCleanup };
  } catch (error) {
    logger.error("Delete image error:", error);
    throw error;
  }
}
