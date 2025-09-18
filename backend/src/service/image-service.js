import path from "path";
import fs from "fs/promises";
import { prisma } from "../application/database.js";
import { uploadsDir, uploadsUrlPrefix } from "../config/uploads.js";
import { logger } from "../application/logging.js";

export async function processAndCreateImage(fileInfo, actorUserId = null) {
  // fallback to using the replacement helper which processes file and creates DB row
  const processed = await processFile(fileInfo);
  const image = await prisma.image.create({
    data: {
      url: processed.url,
      thumbnailUrl: processed.thumbnailUrl || null,
      altText: fileInfo.originalname || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entity: "Image",
      entityId: image.id,
      newValues: image,
      userId: actorUserId || null,
    },
  });

  return { image, thumbnailUrl: processed.thumbnailUrl };
}

export default { processAndCreateImage };

export async function processFile(fileInfo) {
  const imageUrl = `${uploadsUrlPrefix}/${fileInfo.filename}`;
  let thumbUrl = null;

  try {
    const sharp = await import("sharp");
    const inputPath = fileInfo.path;
    const ext = fileInfo.filename.includes(".")
      ? fileInfo.filename.split(".").pop()
      : "jpg";
    const baseName = fileInfo.filename.replace(/\.[^/.]+$/, "");

    // resize main image
    const resizedBuffer = await sharp
      .default(inputPath)
      .resize({ width: 1200, withoutEnlargement: true })
      .toBuffer();
    await sharp.default(resizedBuffer).toFile(inputPath);

    // create thumbnail
    const thumbName = `${baseName}-thumb.${ext}`;
    const thumbPath = path.join(uploadsDir, thumbName);
    await sharp.default(inputPath).resize(200).toFile(thumbPath);
    thumbUrl = `${uploadsUrlPrefix}/${thumbName}`;
  } catch (err) {
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
  // process file first (writes files)
  const processed = await processFile(fileInfo);

  // run transaction: create image, update owner to point to new image, record audit logs, delete previous image row
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
      // product has many images, but if used as one-to-one replacement we use productId relation
      const product = await tx.product.findUnique({ where: { id: ownerId } });
      if (!product) throw new Error("Product not found");
      // find an image that belongs to this product (one-to-one semantics for replacement)
      prevImage = await tx.image.findFirst({ where: { productId: ownerId } });
      ownerExisting = product;
    } else {
      throw new Error("Unsupported ownerType");
    }

    const imageData = {
      url: processed.url,
      thumbnailUrl: processed.thumbnailUrl || null,
      altText: fileInfo.originalname || null,
    };
    if (ownerType === "product") {
      imageData.productId = ownerId;
    }
    const image = await tx.image.create({ data: imageData });

    // update owner
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
      // product images is an array; for one-to-one replacement we set productId on new image
      updatedOwner = product; // product unchanged in product table
    }

    // audit logs
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Image",
        entityId: image.id,
        newValues: image,
        userId: actorUserId || null,
      },
    });

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

    // audit log for replacement: record prev/new image relationship and actor
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "ImageReplacement",
        entityId: image.id,
        newValues: {
          newImageId: image.id,
          prevImageId: prevImage ? prevImage.id : null,
          ownerType,
          ownerId,
        },
        userId: actorUserId || null,
      },
    });

    // delete previous image row if exists
    let deletedPrev = null;
    if (prevImage) {
      deletedPrev = await tx.image.delete({ where: { id: prevImage.id } });
    }

    return { image, prevImage: deletedPrev, updatedOwner };
  });

  // after commit, remove previous image files from disk
  const fileCleanup = { success: true, errors: [] };
  if (txResult.prevImage) {
    const prev = txResult.prevImage;
    try {
      if (prev.url) {
        const prevFilename = filenameFromUrl(prev.url);
        const prevPath = path.join(uploadsDir, prevFilename);
        await fs.unlink(prevPath).catch((err) => {
          fileCleanup.success = false;
          fileCleanup.errors.push({ file: prevPath, error: String(err) });
          logger.warn(
            `Failed to delete previous image file ${prevPath}: ${err}`
          );
        });
      }
      if (prev.thumbnailUrl) {
        const thumbFilename = filenameFromUrl(prev.thumbnailUrl);
        const thumbPath = path.join(uploadsDir, thumbFilename);
        await fs.unlink(thumbPath).catch((err) => {
          fileCleanup.success = false;
          fileCleanup.errors.push({ file: thumbPath, error: String(err) });
          logger.warn(
            `Failed to delete previous thumbnail ${thumbPath}: ${err}`
          );
        });
      }
    } catch (e) {
      // log error but do not rollback DB
      fileCleanup.success = false;
      fileCleanup.errors.push({ file: "unknown", error: String(e) });
      logger.warn(`Error during previous image cleanup: ${e}`);
    }
  }

  return {
    image: txResult.image,
    prevImage: txResult.prevImage,
    owner: txResult.updatedOwner,
    fileCleanup,
  };
}

function filenameFromUrl(url) {
  if (!url) return null;
  return url.replace(/^\/uploads\//, "");
}
