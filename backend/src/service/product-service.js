import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";

export async function createProductWithBatch(payload, userId = null) {
  const { product: p, initialBatch: b, movementNote } = payload;

  if (!p || !b) throw new ResponseError(400, "Missing product or initialBatch");

  const sellingPrice = p.sellingPrice ? BigInt(p.sellingPrice) : undefined;
  const costPrice = b.costPrice ? BigInt(b.costPrice) : undefined;

  try {
    // validate batch with zod if available
    try {
      const { validate } = await import("../validation/validate.js");
      const { productBatchCreateSchema } = await import(
        "../validation/batch-schemas.js"
      );
      // will throw ResponseError(400) if invalid
      validate(productBatchCreateSchema, b);
    } catch (e) {
      // if validate throws ResponseError, rethrow it
      if (e.name === "ResponseError" || e.statusCode) throw e;
      // otherwise ignore (in case validate isn't available)
    }
    // validate batch-ish fields lightly: quantity must be positive
    if (!Number.isFinite(b.quantity) || b.quantity <= 0) {
      throw new ResponseError(400, "Invalid batch quantity");
    }

    const result = await prisma.$transaction(async (tx) => {
      // If product exists by barcode, use existing product instead
      let product = null;
      if (p.barcode) {
        product = await tx.product.findUnique({
          where: { barcode: p.barcode },
        });
      }

      if (!product) {
        product = await tx.product.create({
          data: {
            name: p.name,
            barcode: p.barcode || undefined,
            description: p.description || undefined,
            unit: p.unit || undefined,
            sellingPrice: sellingPrice ?? BigInt(0),
            isPerishable: p.isPerishable ?? false,
            isActive: p.isActive ?? true,
            categoryId: p.categoryId || undefined,
          },
        });
      }

      const batch = await tx.productBatch.create({
        data: {
          productId: product.id,
          quantity: b.quantity,
          costPrice: costPrice ?? BigInt(0),
          status: b.status || "AVAILABLE",
          receivedAt: b.receivedAt ? new Date(b.receivedAt) : undefined,
          expiredAt: b.expiredAt ? new Date(b.expiredAt) : undefined,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          productBatchId: batch.id,
          quantity: b.quantity,
          movementType: "IN",
          note: movementNote || undefined,
        },
      });

      // create audit log
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Product",
          entityId: product.id,
          newValues: {
            product: product,
            batch: batch,
            movement: movement,
          },
          userId: userId || null,
        },
      });

      return { product, batch, movement };
    });

    return result;
  } catch (err) {
    if (err?.code === "P2002") {
      throw new ResponseError(409, "Duplicate value (likely barcode)");
    }
    throw err;
  }
}

export default { createProductWithBatch };

export async function getProductById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      batches: {
        include: {
          stockMovements: true,
        },
      },
    },
  });

  if (!product) throw new ResponseError(404, "Product not found");

  // compute total quantity (sum of non-deleted batches' quantities)
  const totalQuantity = await prisma.productBatch.aggregate({
    _sum: { quantity: true },
    where: { productId: id },
  });

  return { ...product, totalQuantity: totalQuantity._sum.quantity || 0 };
}

export async function addImageToProduct(productId, fileInfo, userId = null) {
  // fileInfo: { filename, originalname, mimetype, size, path }
  const imageUrl = `/uploads/${fileInfo.filename}`;
  // attempt to resize image (max width 1200) and create a thumbnail (200px)
  let thumbUrl = null;
  try {
    const sharp = await import("sharp");
    const inputPath = fileInfo.path;
    const ext = fileInfo.filename.includes(".")
      ? fileInfo.filename.split(".").pop()
      : "jpg";
    const baseName = fileInfo.filename.replace(/\.[^/.]+$/, "");

    // resize main image in-place (overwrite) to max width 1200 while keeping aspect
    const resizedBuffer = await sharp
      .default(inputPath)
      .resize({ width: 1200, withoutEnlargement: true })
      .toBuffer();
    await sharp.default(resizedBuffer).toFile(inputPath);

    // create thumbnail
    const thumbName = `${baseName}-thumb.${ext}`;
    const thumbPath = fileInfo.path.replace(fileInfo.filename, thumbName);
    await sharp.default(inputPath).resize(200).toFile(thumbPath);
    thumbUrl = `/uploads/${thumbName}`;
  } catch (err) {
    // sharp isn't available or failed — continue without resizing
    thumbUrl = null;
  }

  const result = await prisma.$transaction(async (tx) => {
    // create image and link to product via productId foreign key
    const image = await tx.image.create({
      data: {
        url: imageUrl,
        altText: fileInfo.originalname || null,
        productId: productId,
      },
    });

    // audit
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Image",
        entityId: image.id,
        newValues: image,
        userId: userId || null,
      },
    });

    return { image, thumbnailUrl: thumbUrl };
  });

  return result;
}

export async function listProducts({ page = 1, limit = 10, search } = {}) {
  const skip = (page - 1) * limit;
  const where = { isDeleted: false };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { images: true },
    }),
  ]);

  // compute total quantities for the listed products in a single query
  const productIds = items.map((i) => i.id);
  const sums = productIds.length
    ? await prisma.productBatch.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: { productId: { in: productIds } },
      })
    : [];

  const sumMap = new Map(sums.map((s) => [s.productId, s._sum.quantity || 0]));

  const itemsWithQuantity = items.map((it) => ({
    ...it,
    totalQuantity: sumMap.get(it.id) || 0,
  }));

  const pages = Math.ceil(total / limit) || 1;

  return {
    items: itemsWithQuantity,
    meta: { total, page, limit, pages },
  };
}

export async function updateProduct(id, payload, userId = null) {
  // allow partial updates for mutable fields
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ResponseError(404, "Product not found");

  const data = {};
  if (typeof payload.name !== "undefined") data.name = payload.name;
  if (typeof payload.description !== "undefined")
    data.description = payload.description;
  if (typeof payload.unit !== "undefined") data.unit = payload.unit;
  if (typeof payload.isPerishable !== "undefined")
    data.isPerishable = payload.isPerishable;
  if (typeof payload.isActive !== "undefined") data.isActive = payload.isActive;
  if (typeof payload.categoryId !== "undefined")
    data.categoryId = payload.categoryId;
  if (typeof payload.sellingPrice !== "undefined")
    data.sellingPrice = BigInt(payload.sellingPrice);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({ where: { id }, data });

    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Product",
        entityId: id,
        oldValues: existing,
        newValues: updated,
        userId: userId || null,
      },
    });

    return updated;
  });

  return result;
}

export async function deleteProduct(id, userId = null) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ResponseError(404, "Product not found");

  const result = await prisma.$transaction(async (tx) => {
    // soft delete: set isDeleted = true
    const deleted = await tx.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Product",
        entityId: id,
        oldValues: existing,
        newValues: deleted,
        userId: userId || null,
      },
    });

    return deleted;
  });

  return result;
}
