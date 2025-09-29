import { z } from "zod";

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  entity: z.string().optional(),
  action: z
    .enum(["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "OTHER"])
    .optional(),
  userId: z.uuid().optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
});

export default {
  auditLogQuerySchema,
};
