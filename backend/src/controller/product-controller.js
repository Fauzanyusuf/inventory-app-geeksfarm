import { validate } from "../validation/validate.js";
import { productCreateSchema } from "../validation/product-schemas.js";
import { createProductWithBatch } from "../service/product-service.js";

export async function createProduct(req, res, next) {
  try {
    const data = validate(productCreateSchema, req.body);
    const result = await createProductWithBatch(data, req.user?.id || null);
    return res.status(201).json({ data: result, message: "Product created" });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const id = req.params.id;
    const product = await (
      await import("../service/product-service.js")
    ).getProductById(id);
    return res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function listProducts(req, res, next) {
  try {
    const { page = "1", limit = "10", search } = req.query;
    const p = parseInt(page, 10) || 1;
    const l = Math.min(parseInt(limit, 10) || 10, 100);

    const service = await import("../service/product-service.js");
    const result = await service.listProducts({ page: p, limit: l, search });
    return res.json({ data: result.items, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const id = req.params.id;
    const payload = req.body;
    const service = await import("../service/product-service.js");
    const updated = await service.updateProduct(
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
    const service = await import("../service/product-service.js");
    await service.deleteProduct(id, req.user?.id || null);
    return res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
}

export async function uploadProductImage(req, res, next) {
  try {
    const productId = req.params.id;
    if (!req.file) return res.status(400).json({ errors: "No file uploaded" });

    const service = await import("../service/product-service.js");
    const result = await service.addImageToProduct(
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

export default { createProduct };
