import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";
import { logger } from "../application/logging.js";
import { processAndCreateImages, deleteImage } from "./image-service.js";
import { deleteFile } from "../utils/image-utils.js";
import { createAuditLog } from "../utils/audit-utils.js";

function getBatchStatus(expiredAt, quantity) {
  const now = new Date();
  return expiredAt && expiredAt <= now
    ? "EXPIRED"
    : quantity <= 0
    ? "SOLD_OUT"
    : "AVAILABLE";
}

async function createProductWithBatch(
  tx,
  productData,
  batchData,
  movementNote,
  userId
) {
  const product = await tx.product.create({
    data: productData,
  });

  const batchStatus = getBatchStatus(batchData.expiredAt, batchData.quantity);

  const batch = await tx.productBatch.create({
    data: {
      productId: product.id,
      quantity: batchData.quantity,
      costPrice: batchData.costPrice,
      status: batchStatus,
      receivedAt: batchData.receivedAt,
      expiredAt: batchData.expiredAt,
    },
  });

  const movement = await tx.stockMovement.create({
    data: {
      productId: product.id,
      productBatchId: batch.id,
      quantity: batchData.quantity,
      movementType: "IN",
      note:
        movementNote ||
        `Initial stock: ${batchData.quantity} units for new product: ${product.name}`,
    },
  });

  await createAuditLog(tx, {
    action: "CREATE",
    entity: "Product",
    entityId: product.id,
    newValues: { product, batch, movement },
    userId,
  });

  return { product, batch, movement };
}

function distributeFilesEvenly(files, numProducts) {
  if (!files || files.length === 0) return Array(numProducts).fill([]);

  const result = [];
  const baseCount = Math.floor(files.length / numProducts);
  const remainder = files.length % numProducts;

  let fileIndex = 0;
  for (let i = 0; i < numProducts; i++) {
    const count = baseCount + (i < remainder ? 1 : 0);
    result.push(files.slice(fileIndex, fileIndex + count));
    fileIndex += count;
  }

  return result;
}

async function createSingleProduct(
  tx,
  productData,
  batchData,
  movementNote,
  productFiles,
  userId
) {
  const { product, batch, movement } = await createProductWithBatch(
    tx,
    productData,
    batchData,
    movementNote,
    userId
  );

  let imagesResult = null;
  if (productFiles && productFiles.length > 0) {
    imagesResult = await processAndCreateImages(
      productFiles,
      userId,
      { productId: product.id },
      tx
    );

    // Additional audit log for images
    if (imagesResult) {
      await createAuditLog(tx, {
        action: "UPDATE",
        entity: "Product",
        entityId: product.id,
        newValues: { images: imagesResult },
        userId,
      });
    }
  }

  return { product, batch, movement, images: imagesResult };
}

export async function listProducts({ page = 1, limit = 10, search } = {}) {
  try {
    const skip = (page - 1) * limit;
    const where = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          unit: true,
          sellingPrice: true,
          category: { select: { id: true, name: true } },
          images: {
            select: { id: true, url: true, thumbnailUrl: true },
          },
          batches: {
            select: { quantity: true },
            where: { status: { not: "EXPIRED" } },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithQuantity = products.map((product) => {
      const totalQuantity = product.batches.reduce(
        (sum, batch) => sum + batch.quantity,
        0
      );

      // eslint-disable-next-line no-unused-vars
      const { batches, ...rest } = product;
      return { ...rest, totalQuantity };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    logger.info(`Listed products: page ${page}, total ${total}`);

    return {
      items: productsWithQuantity,
      meta: { total, page, limit, totalPages },
    };
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(`Error listing products: ${err.message}`);
    throw new ResponseError(500, "Failed to get product: Server error");
  }
}

export async function getProductById(productId) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
      select: {
        id: true,
        name: true,
        barcode: true,
        description: true,
        unit: true,
        sellingPrice: true,
        isPerishable: true,
        isActive: true,
        category: {
          select: { id: true, name: true },
        },
        images: {
          select: { id: true, url: true, thumbnailUrl: true },
        },
        batches: {
          where: {
            status: { not: "EXPIRED" },
          },
          select: {
            id: true,
            quantity: true,
            status: true,
            expiredAt: true,
          },
        },
      },
    });

    if (!product) throw new ResponseError(404, "Product not found");

    const totalQuantity = product.batches.reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );

    logger.info(`Retrieved product: ${productId}`);
    return { ...product, totalQuantity };
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(`Error getting product ${productId}: ${err.message}`);
    throw new ResponseError(500, `Failed to get product: ${err.message}`);
  }
}

