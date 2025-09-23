import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";

export async function listRoles() {
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

export default {
  listRoles,
  getRoleById,
};
