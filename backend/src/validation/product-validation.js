import { z } from "zod";

export const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  sellingPrice: z
    .union([z.coerce.bigint(), z.string().regex(/^[0-9]+$/)])
    .optional(),
  isPerishable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().optional(),
});

export const productBatchCreateSchema = z.object({
  quantity: z.number().int().gt(0, "Quantity must be greater than 0"),
  costPrice: z.union([z.coerce.bigint(), z.string().regex(/^[0-9]+$/)]),
  receivedAt: z.string().optional(),
  expiredAt: z.string().optional(),
  status: z.enum(["AVAILABLE", "EXPIRED", "SOLD_OUT"]).optional(),
});

export const productIdParamSchema = z.uuid();

export const productCreateSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    barcode: z.string().optional(),
    description: z.string().optional(),

    unit: z.string().default("pcs"),

    sellingPrice: z.union([z.coerce.bigint(), z.string()]).refine((val) => {
      try {
        if (typeof val === "bigint") return val > 0n;
        if (typeof val === "string") {
          const num = BigInt(val);
          return num > 0n;
        }
        return false;
      } catch {
        return false;
      }
    }, "Selling price must be a valid positive number"),

    costPrice: z.union([z.coerce.bigint(), z.string()]).refine((val) => {
      try {
        if (typeof val === "bigint") return val > 0n;
        if (typeof val === "string") {
          const num = BigInt(val);
          return num > 0n;
        }
        return false;
      } catch {
        return false;
      }
    }, "Cost price must be a valid positive number"),

    categoryId: z.string().optional(),

    quantity: z.coerce.number().int().gt(0, "Quantity must be greater than 0"),
    receivedAt: z.coerce.date().default(() => new Date()),
    expiredAt: z.coerce.date().nullable().optional(),
    movementNote: z.string().optional(),

    isPerishable: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === "boolean") return val;
        if (typeof val === "string") {
          return val.toLowerCase() === "true";
        }
        return false;
      })
      .default(false),
  })
  .refine(
    (data) => {
      if (data.isPerishable) {
        return data.expiredAt instanceof Date;
      }
      return true;
    },
    {
      message: "expiredAt is required if product is perishable",
      path: ["expiredAt"],
    }
  );

export const updateProductBatchValidation = z.object({
  status: z.enum(["AVAILABLE", "EXPIRED", "SOLD_OUT"]).optional(),
  quantity: z.number().int().min(0).optional(),
  costPrice: z.union([z.coerce.bigint(), z.string().regex(/^[0-9]+$/)]).optional(),
  receivedAt: z.coerce.date().optional(),
  expiredAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const addProductStockValidation = z.object({
  quantity: z.number().int().positive(),
  costPrice: z.union([z.coerce.bigint(), z.string().regex(/^[0-9]+$/)]),
  receivedAt: z.coerce.date(),
  expiredAt: z.coerce.date().optional(),
  note: z.string().optional(),
});

// Schema untuk bulk create products - bisa array atau single object
export const productBulkCreateSchema = z.union([
  productCreateSchema, // Single product
  z.array(productCreateSchema).min(1).max(50), // Array of products, max 50 untuk efisiensi
]);

export default {
  productIdParamSchema,
  productCreateSchema,
  productUpdateSchema,
  productBatchCreateSchema,
  updateProductBatchValidation,
  addProductStockValidation,
  productBulkCreateSchema,
};