export async function createProduct(data, userId = null, files = null) {
  const {
    quantity,
    costPrice,
    receivedAt,
    expiredAt,
    movementNote,
    ...productData
  } = data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingProduct = await tx.product.findUnique({
        where: { barcode: productData.barcode },
      });
      if (existingProduct) throw new ResponseError(409, "Duplicate barcode");

      return await createProductWithBatch(
        tx,
        {
          name: productData.name,
          barcode: productData.barcode,
          description: productData.description,
          unit: productData.unit,
          sellingPrice: productData.sellingPrice,
          isPerishable: productData.isPerishable,
          categoryId: productData.categoryId,
        },
        {
          quantity,
          costPrice,
          receivedAt,
          expiredAt,
        },
        movementNote,
        userId
      );
    });

    let imagesResult = null;
    if (files && files.length > 0) {
      imagesResult = await addImagesToProduct(result.product.id, files, userId);
    }

    logger.info(
      `Product created: ${result.product.id}, batch: ${
        result.batch.id
      }, images: ${files?.length || 0}`
    );
    return { ...result, images: imagesResult };
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2002")
      throw new ResponseError(409, "Duplicate value (likely barcode)");
    logger.error(`Error creating product: ${err.message}`);
    throw new ResponseError(500, `Failed to create product: ${err.message}`);
  }
}

export async function addImagesToProduct(productId, filesInfo, userId = null) {
  if (!Array.isArray(filesInfo) || filesInfo.length === 0) {
    throw new ResponseError(400, "No files provided");
  }

  try {
    const productCheck = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isDeleted: true },
    });

    if (!productCheck) {
      await Promise.all(filesInfo.map((file) => deleteFile(file.filename)));
      throw new ResponseError(404, "Product not found");
    }

    if (productCheck.isDeleted) {
      await Promise.all(filesInfo.map((file) => deleteFile(file.filename)));
      throw new ResponseError(410, "Cannot upload images to deleted product");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
      include: { images: true },
    });
    if (!product) throw new ResponseError(404, "Product not found");

    const results = await processAndCreateImages(filesInfo, userId, {
      productId,
    });

    await createAuditLog(prisma, {
      action: "UPDATE",
      entity: "Product",
      entityId: productId,
      oldValues: { imageCount: product.images?.length || 0 },
      newValues: {
        imageCount: (product.images?.length || 0) + results.length,
        newImages: results.map((r) => ({
          id: r.image.id,
          url: r.image.url,
          thumbnailUrl: r.image.thumbnailUrl,
        })),
      },
      userId,
    });

    logger.info(`Added ${results.length} images to product: ${productId}`);
    return results;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(`Error adding images to product ${productId}: ${err.message}`);
    throw new ResponseError(500, "Images upload failed: Server error");
  }
}

export async function getProductImages(productId) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new ResponseError(404, "Product not found");
    }

    const images = await prisma.image.findMany({
      where: { productId },
      omit: { productId: true },
      orderBy: { createdAt: "asc" },
    });

    logger.info(`Retrieved ${images.length} images for product: ${productId}`);
    return images;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(
      `Error getting images for product ${productId}: ${err.message}`
    );
    throw new ResponseError(
      500,
      `Failed to get product images: ${err.message}`
    );
  }
}

