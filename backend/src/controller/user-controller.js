import * as userService from "../service/user-service.js";

export async function uploadUserImage(req, res, next) {
  try {
    const userId = req.params.id;
    if (!req.file) return res.status(400).json({ errors: "No file uploaded" });
    const result = await userService.addImageToUser(
      userId,
      req.file,
      req.user?.id || null
    );
    return res.status(201).json({ data: result, message: "Image uploaded" });
  } catch (err) {
    next(err);
  }
}

export default { uploadUserImage };
