import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";

export async function listRoles() {
  try {
    return prisma.role.findMany({
      include: {
        permissions: {
          where: { isDeleted: false },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, `Failed to list roles: ${err.message}`);
  }
}

export async function getRoleById(id) {
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

export async function updateRolePermissions(roleId, permissionIds, userId) {
  try {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });
    if (!role) throw new ResponseError(404, "Role not found");

    await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: roleId },
        data: {
          permissions: {
            set: permissionIds.map((id) => ({ id })),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Role",
          entityId: roleId,
          oldValues: JSON.stringify({
            permissions: role.permissions.map((p) => p.id),
          }),
          newValues: JSON.stringify({ permissions: permissionIds }),
          userId,
        },
      });
    });

    return getRoleById(roleId);
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2025") throw new ResponseError(404, "Role not found");
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
