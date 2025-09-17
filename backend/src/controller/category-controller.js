import { validate } from "../validation/validate.js";
import { categoryCreateSchema } from "../validation/category-schemas.js";
import { createCategory } from "../service/category-service.js";

export async function createCategoryHandler(req, res, next) {
  try {
    const data = validate(categoryCreateSchema, req.body);
    const category = await createCategory(data, req.user?.id || null);
    return res
      .status(201)
      .json({ data: category, message: "Category created" });
  } catch (err) {
    next(err);
  }
}

export default { createCategoryHandler };

export async function listCategoriesHandler(req, res, next) {
  try {
    const { page = "1", limit = "10", search } = req.query;
    const p = parseInt(page, 10) || 1;
    const l = Math.min(parseInt(limit, 10) || 10, 100);

    const service = await import("../service/category-service.js");
    const result = await service.listCategories({ page: p, limit: l, search });
    return res.json({ data: result.items, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryHandler(req, res, next) {
  try {
    const id = req.params.id;
    const { validate } = await import("../validation/validate.js");
    const { categoryUpdateSchema } = await import(
      "../validation/category-update-schemas.js"
    );
    const payload = validate(categoryUpdateSchema, req.body);
    const service = await import("../service/category-service.js");
    const updated = await service.updateCategory(
      id,
      payload,
      req.user?.id || null
    );
    return res.json({ data: updated, message: "Category updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategoryHandler(req, res, next) {
  try {
    const id = req.params.id;
    const service = await import("../service/category-service.js");
    await service.deleteCategory(id, req.user?.id || null);
    return res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getCategoryHandler(req, res, next) {
  try {
    const id = req.params.id;
    const { page = "1", limit = "10", search } = req.query;
    const p = parseInt(page, 10) || 1;
    const l = Math.min(parseInt(limit, 10) || 10, 100);

    const service = await import("../service/category-service.js");
    const result = await service.getCategoryById(id, {
      page: p,
      limit: l,
      search,
    });
    return res.json({
      data: result.category,
      products: result.products,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}
