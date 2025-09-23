import { validate } from "../validation/validate.js";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from "../validation/category-validation.js";
import { ResponseError } from "../utils/response-error.js";
import categoryService from "../service/category-service.js";
import { logger } from "../application/logging.js";
import { cleanupFilesOnError } from "../utils/image-utils.js";
import { paginationQuerySchema } from "../validation/query-validation.js";

export async function createCategory(req, res, next) {
  try {
    const data = validate(categoryCreateSchema, req.body);

    const result = await categoryService.create(
      data,
      req.user?.sub || null,
      req.file || null
    );

    logger.info(
      `Category created: ${result.category.id}, image: ${
        req.file ? "yes" : "no"
      }`
    );

    return res.status(201).json({
      data: result,
      message: "Category created successfully",
    });
  } catch (err) {
    if (req.file) {
      await cleanupFilesOnError([req.file], logger);
    }
    next(err);
  }
}

export async function listCategories(req, res, next) {
  try {
    const { page, limit, search } = validate(paginationQuerySchema, req.query);

    const result = await categoryService.list({ page, limit, search });

    return res.status(200).json({
      data: result.data,
      meta: result.meta,
      message: "Categories retrieved",
    });
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req, res, next) {
  try {
    const id = req.params.id;
    const category = await categoryService.getById(id);
    return res.status(200).json({
      data: category,
      message: "Category retrieved",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const id = req.params.id;
    const data = validate(categoryUpdateSchema, req.body);
    const result = await categoryService.update(id, data, req.user?.sub || null);
    return res.status(200).json({
      data: result,
      message: "Category updated",
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const id = req.params.id;
    await categoryService.remove(id, req.user?.sub || null);
    return res.status(204).json({
      message: "Category deleted",
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadCategoryImage(req, res, next) {
  try {
    const id = req.params.id;
    if (!req.file) {
      throw new ResponseError(400, "No file uploaded");
    }
    const result = await categoryService.uploadImage(
      id,
      req.file,
      req.user?.sub || null
    );
    return res.status(201).json({
      data: result,
      message: "Image uploaded",
    });
  } catch (err) {
    next(err);
  }
}

export async function getCategoryImage(req, res, next) {
  try {
    const categoryId = req.params.id;

    const result = await categoryService.getCategoryImage(categoryId);

    return res.status(200).json({
      data: result,
      message: "Category image retrieved",
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategoryImage(req, res, next) {
  try {
    const categoryId = req.params.id;

    await categoryService.deleteCategoryImage(categoryId, req.user?.sub || null);

    return res.status(200).json({
      message: "Category image deleted",
    });
  } catch (err) {
    next(err);
  }
}

export default {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  getCategoryImage,
  deleteCategoryImage,
};
