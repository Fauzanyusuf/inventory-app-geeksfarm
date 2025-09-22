import { z } from "zod";

export const loginAuthSchema = z.object({
  email: z.email().max(100),
  password: z.string().min(6).max(100),
});

export const registerUserSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.email().max(100),
  password: z.string().min(6).max(100),
  phone: z
    .string()
    .regex(/^(\+62|62|0)[8-9][0-9]{7,11}$/, "Invalid phone number format")
    .max(20)
    .optional(),
  sex: z.enum(["Male", "Female"]).optional(),
});

export default { loginAuthSchema, registerUserSchema };