export async function updateProductImages(
  productId,
  newFiles,
  removeImageIds,
  userId = null
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new ResponseError(404, "Product not found");
    }

    const results = { added: [], removed: [] };

    if (removeImageIds && removeImageIds.length > 0) {
      for (const imageId of removeImageIds) {
        try {
          const removedImage = await deleteProductImage(
            productId,
            imageId,
            userId
          );
          results.removed.push(removedImage);
        } catch (err) {
          logger.warn(`Failed to remove image ${imageId}: ${err.message}`);
        }
      }
    }

    if (newFiles && newFiles.length > 0) {
      const addedImages = await addImagesToProduct(productId, newFiles, userId);
      results.added = addedImages;
    }

    logger.info(
      `Updated images for product ${productId}: added ${results.added.length}, removed ${results.removed.length}`
    );
    return results;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(
      `Error updating images for product ${productId}: ${err.message}`
    );
    throw new ResponseError(
      500,
      "Failed to update product images: Server error"
    );
  }
}

export async function deleteProductImage(productId, imageId, userId = null) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new ResponseError(404, "Product not found");
    }

    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image || image.productId !== productId) {
      throw new ResponseError(404, "Image not found for this product");
    }

    const result = await deleteImage(imageId, userId);

    logger.info(`Deleted image ${imageId} from product: ${productId}`);
    return result.image;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(
      `Error deleting image ${imageId} from product ${productId}: ${err.message}`
    );
    throw new ResponseError(
      500,
      "Failed to delete product image: Server error"
    );
  }
}

export async function bulkCreateProducts(
  productsData,
  userId = null,
  files = null
) {
  if (!Array.isArray(productsData) || productsData.length === 0) {
    throw new ResponseError(400, "Products data must be a non-empty array");
  }

  try {
    const results = await prisma.$transaction(async (tx) => {
      const barcodes = productsData.map((p) => p.barcode).filter(Boolean);

      if (barcodes.length > 0) {
        const existingProducts = await tx.product.findMany({
          where: { barcode: { in: barcodes } },
          select: { barcode: true },
        });

        if (existingProducts.length > 0) {
          const duplicateBarcodes = existingProducts.map((p) => p.barcode);
          throw new ResponseError(
            409,
            `Duplicate barcodes found: ${duplicateBarcodes.join(", ")}`
          );
        }
      }

      const createdProducts = [];

      const distributedFiles = files
        ? distributeFilesEvenly(files, productsData.length)
        : [];

      for (let i = 0; i < productsData.length; i++) {
        const data = productsData[i];
        const {
          quantity,
          costPrice,
          receivedAt,
          expiredAt,
          movementNote,
          ...productData
        } = data;

        const result = await createSingleProduct(
          tx,
          {
            name: productData.name,
            barcode: productData.barcode,
            description: productData.description,
            unit: productData.unit,
            sellingPrice: productData.sellingPrice,
            isPerishable: productData.isPerishable,
            categoryId: productData.categoryId,
          },
          {
            quantity,
            costPrice,
            receivedAt,
            expiredAt,
          },
          movementNote,
          distributedFiles[i],
          userId
        );

        createdProducts.push(result);
      }

      return createdProducts;
    });

    logger.info(
      `Bulk products created: ${results.length} products, total images: ${
        files?.length || 0
      }`
    );
    return results;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(`Error bulk creating products: ${err.message}`);
    throw new ResponseError(500, `Failed to create products: ${err.message}`);
  }
}

export async function updateProduct(id, data, userId = null) {
  try {
    const existing = await prisma.product.findUnique({
      where: { id, isDeleted: false },
    });
    if (!existing) throw new ResponseError(404, "Product not found");

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id }, data });

      await createAuditLog(tx, {
        action: "UPDATE",
        entity: "Product",
        entityId: id,
        oldValues: existing,
        newValues: updated,
        userId,
      });

      return updated;
    });

    logger.info(`Updated product: ${id}`);
    return result;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2025") throw new ResponseError(404, "Product not found");
    logger.error(`Error updating product ${id}: ${err.message}`);
    throw new ResponseError(500, `Failed to update product: ${err.message}`);
  }
}

export async function deleteProduct(id, userId = null) {
  try {
    const existing = await prisma.product.findUnique({
      where: { id, isDeleted: false },
    });
    if (!existing) throw new ResponseError(404, "Product not found");

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.product.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      await createAuditLog(tx, {
        action: "DELETE",
        entity: "Product",
        entityId: id,
        oldValues: existing,
        newValues: deleted,
        userId,
      });

      return deleted;
    });

    logger.info(`Soft deleted product: ${id}`);
    return result;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2025") throw new ResponseError(404, "Product not found");
    logger.error(`Error deleting product ${id}: ${err.message}`);
    throw new ResponseError(500, `Failed to delete product: ${err.message}`);
  }
}

