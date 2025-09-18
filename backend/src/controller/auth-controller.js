import { validate } from "../validation/validate.js";
import { loginAuthSchema } from "../validation/auth-schemas.js";
import authService from "../service/auth-service.js";

export async function login(req, res, next) {
  try {
    const data = validate(loginAuthSchema, req.body);
    const { user, accessToken, refreshToken, cookieOptions } =
      await authService.login(data);

    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(200).json({
      data: {
        user,
        accessToken,
      },
      message: "Logged in",
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    const accessToken = await authService.refresh(token);

    res.status(200).json({ data: { accessToken }, message: "Token refreshed" });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
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
  login,
  refresh,
  logout,
};
