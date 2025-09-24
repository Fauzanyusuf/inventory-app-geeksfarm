import { validate } from "../validation/validate.js";
import {
  productBulkCreateSchema,
  productIdParamSchema,
  productUpdateSchema,
  updateProductBatchValidation,
  addProductStockValidation,
} from "../validation/product-validation.js";
import { ResponseError } from "../utils/response-error.js";
import productService from "../service/product-service.js";
import { logger } from "../application/logging.js";
import { cleanupFilesOnError } from "../utils/image-utils.js";
import { paginationQuerySchema } from "../validation/query-validation.js";

export async function listProducts(req, res, next) {
  try {
    const { page, limit, search } = validate(paginationQuerySchema, req.query);

    const result = await productService.listProducts({ page, limit, search });

    return res.status(200).json({
      data: result.items,
      meta: result.meta,
      message: "Products retrieved",
    });
  } catch (err) {
    next(err);
  }
} // ✅

export async function getProductById(req, res, next) {
  try {
    const productId = validate(productIdParamSchema, req.params.id);

    const result = await productService.getProductById(productId);

    return res.status(200).json({
      data: result,
      message: "Product retrieved",
    });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const data = validate(productBulkCreateSchema, req.body);

    const isBulk = Array.isArray(data);

    let result;
    if (isBulk) {
      result = await productService.bulkCreateProducts(
        data,
        req.user?.sub || null,
        req.files || null
      );

      logger.info(
        `Bulk products created: ${result.length} products, total images: ${
          req.files?.length || 0
        }`
      );

      return res.status(201).json({
        data: result,
        message: `${result.length} products created successfully`,
      });
    } else {
      result = await productService.createProduct(
        data,
        req.user?.sub || null,
        req.files || null
      );

      logger.info(
        `Product created: ${result.product.id}, images: ${
          req.files?.length || 0
        }`
      );

      return res.status(201).json({
        data: result,
        message: "Product created successfully",
      });
    }
  } catch (err) {
    if (req.files && req.files.length > 0) {
      await cleanupFilesOnError(req.files, logger);
    }
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const productId = req.params.id;
    const data = validate(productUpdateSchema, req.body);
    const updated = await productService.updateProduct(
      productId,
      data,
      req.user?.sub || null
    );
    return res.status(200).json({ data: updated, message: "Product updated" });
  } catch (err) {
    next(err);
  }
}

export async function uploadProductImages(req, res, next) {
  try {
    const productId = req.params.id;
    if (!req.files || req.files.length === 0) {
      throw new ResponseError(400, "No files uploaded");
    }
    const result = await productService.addImagesToProduct(
      productId,
      req.files,
      req.user?.sub || null
    );

    return res.status(201).json({ data: result, message: "Images uploaded" });
  } catch (err) {
    if (req.files && req.files.length > 0) {
      await cleanupFilesOnError(req.files, logger);
    }
    next(err);
  }
}

export async function getProductImages(req, res, next) {
  try {
    const productId = validate(productIdParamSchema, req.params.id);

    const result = await productService.getProductImages(productId);

    return res.status(200).json({
      data: result,
      message: "Product images retrieved",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProductImages(req, res, next) {
  try {
    const productId = validate(productIdParamSchema, req.params.id);
    const { removeImageIds } = req.body;

    const result = await productService.updateProductImages(
      productId,
      req.files || [],
      removeImageIds || [],
      req.user?.sub || null
    );

    return res.status(200).json({
      data: result,
      message: "Product images updated",
    });
  } catch (err) {
    if (req.files && req.files.length > 0) {
      await cleanupFilesOnError(req.files, logger);
    }
    next(err);
  }
}

export async function deleteProductImage(req, res, next) {
  try {
    const { productId, imgId } = req.params;

    const result = await productService.deleteProductImage(
      productId,
      imgId,
      req.user?.sub || null
    );

    return res.status(200).json({
      data: result,
      message: "Product image deleted",
    });
  } catch (err) {
    next(err);
  }
}

export async function listProductBatchesByProduct(req, res, next) {
  try {
    const productId = req.params.id;
    const { page, limit, search } = validate(paginationQuerySchema, req.query);
    const sortByExpired = req.query.sortByExpired === "true";
    const result = await productService.listProductBatchesByProduct(productId, {
      page,
      limit,
      search,
      sortByExpired,
    });
    res.status(200).json({
      data: result.items,
      meta: result.meta,
      message: "Product batches retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProductBatch(req, res, next) {
  try {
    const { productId, batchId } = req.params;
    const data = validate(updateProductBatchValidation, req.body);
    const result = await productService.updateProductBatch(
      productId,
      batchId,
      data,
      req.user?.sub || null
    );
    res.status(200).json({
      data: result,
      message: "Product batch updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function addProductStock(req, res, next) {
  try {
    const productId = req.params.id;
    const data = validate(addProductStockValidation, req.body);
    const result = await productService.addProductStock(
      productId,
      data,
      req.user?.sub || null
    );
    res.status(201).json({
      data: result,
      message: "Stock added successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const productId = validate(productIdParamSchema, req.params.id);

    await productService.deleteProduct(productId, req.user?.sub || null);

    return res.status(204).json({
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}

export default {
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  getProductImages,
  updateProductImages,
  deleteProductImage,
  listProductBatchesByProduct,
  updateProductBatch,
  addProductStock,
};
