import { z } from "zod";

export const categoryCreateSchema = z.object({
	name: z.string().min(1),
	description: z
		.string()
		.nullable()
		.transform((val) => (val === "" || val === null ? undefined : val))
		.optional(),
});

export const categoryUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	description: z
		.string()
		.nullable()
		.transform((val) => (val === "" || val === null ? undefined : val))
		.optional(),
});
