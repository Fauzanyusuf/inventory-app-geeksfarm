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
	categoryId: z
		.string()
		.transform((val) => (val === "" ? undefined : val))
		.optional()
		.refine((val) => !val || z.cuid().safeParse(val).success, {
			message: "Invalid category ID format",
		}),
	isPerishable: z.boolean().optional(),
});

export const productIdParamSchema = z.uuid();

export const productCreateSchema = z
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

		categoryId: z.preprocess(
			(val) => (val === "" ? undefined : val),
			z.cuid().optional()
		),

		quantity: z.coerce.number().int().gt(0, "Quantity must be greater than 0"),
		receivedAt: z
			.union([
				z.coerce.date(),
				z.string().transform((val) => (val ? new Date(val) : new Date())),
			])
			.default(() => new Date()),
		expiredAt: z
			.union([
				z.coerce.date(),
				z.string().transform((val) => (val ? new Date(val) : null)),
			])
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
	receivedAt: z
		.union([z.coerce.date(), z.string().transform((val) => new Date(val))])
		.default(() => new Date()),
	expiredAt: z
		.union([
			z.coerce.date(),
			z.string().transform((val) => (val ? new Date(val) : undefined)),
		])
		.optional(),
	note: z.string().optional(),
});

// Dynamic validation schema that accepts isPerishable parameter
export const createAddProductStockValidation = (isPerishable = false) => {
	const baseSchema = z.object({
		quantity: z.number().int().positive(),
		costPrice: z.coerce.number().int().positive(),
		receivedAt: z
			.union([z.coerce.date(), z.string().transform((val) => new Date(val))])
			.default(() => new Date()),
		expiredAt: z
			.union([
				z.coerce.date(),
				z.string().transform((val) => (val ? new Date(val) : undefined)),
			])
			.optional(),
		note: z.string().optional(),
	});

	if (isPerishable) {
		return baseSchema.refine(
			(data) => {
				return data.expiredAt instanceof Date;
			},
			{
				message: "Expiration date required for perishable products",
				path: ["expiredAt"],
			}
		);
	}

	return baseSchema;
};

export const productBulkCreateSchema = z.union([
	z.array(productCreateSchema).min(1).max(50),
	productCreateSchema,
]);

export const productListQuerySchema = z.object({
	page: z.coerce.number().int().positive().min(1).default(1),
	limit: z.coerce.number().int().positive().min(1).max(100).default(10),
	search: z.string().trim().optional(),
	category: z.string().trim().optional(),
	minPrice: z.preprocess(
		(val) => (val === "" ? undefined : val),
		z.coerce.number().nonnegative().optional()
	),
	maxPrice: z.preprocess(
		(val) => (val === "" ? undefined : val),
		z.coerce.number().nonnegative().optional()
	),
	sortBy: z.enum(["sellingPrice", "name"]).optional().default("name"),
	sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});
