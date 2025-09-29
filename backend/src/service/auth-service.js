import { prisma } from "../application/database.js";
import { logger } from "../application/logging.js";
import { signRefreshToken, signToken, verifyToken } from "../utils/jwt.js";
import { ResponseError } from "../utils/response-error.js";
import bcrypt from "bcrypt";
import { replaceOneToOneImage } from "./image-service.js";
import { cleanupFilesOnError, deleteFile } from "../utils/image-utils.js";
import { createAuditLog } from "../utils/audit-utils.js";

async function register(request, file = null) {
  try {
    const whereClause = {
      OR: [
        { email: request.email },
        ...(request.phone ? [{ phone: request.phone }] : []),
      ],
    };

    const existing = await prisma.user.findFirst({
      where: whereClause,
      select: { id: true, email: true, phone: true, isDeleted: true },
    });

    if (existing) {
      if (file?.filename) await deleteFile(file.filename);
      if (existing.email === request.email)
        throw new ResponseError(409, "Email already exists");
      if (existing.phone === request.phone)
        throw new ResponseError(409, "Phone number already exists");
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
    if (file) await cleanupFilesOnError([file]);
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, "Registration failed: Internal server error");
  }
}

async function login(request) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: request.email, isDeleted: false },
      select: {
        id: true,
        email: true,
        password: true,
        roleId: true,
      },
    });

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
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: tokenHash },
    });

    createAuditLog(prisma, {
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      newValues: { loginMethod: "email", email: user.email },
      userId: user.id,
    });

    return { accessToken, refreshToken, cookieOptions };
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, "Login failed due to server error");
  }
}

async function refresh(token) {
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

    return signToken({
      sub: payload.sub,
      roleId: payload.roleId,
    });
  } catch (err) {
    if (err instanceof ResponseError) throw err;
    throw new ResponseError(500, "Token refresh failed due to server error");
  }
}

async function logout(token) {
  try {
    let revoked = false;
    if (!token) return { revoked };

    const payload = verifyToken(token);

    if (!payload || !payload.sub) {
      return { revoked };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, verifyToken: true },
    });

    if (user && user.verifyToken) {
      logger.info(`Logging out user: ${user.verifyToken}`);
      const match = await bcrypt.compare(token, user.verifyToken);
      if (match) {
        await prisma.user.update({
          where: { id: user.id },
          data: { verifyToken: null },
        });

        createAuditLog(prisma, {
          action: "LOGOUT",
          entity: "User",
          entityId: user.id,
          oldValues: { hadRefreshToken: true },
          newValues: { hadRefreshToken: false },
          userId: user.id,
        });

        revoked = true;
      }
    }

    return { revoked };
  } catch (err) {
    if (err instanceof ResponseError) throw err;

    logger.error("Logout cleanup failed:", err);
  }
}

export default {
  register,
  login,
  refresh,
  logout,
};
