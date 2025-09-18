import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";

export async function listRoles() {
  return prisma.role.findMany({
    include: {
      permissions: {
        where: { isDeleted: false },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRoleById(id) {
  return prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        where: { isDeleted: false },
      },
    },
  });
}

export async function updateRolePermissions(roleId, permissionIds, userId) {
  // Only connect the provided permission IDs, disconnect all others
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: true },
  });
  if (!role) throw new ResponseError(404, "Role not found");

  // Disconnect all current permissions, then connect the new ones
  await prisma.role.update({
    where: { id: roleId },
    data: {
      permissions: {
        set: permissionIds.map((id) => ({ id })),
      },
    },
  });

  // Optionally, log audit
  await prisma.auditLog.create({
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

  return getRoleById(roleId);
}
