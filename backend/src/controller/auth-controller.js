import { validate } from "../validation/validate.js";
import {
  loginAuthSchema,
  registerUserSchema,
} from "../validation/auth-validation.js";
import authService from "../service/auth-service.js";
import { logger } from "../application/logging.js";
import { validateImageFile } from "../utils/image-utils.js";

async function register(req, res, next) {
  try {
    const data = validate(registerUserSchema, req.body);

    let file = null;
    if (req.file) {
      file = validateImageFile(req.file);
    }

    const result = await authService.register(data, file || null);

    logger.info(
      `New user registered: ${result.user.email}, image: ${file ? "yes" : "no"}`
    );

    res.status(201).json({
      data: { ...result.user, image: result.image },
      message: "User registered. Awaiting admin approval.",
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = validate(loginAuthSchema, req.body);
    const { accessToken, refreshToken, cookieOptions } =
      await authService.login(data);

    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(200).json({
      data: {
        accessToken,
      },
      message: "Logged in",
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    const accessToken = await authService.refresh(token);

    res.status(200).json({ data: { accessToken }, message: "Token refreshed" });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    await authService.logout(token);

    res.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax" });

    res.status(200).json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export default {
  register,
  login,
  refresh,
  logout,
};
