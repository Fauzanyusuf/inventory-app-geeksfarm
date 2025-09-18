import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";
import { replaceOneToOneImage } from "./image-service.js";

export async function addImageToUser(userId, fileInfo, actorUserId = null) {
  // Ensure user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ResponseError(404, "User not found");

  // replace existing one-to-one image (create new image, update user, delete previous image row and files)
  const { image, prevImage, owner } = await replaceOneToOneImage(
    'user',
    userId,
    fileInfo,
    actorUserId
  );

  return { image, user: owner, prevImage };
}

export default { addImageToUser };
