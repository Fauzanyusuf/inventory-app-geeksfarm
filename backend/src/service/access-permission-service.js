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

export default {
  listAccessPermissions,
};
