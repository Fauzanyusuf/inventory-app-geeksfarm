import { z } from "zod";

export const productCreateSchema = z.object({
  product: z.object({
    name: z.string().min(1),
    barcode: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    sellingPrice: z
      .bigint()
      .positive()
      .or(z.string().regex(/^[0-9]+$/)),
    isPerishable: z.boolean().optional(),
    isActive: z.boolean().optional(),
    categoryId: z.uuid().optional(),
  }),
  initialBatch: z.object({
    quantity: z.number().int().min(1),
    costPrice: z
      .bigint()
      .positive()
      .or(z.string().regex(/^[0-9]+$/)),
    receivedAt: z.iso.datetime().optional(),
    expiredAt: z.iso.datetime().optional(),
    status: z.enum(["AVAILABLE", "EXPIRED", "SOLD_OUT"]).optional(),
  }),
  movementNote: z.string().optional(),
});
