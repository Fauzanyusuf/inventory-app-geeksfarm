import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";

async function listRoles() {
	try {
		return prisma.role.findMany({
			omit: {
				createdAt: true,
			},
			include: {
				permissions: {
					where: { isDeleted: false },
					omit: {
						isDeleted: true,
					},
				},
			},
			orderBy: { name: "asc" },
		});
	} catch (err) {
		if (err instanceof ResponseError) throw err;
		throw new ResponseError(500, `Failed to list roles: ${err.message}`);
	}
}

async function getRoleById(id) {
	try {
		const role = await prisma.role.findUnique({
			where: { id },
			include: {
				permissions: {
					where: { isDeleted: false },
				},
			},
		});
		if (!role) throw new ResponseError(404, "Role not found");
		return role;
	} catch (err) {
		if (err instanceof ResponseError) throw err;
		if (err.code === "P2025") throw new ResponseError(404, "Role not found");
		throw new ResponseError(500, `Failed to get role: ${err.message}`);
	}
}

async function updateRolePermissions(roleId, permissionIds) {
	try {
		// First, get the role to ensure it exists
		const role = await prisma.role.findUnique({
			where: { id: roleId },
		});
		if (!role) throw new ResponseError(404, "Role not found");

		// Update the role's permissions using connect/disconnect
		return prisma.role.update({
			where: { id: roleId },
			data: {
				permissions: {
					set: permissionIds.map((id) => ({ id })),
				},
			},
			include: {
				permissions: {
					where: { isDeleted: false },
				},
			},
		});
	} catch (err) {
		if (err instanceof ResponseError) throw err;
		throw new ResponseError(
			500,
			`Failed to update role permissions: ${err.message}`
		);
	}
}

export default {
	listRoles,
	getRoleById,
	updateRolePermissions,
};
