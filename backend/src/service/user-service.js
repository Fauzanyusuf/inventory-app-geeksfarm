import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";
import { replaceOneToOneImage, deleteImage } from "./image-service.js";
import { deleteFile } from "../utils/image-utils.js";
import { createAuditLog } from "../utils/audit-utils.js";

async function addImageToUser(userId, fileInfo, actorUserId = null) {
  try {
    if (!fileInfo) {
      throw new ResponseError(400, "No file provided");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      await deleteFile(fileInfo.filename);
      throw new ResponseError(404, "User not found");
    }

    if (user.isDeleted) {
      // Cleanup uploaded file if user is deleted
      await deleteFile(fileInfo.filename);
      throw new ResponseError(410, "Cannot upload image to deleted user");
    }

    const { image, prevImage, owner } = await replaceOneToOneImage(
      "user",
      userId,
      fileInfo,
      actorUserId
    );

    await createAuditLog(prisma, {
      action: "UPDATE",
      entity: "User",
      entityId: userId,
      oldValues: {
        imageId: prevImage?.id || null,
        imageUrl: prevImage?.url || null,
        thumbnailUrl: prevImage?.thumbnailUrl || null,
      },
      newValues: {
        imageId: image.id,
        imageUrl: image.url,
        thumbnailUrl: image.thumbnailUrl,
      },
      userId: actorUserId || userId,
    });

    return { image, user: owner, prevImage };
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, `Image upload failed: ${err.message}`);
  }
}

async function getUserById(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        sex: true,
        role: {
          select: {
            name: true,
          },
        },
        image: {
          select: {
            url: true,
            thumbnailUrl: true,
          },
        },
      },
    });
    if (!user) throw new ResponseError(404, "User not found");
    return user;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, `Failed to get user: Server error`);
  }
}

async function updateUserById(userId, updateData, actorUserId = null) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ResponseError(404, "User not found");

    // Get old values for audit
    const oldValues = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      sex: user.sex,
    };

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          sex: true,
          updatedAt: true,
        },
      });

      await createAuditLog(tx, {
        action: "UPDATE",
        entity: "User",
        entityId: userId,
        oldValues,
        newValues: updateData,
        userId: actorUserId || userId,
      });

      return updated;
    });

    return result;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2002")
      throw new ResponseError(409, "Email already exists");
    throw new ResponseError(500, `Failed to update user: ${err.message}`);
  }
}

async function approveUserByAdmin(userId, roleId, approverId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new ResponseError(404, "User not found");

    const oldRole = user.roleId
      ? await prisma.role.findUnique({
          where: { id: user.roleId },
        })
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { isVerified: true, roleId },
      });

      const newRole = await tx.role.findUnique({ where: { id: roleId } });

      if (!newRole) {
        throw new ResponseError(404, "Role not found");
      }

      await createAuditLog(tx, {
        action: "UPDATE",
        entity: "User",
        entityId: userId,
        oldValues: {
          isVerified: user.isVerified,
          roleId: user.roleId,
          roleName: oldRole?.name || null,
        },
        newValues: {
          isVerified: updated.isVerified,
          roleId: updated.roleId,
          roleName: newRole?.name || null,
        },
        userId: approverId,
      });

      return { updated, newRole };
    });

    return { id: result.updated.id, role: result.newRole?.name || null };
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    if (err.code === "P2025")
      throw new ResponseError(404, "User or role not found");
    throw new ResponseError(500, `Approval failed: ${err.message}`);
  }
}

async function getAllUsers({ page = 1, limit = 10, search } = {}) {
  try {
    const skip = (page - 1) * limit;
    const where = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          sex: true,
          isVerified: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          image: {
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              altText: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: users,
      meta: { total, page, limit, totalPages },
    };
  } catch (err) {
    throw new ResponseError(500, `Failed to get users: ${err.message}`);
  }
}

async function getUserImage(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, imageId: true },
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    if (!user.imageId) {
      throw new ResponseError(404, "User has no image");
    }

    const image = await prisma.image.findUnique({
      where: { id: user.imageId },
    });

    if (!image) {
      throw new ResponseError(404, "Image not found");
    }

    return image;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, `Failed to get user image: ${err.message}`);
  }
}

async function deleteUserImage(userId, actorUserId = null) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, imageId: true },
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    if (!user.imageId) {
      throw new ResponseError(404, "User has no image");
    }

    // Delete the image using image service
    const result = await deleteImage(user.imageId, actorUserId);

    // Update user to remove imageId
    await prisma.user.update({
      where: { id: userId },
      data: { imageId: null },
    });

    return result.image;
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, `Failed to delete user image: ${err.message}`);
  }
}

export default {
  addImageToUser,
  getUserById,
  updateUserById,
  approveUserByAdmin,
  getAllUsers,
  getUserImage,
  deleteUserImage,
};
