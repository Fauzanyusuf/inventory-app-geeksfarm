import roleService from "../service/role-service.js";
import { validate } from "../validation/validate.js";
import {
	roleIdParamSchema,
	updateRolePermissionsSchema,
} from "../validation/role-validation.js";

async function listRoles(req, res, next) {
	try {
		const result = await roleService.listRoles();
		res.status(200).json({ data: result, message: "Roles retrieved" });
	} catch (err) {
		next(err);
	}
}

async function getRole(req, res, next) {
	try {
		const roleId = req.params.id;
		const result = await roleService.getRoleById(roleId);
		res.status(200).json({ data: result, message: "Role retrieved" });
	} catch (err) {
		next(err);
	}
}

async function updateRolePermissions(req, res, next) {
	try {
		const roleId = validate(roleIdParamSchema, req.params.id);
		const validatedData = validate(updateRolePermissionsSchema, req.body);
		const result = await roleService.updateRolePermissions(
			roleId,
			validatedData.permissionIds
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
