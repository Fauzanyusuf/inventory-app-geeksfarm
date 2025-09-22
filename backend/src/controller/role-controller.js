import roleService from "../service/role-service.js";
import { validate } from "../validation/validate.js";
import { updateRolePermissionsSchema } from "../validation/role-validation.js";

export async function listRoles(req, res, next) {
  try {
    const result = await roleService.listRoles();
    res.status(200).json({ data: result, message: "Roles retrieved" });
  } catch (err) {
    next(err);
  }
}

export async function getRole(req, res, next) {
  try {
    const roleId = req.params.id;
    const result = await roleService.getRoleById(roleId);
    res.status(200).json({ data: result, message: "Role retrieved" });
  } catch (err) {
    next(err);
  }
}

export async function updateRolePermissions(req, res, next) {
  try {
    const id = req.params.id;
    const request = validate(updateRolePermissionsSchema, req.body);
    const result = await roleService.updateRolePermissions(
      id,
      request.permissionIds,
      req.user?.id || null
    );
    res.status(200).json({ data: result, message: "Role permissions updated" });
  } catch (err) {
    next(err);
  }
}

export default {
  listRoles,
  getRole,
  updateRolePermissions,
};
