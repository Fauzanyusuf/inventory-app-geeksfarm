import { z } from "zod";

export const roleIdParamSchema = z.cuid();

export const updateRolePermissionsSchema = z.object({
	permissionIds: z.array(z.cuid()).min(0),
});
