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

    const userId = payload?.userId;

    if (!userId) {
      throw new ResponseError(401, "Invalid token payload");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    if (!user || user.isDeleted) {
      throw new ResponseError(401, "User not found or inactive");
    }

    const permissions = user.role?.permissions?.map((p) => p.accessKey) || [];

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: user.role ? { id: user.role.id, name: user.role.name } : undefined,
      permissions,
    };

    next();
  } catch (err) {
    logger.debug("Auth middleware error", { error: err?.message });
    next(err);
  }
}
