import { z } from "zod";

export const productBatchCreateSchema = z.object({
  quantity: z.number().int().min(1),
  costPrice: z.coerce.number().int().min(0),
  receivedAt: z.string().optional(),
  expiredAt: z.string().optional(),
  status: z.enum(["AVAILABLE", "EXPIRED", "SOLD_OUT"]).optional(),
});

export default productBatchCreateSchema;
