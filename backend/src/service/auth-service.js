import { prisma } from "../application/database.js";
import { logger } from "../application/logging.js";
import { signRefreshToken, signToken, verifyToken } from "../utils/jwt.js";
import { ResponseError } from "../utils/response-error.js";
import bcrypt from "bcrypt";
import { replaceOneToOneImage } from "./image-service.js";
import { deleteFile } from "../utils/image-utils.js";
import { createAuditLog } from "../utils/audit-utils.js";

export async function register(request, file = null) {
  try {
    const whereClause = { OR: [{ email: request.email }] };
    if (request.phone) {
      whereClause.OR.push({ phone: request.phone });
    }

    const existing = await prisma.user.findFirst({
      where: whereClause,
      select: { id: true, email: true, phone: true, isDeleted: true },
    });

    if (existing) {
      // Cleanup uploaded file if registration fails
      if (file) {
        await deleteFile(file.filename);
      }

      if (existing.email === request.email) {
        throw new ResponseError(409, "Email already exists");
      } else if (existing.phone === request.phone) {
        throw new ResponseError(409, "Phone number already exists");
      }
    }

    request.password = await bcrypt.hash(request.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: request,
        select: { id: true, email: true, name: true },
      });

      await createAuditLog(tx, {
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        newValues: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          sex: user.sex,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        createdAt: user.createdAt,
        userId: user.id,
      });

      return user;
    });

    let imageResult = null;
    if (file) {
      imageResult = await replaceOneToOneImage(
        "user",
        result.id,
        file,
        result.id
      );
    }

    return {
      user: result,
      image: {
        id: imageResult?.image.id,
        url: imageResult?.image.url,
        thumbnailUrl: imageResult?.image.thumbnailUrl,
        altText: imageResult?.image.altText,
      },
    };
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, "Registration failed: Internal server error");
  }
}

export async function login(request) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: request.email },
    });

    if (!user || user.isDeleted) {
      throw new ResponseError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
      request.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new ResponseError(401, "Invalid email or password");
    }

    const payload = {
      sub: user.id,
      roleId: user.roleId ?? null,
    };

    const accessToken = signToken(payload);
    const refreshToken = signRefreshToken(payload);
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    // Check if user still exists before updating
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      throw new ResponseError(404, "User not found");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: tokenHash },
    });

    await createAuditLog(prisma, {
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      newValues: { loginMethod: "email", email: user.email },
      userId: user.id,
    });

    return { accessToken, refreshToken, cookieOptions };
  } catch (err) {
    if (err instanceof ResponseError) throw err;

    if (err && err.code === "P2025") {
      throw new ResponseError(404, "User not found");
    }

    if (err && err.code === "ERR_INVALID_ARG_TYPE") {
      throw new ResponseError(400, "Invalid password format");
    }

    throw new ResponseError(500, "Login failed due to server error");
  }
}

export async function refresh(token) {
  try {
    if (!token) {
      throw new ResponseError(401, "Missing refresh token");
    }

    const payload = verifyToken(token);

    if (!payload || !payload?.sub) {
      throw new ResponseError(401, "Invalid token payload");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.verifyToken) {
      throw new ResponseError(401, "Refresh token not recognized");
    }

    const match = await bcrypt.compare(token, user.verifyToken);
    if (!match) {
      throw new ResponseError(401, "Refresh token not recognized");
    }

    const accessToken = signToken({
      sub: payload.sub,
      roleId: payload.roleId,
    });

    return accessToken;
  } catch (err) {
    if (err instanceof ResponseError) throw err;

    if (err && err.code === "P2025") {
      throw new ResponseError(401, "User not found");
    }

    throw new ResponseError(500, "Token refresh failed due to server error");
  }
}

export async function logout(token) {
  try {
    if (!token) return { revoked: false };

    const payload = verifyToken(token);

    if (!payload || !payload?.userId) {
      return { revoked: false };
    }

    if (payload?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user && user.verifyToken) {
        const match = await bcrypt.compare(token, user.verifyToken);
        if (match) {
          await prisma.user.update({
            where: { id: user.id },
            data: { verifyToken: null },
          });

          await createAuditLog(prisma, {
            action: "LOGOUT",
            entity: "User",
            entityId: user.id,
            oldValues: { hadRefreshToken: true },
            newValues: { hadRefreshToken: false },
            userId: user.id,
          });
        }
      }
    }

    return { revoked: true };
  } catch (err) {
    if (err instanceof ResponseError) throw err;

    if (err && err.code === "P2025") {
      return { revoked: false };
    }
    logger.error("Logout cleanup failed:", err);
    return { revoked: false };
  }
}

export default {
  register,
  login,
  refresh,
  logout,
};
