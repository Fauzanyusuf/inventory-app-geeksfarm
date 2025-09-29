import { validate } from "../validation/validate.js";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from "../validation/category-validation.js";
import categoryService from "../service/category-service.js";
import {
  cleanupFilesOnError,
  validateImageFile,
} from "../utils/image-utils.js";
import { paginationQuerySchema } from "../validation/query-validation.js";

async function createCategory(req, res, next) {
  try {
    const data = validate(categoryCreateSchema, req.body);

    let file = null;
    if (req.file) {
      file = validateImageFile(req.file);
    }

    const result = await categoryService.createCategory(
      data,
      file || null,
      req.user?.sub || null
    );

    return res.status(201).json({
      data: { ...result.category, image: result.image },
      message: "Category created successfully",
    });
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const { page, limit, search } = validate(paginationQuerySchema, req.query);

    const result = await categoryService.listCategories({
      page,
      limit,
      search,
    });

    return res.status(200).json({
      data: result.data,
      meta: result.meta,
      message: "Categories retrieved",
    });
  } catch (err) {
    next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const id = req.params.id;
    const category = await categoryService.getCategoryById(id);
    return res.status(200).json({
      data: category,
      message: "Category retrieved",
    });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const id = req.params.id;
    const data = validate(categoryUpdateSchema, req.body);
    const result = await categoryService.updateCategory(
      id,
      data,
      req.user?.sub || null
    );

    if (req.file) {
      await cleanupFilesOnError([req.file]);
    }

    return res.status(200).json({
      data: result,
      message: "Category updated",
    });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = req.params.id;
    await categoryService.deleteCategory(id, req.user?.sub || null);
    return res.status(204).json({
      message: "Category deleted",
    });
  } catch (err) {
    next(err);
  }
}

async function uploadCategoryImage(req, res, next) {
  try {
    const id = req.params.id;
    const file = validateImageFile(req.file);

    const result = await categoryService.uploadCategoryImage(
      id,
      file,
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

async function getCategoryImage(req, res, next) {
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

async function deleteCategoryImage(req, res, next) {
  try {
    const categoryId = req.params.id;

    await categoryService.deleteCategoryImage(
      categoryId,
      req.user?.sub || null
    );

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
