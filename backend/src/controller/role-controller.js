import * as roleService from "../service/role-service.js";
import { validate } from "../validation/validate.js";
import { updateRolePermissionsSchema } from "../validation/role-validations.js";

export async function listRoles(req, res, next) {
  try {
    const result = await roleService.listRoles();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getRole(req, res, next) {
  try {
    const id = req.params.id;
    const result = await roleService.getRoleById(id);
    if (!result) return res.status(404).json({ errors: "Role not found" });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateRolePermissions(req, res, next) {
  try {
    const id = req.params.id;
    const payload = validate(updateRolePermissionsSchema, req.body);
    const updated = await roleService.updateRolePermissions(
      id,
      payload.permissionIds,
      req.user?.id || null
    );
    res.json({ data: updated, message: "Role permissions updated" });
  } catch (err) {
    next(err);
  }
}
