import { validate } from "../validation/validate.js";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from "../validation/category-validations.js";
import * as categoryService from "../service/category-service.js";
import { parsePagination } from "../utils/request-utils.js";

export async function createCategoryHandler(req, res, next) {
  try {
    const data = validate(categoryCreateSchema, req.body);
    const category = await categoryService.createCategory(
      data,
      req.user?.id || null
    );
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
    const { page, limit, search } = parsePagination(req.query);
    const result = await categoryService.listCategories({
      page,
      limit,
      search,
    });
    return res.json({ data: result.items, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryHandler(req, res, next) {
  try {
    const id = req.params.id;
    const payload = validate(categoryUpdateSchema, req.body);
    const updated = await categoryService.updateCategory(
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
    await categoryService.deleteCategory(id, req.user?.id || null);
    return res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getCategoryHandler(req, res, next) {
  try {
    const id = req.params.id;
    const { page, limit, search } = parsePagination(req.query);
    const result = await categoryService.getCategoryById(id, {
      page,
      limit,
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
