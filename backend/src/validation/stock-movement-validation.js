import { z } from "zod";

export const commitSalesSchema = z.object({
  sales: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().gt(0, "Quantity must be greater than 0"),
      })
    )
    .min(1, "At least one product required"),
  note: z.string().optional(),
});

export const getStockMovementsQuerySchema = z.object({
  productId: z.uuid().optional(),
  movementType: z.enum(["IN", "OUT", "ADJUSTMENT"]).optional(),
  page: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, "Page must be greater than 0")
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
    .optional(),
});
