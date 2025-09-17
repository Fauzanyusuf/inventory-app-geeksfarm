import { z } from "zod";

export const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  sellingPrice: z.union([z.bigint(), z.string().regex(/^[0-9]+$/)]).optional(),
  isPerishable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.uuid().optional(),
});

export default productUpdateSchema;
