import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";

export async function listAccessPermissions() {
  try {
    return prisma.accessPermission.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        accessKey: true,
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
      `Failed to list access permissions: Server error`
    );
  }
}

export async function getAccessPermissionById(id) {
  try {
    const permission = await prisma.accessPermission.findUnique({
      where: { id: id, isDeleted: false },
      select: {
        id: true,
        accessKey: true,
        role: true,
      },
    });

    if (!permission) {
      throw new ResponseError(404, "Access permission not found");
    }

    return permission;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(
      500,
      `Failed to get access permission: Server error`
    );
  }
}

export default {
  listAccessPermissions,
  getAccessPermissionById,
};
