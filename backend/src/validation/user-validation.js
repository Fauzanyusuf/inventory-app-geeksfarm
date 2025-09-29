import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.email().max(100).optional(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)[8-9][0-9]{7,11}$/, "Invalid phone number format")
    .max(20)
    .optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
});

export const approveUserValidation = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});
