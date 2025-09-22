import { getImageById, deleteImage } from "../service/image-service.js";
import { ResponseError } from "../utils/response-error.js";
import { logger } from "../application/logging.js";

export async function getImage(req, res, next) {
  try {
    const { id } = req.params;

    const image = await getImageById(id);

    logger.info(`Image retrieved: ${id}`);

    res.status(200).json({
      data: image,
      message: "Image retrieved successfully",
    });
  } catch (error) {
    if (error.message === "Image not found") {
      next(new ResponseError(404, "Image not found"));
    } else {
      logger.error("Get image error:", error);
      next(new ResponseError(500, "Failed to get image"));
    }
  }
}

export async function deleteImageHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await deleteImage(id, userId);

    logger.info(`Image deleted: ${id}`);

    res.status(200).json({
      data: {
        image: result.image,
        fileCleanup: result.fileCleanup,
      },
      message: "Image deleted successfully",
    });
  } catch (error) {
    if (error.message === "Image not found") {
      next(new ResponseError(404, "Image not found"));
    } else {
      logger.error("Delete image error:", error);
      next(new ResponseError(500, "Failed to delete image"));
    }
  }
}