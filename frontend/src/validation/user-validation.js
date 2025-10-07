import { z } from "zod";

export const updateUserSchema = z.object({
	name: z.string().max(100).optional(),
	email: z.email().max(100).optional(),
	phone: z.preprocess(
		(val) => {
			// If the form sends an empty string, treat it as omitted
			if (typeof val === "string" && val.trim() === "") return undefined;
			return val;
		},
		z
			.string()
			.max(20)
			.regex(/^(\+62|62|0)[8-9][0-9]{7,11}$/, "Invalid phone number format")
			.optional()
	),
	sex: z
		.string()
		.transform((val) => (val === "" ? undefined : val))
		.optional()
		.refine((val) => !val || ["MALE", "FEMALE"].includes(val), {
			message: "Sex must be either MALE or FEMALE",
		}),
});

export const approveUserValidation = z.object({
	roleId: z
		.string()
		.transform((val) => (val === "" ? undefined : val))
		.refine((val) => val && val.length > 0, {
			message: "Role ID is required",
		}),
});
