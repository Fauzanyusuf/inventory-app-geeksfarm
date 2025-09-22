import { z } from "zod";

export const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.uuid()).min(1),
});

export default { updateRolePermissionsSchema };
