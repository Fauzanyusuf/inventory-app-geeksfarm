import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";

export async function listAccessPermissions() {
  try {
    return prisma.accessPermission.findMany({
      where: { isDeleted: false },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { accessKey: "asc" },
    });
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(
      500,
      `Failed to list access permissions: ${err.message}`
    );
  }
}

export async function getAccessPermissionById(id) {
  try {
    const permission = await prisma.accessPermission.findUnique({
      where: { id, isDeleted: false },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!permission)
      throw new ResponseError(404, "Access permission not found");
    return permission;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2025")
      throw new ResponseError(404, "Access permission not found");
    throw new ResponseError(
      500,
      `Failed to get access permission: ${err.message}`
    );
  }
}

export default {
  listAccessPermissions,
  getAccessPermissionById,
};
