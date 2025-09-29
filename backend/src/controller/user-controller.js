import { ResponseError } from "../utils/response-error.js";
import userService from "../service/user-service.js";
import { validate } from "../validation/validate.js";
import {
  approveUserValidation,
  updateUserSchema,
} from "../validation/user-validation.js";
import { paginationQuerySchema } from "../validation/query-validation.js";

async function listUsers(req, res, next) {
  try {
    const { page, limit, search } = validate(paginationQuerySchema, req.query);

    const result = await userService.getAllUsers({ page, limit, search });

    return res.status(200).json({
      data: result.items,
      meta: result.meta,
      message: "Users retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const userId = req.params.id;
    const result = await userService.getUserById(userId);
    res.status(200).json({ data: result, message: "User data retrieved" });
  } catch (err) {
    next(err);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user.sub;
    const result = await userService.getUserById(userId);
    res.status(200).json({ data: result, message: "User data retrieved" });
  } catch (err) {
    next(err);
  }
}

async function updateCurrentUser(req, res, next) {
  try {
    const userId = req.user.sub;
    const data = validate(updateUserSchema, req.body);
    const result = await userService.updateUserById(userId, data, userId);
    res.status(200).json({ data: result, message: "User data updated" });
  } catch (err) {
    next(err);
  }
}

async function uploadUserImage(req, res, next) {
  try {
    const userId = req.user.sub;
    if (!req.file) throw new ResponseError(400, "No file uploaded");
    const result = await userService.addImageToUser(
      userId,
      req.file,
      req.user?.sub || null
    );
    res.status(201).json({ data: result, message: "Image uploaded" });
  } catch (err) {
    next(err);
  }
}

async function patchApproveUser(req, res, next) {
  try {
    const targetId = req.params.id;
    const { roleId } = validate(approveUserValidation, req.body);
    const approver = req.user;

    const result = await userService.approveUserByAdmin(
      targetId,
      roleId,
      approver?.sub || null
    );

    res.status(200).json({
      data: result,
      message: "User approved successfully and role assigned.",
    });
  } catch (err) {
    next(err);
  }
}

async function getUserImage(req, res, next) {
  try {
    const userId = req.user.sub;

    const result = await userService.getUserImage(userId);

    return res.status(200).json({
      data: result,
      message: "User image retrieved",
    });
  } catch (err) {
    next(err);
  }
}

async function deleteUserImage(req, res, next) {
  try {
    const userId = req.user.sub;

    const result = await userService.deleteUserImage(userId, userId);

    return res.status(200).json({
      data: result,
      message: "User image deleted",
    });
  } catch (err) {
    next(err);
  }
}

export default {
  listUsers,
  getCurrentUser,
  getUserById,
  updateCurrentUser,
  uploadUserImage,
  getUserImage,
  deleteUserImage,
  patchApproveUser,
};