export async function listProductBatchesByProduct(
  productId,
  { page = 1, limit = 10, sortByExpired = true } = {}
) {
  try {
    const skip = (page - 1) * limit;
    const where = { productId };

    const orderBy = sortByExpired
      ? { expiredAt: "asc" }
      : { createdAt: "desc" };

    const [total, items] = await Promise.all([
      prisma.productBatch.count({ where }),
      prisma.productBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        omit: {
          productId: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    logger.info(
      `Listed batches for product: ${productId}, page ${page}, total ${total}`
    );

    return {
      items,
      meta: { total, page, limit, totalPages },
    };
  } catch (err) {
    logger.error(
      `Error listing batches for product ${productId}: ${err.message}`
    );
    throw new ResponseError(
      500,
      `Failed to list product batches: ${err.message}`
    );
  }
}

export async function updateProductBatch(
  productId,
  batchId,
  data,
  userId = null
) {
  try {
    const batch = await prisma.productBatch.findFirst({
      where: { id: batchId, productId },
    });
    if (!batch) throw new ResponseError(404, "Product batch not found");

    const oldValues = { ...batch };

    const updated = await prisma.$transaction(async (tx) => {
      const updateData = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
      if (data.receivedAt !== undefined)
        updateData.receivedAt = data.receivedAt;
      if (data.expiredAt !== undefined) updateData.expiredAt = data.expiredAt;

      const result = await tx.productBatch.update({
        where: { id: batchId },
        data: updateData,
        omit: { productId: true },
      });

      if (data.quantity !== undefined && data.quantity !== batch.quantity) {
        const quantityDiff = data.quantity - batch.quantity;
        const movementType = "ADJUSTMENT";

        await tx.stockMovement.create({
          data: {
            productId,
            productBatchId: batchId,
            quantity: Math.abs(quantityDiff),
            movementType,
            note:
              data.notes ||
              `Batch updated: quantity changed from ${batch.quantity} to ${data.quantity}`,
          },
        });
      }

      await createAuditLog(tx, {
        action: "UPDATE",
        entity: "ProductBatch",
        entityId: batchId,
        oldValues,
        newValues: result,
        userId,
      });

      return result;
    });

    logger.info(`Updated product batch: ${batchId} for product: ${productId}`);
    return updated;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2025")
      throw new ResponseError(404, "Product batch not found");
    logger.error(`Error updating product batch ${batchId}: ${err.message}`);
    throw new ResponseError(
      500,
      `Failed to update product batch: ${err.message}`
    );
  }
}

export async function addProductStock(productId, data, userId = null) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
    });
    if (!product) throw new ResponseError(404, "Product not found");

    const batchStatus = getBatchStatus(data.expiredAt, data.quantity);

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.productBatch.create({
        data: {
          productId,
          quantity: data.quantity,
          costPrice: data.costPrice,
          status: batchStatus,
          receivedAt: data.receivedAt,
          expiredAt: data.expiredAt,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          productBatchId: batch.id,
          quantity: data.quantity,
          movementType: "IN",
          note: data.note || `Stock added: ${data.quantity} units`,
        },
      });

      await createAuditLog(tx, {
        action: "CREATE",
        entity: "ProductBatch",
        entityId: batch.id,
        newValues: { batch, movement },
        userId,
      });

      return { batch, movement };
    });

    logger.info(
      `Added stock to product: ${productId}, batch: ${result.batch.id}`
    );
    return result;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2002")
      throw new ResponseError(409, "Duplicate batch data");
    logger.error(`Error adding stock to product ${productId}: ${err.message}`);
    throw new ResponseError(500, "Failed to add product stock: Server error");
  }
}

export default {
  listProducts,
  getProductById,
  createProduct,
  addImagesToProduct,
  getProductImages,
  updateProductImages,
  deleteProductImage,
  updateProduct,
  deleteProduct,
  listProductBatchesByProduct,
  updateProductBatch,
  addProductStock,
  bulkCreateProducts,
};
