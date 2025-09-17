import { prisma } from "../application/database.js";
import { signRefreshToken, signToken, verifyToken } from "../utils/jwt.js";
import { isRefreshTokenRevoked } from "../utils/refresh-token-store.js";
import { ResponseError } from "../utils/response-error.js";
import bcrypt from "bcrypt";

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

  return { user: safeUser, accessToken, refreshToken, cookieOptions };
}

export async function refresh(token) {
  if (!token) {
    throw new ResponseError(401, "Missing refresh token");
  }

  if (await isRefreshTokenRevoked(token)) {
    throw new ResponseError(401, "Refresh token revoked");
  }

  const payload = verifyToken(token);

  if (!payload || !payload?.userId) {
    throw new ResponseError(401, "Invalid token payload");
  }

  const accessToken = signToken({
    userId: payload.userId,
    roleId: payload.roleId,
  });

  return accessToken;
}

export async function logout(token) {
  await revokeRefreshToken(token);
  return { revoked: !!token };
}
export default {
  login,
  refresh,
  logout,
};
