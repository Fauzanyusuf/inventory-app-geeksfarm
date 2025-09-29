import { z } from "zod";

export const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  barcode: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  sellingPrice: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  categoryId: z.cuid().optional(),
});

export const productIdParamSchema = z.uuid();

const productCreateSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    barcode: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional(),
    description: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional(),

    unit: z.string().default("pcs"),

    sellingPrice: z.coerce
      .number()
      .int()
      .positive("Selling price must be a valid positive number"),

    costPrice: z.coerce
      .number()
      .int()
      .positive("Cost price must be a valid positive number"),

    categoryId: z
      .cuid()
      .transform((val) => (val === "" ? undefined : val))
      .optional(),

    quantity: z.coerce.number().int().gt(0, "Quantity must be greater than 0"),
    receivedAt: z
      .union([z.coerce.date(), z.literal("").transform(() => new Date())])
      .default(() => new Date()),
    expiredAt: z
      .union([z.coerce.date(), z.literal("").transform(() => null)])
      .nullable()
      .optional(),
    movementNote: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional(),

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
  costPrice: z.coerce.number().int().positive().optional(),
  receivedAt: z.coerce.date().optional(),
  expiredAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const addProductStockValidation = z.object({
  quantity: z.number().int().positive(),
  costPrice: z.coerce.number().int().positive(),
  receivedAt: z.coerce.date().default(() => new Date()),
  expiredAt: z.coerce.date().optional(),
  note: z.string().optional(),
});

// Schema untuk bulk create products - bisa array atau single object
export const productBulkCreateSchema = z.union([
  z.array(productCreateSchema).min(1).max(50), // Array of products, max 50 untuk efisiensi
  productCreateSchema, // Single product
]);
