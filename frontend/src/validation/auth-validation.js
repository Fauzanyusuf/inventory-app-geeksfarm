import { z } from "zod";

export const loginAuthSchema = z.object({
	email: z
		.email()
		.max(100)
		.transform((email) => email.toLowerCase().trim()),
	password: z.string().min(6).max(100),
});

export const registerUserSchema = z
	.object({
		name: z.string().min(2).max(100),
		email: z
			.email()
			.max(100)
			.transform((email) => email.toLowerCase().trim()),
		password: z.string().min(6).max(100),
		confirmPassword: z.string().min(6).max(100),
		phone: z
			.string()
			.transform((val) => (val === "" ? undefined : val))
			.optional()
			.refine((val) => !val || /^(\+62|62|0)[8-9][0-9]{7,11}$/.test(val), {
				message: "Invalid phone number format",
			}),
		sex: z
			.union([z.string(), z.null(), z.undefined()])
			.transform((val) => {
				if (val === "" || val === null || val === undefined || val === "NONE") {
					return undefined;
				}
				return val;
			})
			.optional()
			.refine((val) => !val || ["MALE", "FEMALE"].includes(val), {
				message: "Sex must be either MALE or FEMALE",
			}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});
