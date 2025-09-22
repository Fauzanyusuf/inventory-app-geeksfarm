import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";
import { logger } from "../application/logging.js";
import { processAndCreateImages } from "./image-service.js";

function safeBigInt(value, fieldName) {
  try {
    return BigInt(value);
  } catch {
    throw new ResponseError(400, `${fieldName} must be a valid number`);
  }
}

function getBatchStatus(expiredAt, quantity) {
  const now = new Date();
  if (expiredAt && expiredAt <= now) return "EXPIRED";
  if (quantity <= 0) return "SOLD_OUT";
  return "AVAILABLE";
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

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          barcode: true,
          description: true,
          unit: true,
          sellingPrice: true,
          isPerishable: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          categoryId: true,
          images: {
            select: { id: true, url: true, thumbnailUrl: true, altText: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Optimize quantity calculation - use single aggregate query instead of groupBy
    const productIds = items.map(item => item.id);

    // Since we can't group by productId in aggregate, we need to calculate per product
    // But this is still better than N queries
    const quantityMap = new Map();
    if (productIds.length > 0) {
      const allQuantities = await prisma.productBatch.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: {
          productId: { in: productIds },
          status: { not: "EXPIRED" }
        },
      });
      allQuantities.forEach(q => {
        quantityMap.set(q.productId, q._sum.quantity || 0);
      });
    }

    const itemsWithQuantity = items.map((item) => ({
      ...item,
      totalQuantity: quantityMap.get(item.id) || 0,
    }));

    const pages = Math.ceil(total / limit) || 1;

    logger.info(`Listed products: page ${page}, total ${total}`);

    return {
      items: itemsWithQuantity,
      meta: { total, page, limit, pages },
    };
  } catch (err) {
    logger.error(`Error listing products: ${err.message}`);
    throw new ResponseError(500, `Failed to list products: ${err.message}`);
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
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        category: {
          select: { id: true, name: true }
        },
        images: {
          select: { id: true, url: true, thumbnailUrl: true, altText: true }
        },
        // Hindari include batches dan movements untuk mencegah overfetching
        // Gunakan query terpisah jika diperlukan dengan pagination
      },
    });

    if (!product) throw new ResponseError(404, "Product not found");

    const totalQuantity = await prisma.productBatch.aggregate({
      _sum: { quantity: true },
      where: { productId, status: { not: "EXPIRED" } },
    });

    logger.info(`Retrieved product: ${productId}`);
    return { ...product, totalQuantity: totalQuantity._sum.quantity || 0 };
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
      // Check for duplicate barcode inside transaction to prevent race condition
      const existingProduct = await tx.product.findUnique({
        where: { barcode: productData.barcode },
      });
      if (existingProduct) throw new ResponseError(409, "Duplicate barcode");

      const product = await tx.product.create({
        data: {
          name: productData.name,
          barcode: productData.barcode,
          description: productData.description,
          unit: productData.unit,
          sellingPrice: safeBigInt(productData.sellingPrice, "Selling price"),
          isPerishable: productData.isPerishable,
          categoryId: productData.categoryId,
        },
      });

      const batchStatus = getBatchStatus(expiredAt, quantity);

      const batch = await tx.productBatch.create({
        data: {
          productId: product.id,
          quantity,
          costPrice: safeBigInt(costPrice, "Cost price"),
          status: batchStatus,
          receivedAt,
          expiredAt,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          productBatchId: batch.id,
          quantity,
          movementType: "IN",
          note:
            movementNote ||
            `Initial stock: ${quantity} units for new product: ${product.name}`,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Product",
          entityId: product.id,
          newValues: { product, batch, movement },
          userId,
        },
      });

      return { product, batch, movement };
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
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
      include: { images: true },
    });
    if (!product) throw new ResponseError(404, "Product not found");

    const results = await processAndCreateImages(filesInfo, userId, {
      productId,
    });

    await prisma.auditLog.create({
      data: {
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
      },
    });

    logger.info(`Added ${results.length} images to product: ${productId}`);
    return results;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    logger.error(`Error adding images to product ${productId}: ${err.message}`);
    throw new ResponseError(500, `Images upload failed: ${err.message}`);
  }
}

