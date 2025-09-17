import { z } from "zod";

export const loginUserValidation = z.object({
  email: z.email().max(100),
  password: z.string().min(6).max(100),
});
