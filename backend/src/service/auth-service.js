import { prisma } from "../application/database.js";
import { signRefreshToken, signToken, verifyToken } from "../utils/jwt.js";
import { ResponseError } from "../utils/response-error.js";
import bcrypt from "bcrypt";

// Simple in-memory revoked refresh-token store (was previously a separate util)
const revoked = new Set();

export async function revokeRefreshToken(token) {
  if (!token) return;
  revoked.add(token);
}

export async function isRefreshTokenRevoked(token) {
  return revoked.has(token);
}

export async function clearRevokedStore() {
  revoked.clear();
}

export async function login(request) {
  const user = await prisma.user.findUnique({
    where: { email: request.email },
  });

  if (!user || user.isDeleted) {
    throw new ResponseError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(request.password, user.password);

  if (!isPasswordValid) {
    throw new ResponseError(401, "Invalid email or password");
  }

  const payload = {
    userId: user.id,
    roleId: user.roleId ?? null,
  };

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    roleId: user.roleId,
  };
  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken(payload);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  // persist hashed refresh token to user's verifyToken field
  try {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: tokenHash },
    });
  } catch (e) {
    // if DB write fails, revoke in-memory and surface error
    await revokeRefreshToken(refreshToken);
    throw e;
  }

  return { user: safeUser, accessToken, refreshToken, cookieOptions };
}

export async function refresh(token) {
  if (!token) {
    throw new ResponseError(401, "Missing refresh token");
  }

  if (await isRefreshTokenRevoked(token)) {
    throw new ResponseError(401, "Refresh token revoked");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (e) {
    throw new ResponseError(401, "Invalid refresh token");
  }

  if (!payload || !payload?.userId) {
    throw new ResponseError(401, "Invalid token payload");
  }

  // ensure token matches the user's stored (hashed) refresh token (verifyToken)
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.verifyToken) {
    throw new ResponseError(401, "Refresh token not recognized");
  }

  const match = await bcrypt.compare(token, user.verifyToken);
  if (!match) {
    throw new ResponseError(401, "Refresh token not recognized");
  }

  const accessToken = signToken({
    userId: payload.userId,
    roleId: payload.roleId,
  });

  return accessToken;
}

export async function logout(token) {
  if (!token) return { revoked: false };

  // revoke in-memory as fallback
  await revokeRefreshToken(token);

  // try to identify user from token and clear hashed verifyToken if it matches
  try {
    const payload = verifyToken(token);
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
        }
      }
    }
  } catch (e) {
    // invalid token or DB error — best-effort only
    console.error("Logout cleanup error", e);
  }

  return { revoked: true };
}
export default {
  login,
  refresh,
  logout,
};