export async function bulkCreateProducts(productsData, userId = null, files = null) {
  if (!Array.isArray(productsData) || productsData.length === 0) {
    throw new ResponseError(400, "Products data must be a non-empty array");
  }

  try {
    const results = await prisma.$transaction(async (tx) => {
      // Check for duplicate barcodes inside transaction to prevent race condition
      const barcodes = productsData.map(p => p.barcode).filter(Boolean);
      if (barcodes.length > 0) {
        const existingProducts = await tx.product.findMany({
          where: { barcode: { in: barcodes } },
          select: { barcode: true },
        });
        if (existingProducts.length > 0) {
          const duplicateBarcodes = existingProducts.map(p => p.barcode);
          throw new ResponseError(409, `Duplicate barcodes found: ${duplicateBarcodes.join(', ')}`);
        }
      }

      const createdProducts = [];

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

        const product = await tx.product.create({
          data: {
            name: productData.name,
            barcode: productData.barcode,
            description: productData.description,
            unit: productData.unit,
            sellingPrice: safeBigInt(productData.sellingPrice, "Selling price"),
            isPerishable: productData.isPerishable,
            categoryId: productData.categoryId,
          },
        });

        const batchStatus = getBatchStatus(expiredAt, quantity);

        const batch = await tx.productBatch.create({
          data: {
            productId: product.id,
            quantity,
            costPrice: safeBigInt(costPrice, "Cost price"),
            status: batchStatus,
            receivedAt,
            expiredAt,
          },
        });

        const movement = await tx.stockMovement.create({
          data: {
            productId: product.id,
            productBatchId: batch.id,
            quantity,
            movementType: "IN",
            note:
              movementNote ||
              `Initial stock: ${quantity} units for new product: ${product.name}`,
          },
        });

        // Handle images for this product
        let imagesResult = null;
        if (files && files.length > 0) {
          // Calculate images for this product on-demand
          const imagesPerProduct = Math.floor(files.length / productsData.length);
          const remainder = files.length % productsData.length;
          const extraImage = i < remainder ? 1 : 0;
          const startIndex = i * imagesPerProduct + Math.min(i, remainder);
          const endIndex = startIndex + imagesPerProduct + extraImage;
          const productFiles = files.slice(startIndex, endIndex);

          if (productFiles.length > 0) {
            imagesResult = await processAndCreateImages(productFiles, userId, {
              productId: product.id,
            }, tx); // Pass transaction
          }
        }

        await tx.auditLog.create({
          data: {
            action: "CREATE",
            entity: "Product",
            entityId: product.id,
            newValues: { product, batch, movement, images: imagesResult },
            userId,
          },
        });

        createdProducts.push({ product, batch, movement, images: imagesResult });
      }

      return createdProducts;
    });

    logger.info(
      `Bulk products created: ${results.length} products, total images: ${files?.length || 0}`
    );
    return results;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2002")
      throw new ResponseError(409, "Duplicate value (likely barcode)");
    logger.error(`Error bulk creating products: ${err.message}`);
    throw new ResponseError(500, `Failed to create products: ${err.message}`);
  }
}

export async function updateProduct(id, payload, userId = null) {
  try {
    const existing = await prisma.product.findUnique({
      where: { id, isDeleted: false },
    });
    if (!existing) throw new ResponseError(404, "Product not found");

    const data = {};
    const allowedFields = [
      "name",
      "description",
      "unit",
      "isPerishable",
      "isActive",
      "categoryId",
      "sellingPrice",
    ];
    allowedFields.forEach((field) => {
      if (payload[field] !== undefined) {
        data[field] =
          field === "sellingPrice" ? BigInt(payload[field]) : payload[field];
      }
    });

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id }, data });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Product",
          entityId: id,
          oldValues: existing,
          newValues: updated,
          userId,
        },
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

      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entity: "Product",
          entityId: id,
          oldValues: existing,
          newValues: deleted,
          userId,
        },
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

      }),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    logger.info(
      `Listed batches for product: ${productId}, page ${page}, total ${total}`
    );

    return {
      items,
      meta: { total, page, limit, pages },
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
    // Validasi batch milik product
    const batch = await prisma.productBatch.findFirst({
      where: { id: batchId, productId },
    });
    if (!batch) throw new ResponseError(404, "Product batch not found");

    const oldValues = { ...batch };

    const updated = await prisma.$transaction(async (tx) => {
      const updateData = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.costPrice !== undefined)
        updateData.costPrice = safeBigInt(data.costPrice, "Cost price");
      if (data.receivedAt !== undefined)
        updateData.receivedAt = data.receivedAt;
      if (data.expiredAt !== undefined) updateData.expiredAt = data.expiredAt;

      const result = await tx.productBatch.update({
        where: { id: batchId },
        data: updateData,
      });

      // Jika quantity berubah, buat stock movement dengan type ADJUSTMENT
      if (data.quantity !== undefined && data.quantity !== batch.quantity) {
        const quantityDiff = data.quantity - batch.quantity;
        const movementType = "ADJUSTMENT"; // Selalu ADJUSTMENT untuk tracking

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
      
      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "ProductBatch",
          entityId: batchId,
          oldValues,
          newValues: result,
          userId,
        },
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
    // Validasi product ada
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
    });
    if (!product) throw new ResponseError(404, "Product not found");

    const batchStatus = getBatchStatus(data.expiredAt, data.quantity);

    const result = await prisma.$transaction(async (tx) => {
      // Create batch baru
      const batch = await tx.productBatch.create({
        data: {
          productId,
          quantity: data.quantity,
          costPrice: safeBigInt(data.costPrice, "Cost price"),
          status: batchStatus,
          receivedAt: data.receivedAt,
          expiredAt: data.expiredAt,
        },
      });

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          productBatchId: batch.id,
          quantity: data.quantity,
          movementType: "IN",
          note: data.note || `Stock added: ${data.quantity} units`,
          userId,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "ProductBatch",
          entityId: batch.id,
          newValues: { batch, movement },
          userId,
        },
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
    throw new ResponseError(500, `Failed to add product stock: ${err.message}`);
  }
}

export default {
  listProducts,
  getProductById,
  createProduct,
  addImagesToProduct,
  updateProduct,
  deleteProduct,
  listProductBatchesByProduct,
  updateProductBatch,
  addProductStock,
  bulkCreateProducts,
};
