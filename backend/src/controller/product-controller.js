import { validate } from "../validation/validate.js";
import {
  productCreateSchema,
  productUpdateSchema,
} from "../validation/product-validations.js";
import * as productService from "../service/product-service.js";
import { parsePagination } from "../utils/request-utils.js";

export async function createProduct(req, res, next) {
  try {
    const data = validate(productCreateSchema, req.body);
    const result = await productService.createProductWithBatch(
      data,
      req.user?.id || null
    );
    return res.status(201).json({ data: result, message: "Product created" });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const id = req.params.id;
    const product = await productService.getProductById(id);
    return res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function listProducts(req, res, next) {
  try {
    const { page, limit, search } = parsePagination(req.query);
    const result = await productService.listProducts({ page, limit, search });
    return res.json({ data: result.items, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const id = req.params.id;
    const payload = validate(productUpdateSchema, req.body);
    const updated = await productService.updateProduct(
      id,
      payload,
      req.user?.id || null
    );
    return res.json({ data: updated, message: "Product updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const id = req.params.id;
    await productService.deleteProduct(id, req.user?.id || null);
    return res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
}

export async function uploadProductImage(req, res, next) {
  try {
    const productId = req.params.id;
    if (!req.file) return res.status(400).json({ errors: "No file uploaded" });
    const result = await productService.addImageToProduct(
      productId,
      req.file,
      req.user?.id || null
    );

    // include thumbnail url if available
    return res.status(201).json({ data: result, message: "Image uploaded" });
  } catch (err) {
    next(err);
  }
}
