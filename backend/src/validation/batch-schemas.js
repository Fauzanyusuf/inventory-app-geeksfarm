import { z } from "zod";

export const productBatchCreateSchema = z.object({
  quantity: z.number().int().min(1),
  costPrice: z.union([z.bigint(), z.string().regex(/^[0-9]+$/)]),
  receivedAt: z.string().optional(),
  expiredAt: z.string().optional(),
  status: z.enum(["AVAILABLE", "EXPIRED", "SOLD_OUT"]).optional(),
});

export default productBatchCreateSchema;
