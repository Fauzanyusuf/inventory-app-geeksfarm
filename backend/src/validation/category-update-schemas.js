import { z } from "zod";

export const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export default categoryUpdateSchema;
