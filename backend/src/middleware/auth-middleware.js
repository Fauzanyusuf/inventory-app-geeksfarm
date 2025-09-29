import { prisma } from "../application/database.js";
import { logger } from "../application/logging.js";
import { ResponseError } from "../utils/response-error.js";
import { verifyToken } from "../utils/jwt.js";

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ResponseError(401, "Unauthorized");
    }

    const token = authHeader.substring(7).trim();

    const payload = verifyToken(token);

    const userId = payload?.sub;
    const roleId = payload?.roleId;

    if (!payload || !userId || !roleId) {
      throw new ResponseError(401, "Invalid token payload");
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          where: {
            isDeleted: false,
          },
        },
      },
    });

    if (!role || role.isDeleted) {
      throw new ResponseError(401, "Role not found or inactive");
    }

    const permissions = role.permissions?.map((p) => p.accessKey) || [];

    req.user = {
      sub: userId,
      role,
      permissions,
    };

    next();
  } catch (err) {
    logger.debug("Auth middleware error", { error: err?.message });
    next(err);
  }
}
