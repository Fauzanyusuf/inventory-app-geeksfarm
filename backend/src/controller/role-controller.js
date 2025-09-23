import roleService from "../service/role-service.js";

export async function listRoles(req, res, next) {
  try {
    const result = await roleService.listRoles();
    res.status(200).json({ data: result, message: "Roles retrieved" });
  } catch (err) {
    next(err);
  }
}

export async function getRole(req, res, next) {
  try {
    const roleId = req.params.id;
    const result = await roleService.getRoleById(roleId);
    res.status(200).json({ data: result, message: "Role retrieved" });
  } catch (err) {
    next(err);
  }
}

export default {
  listRoles,
  getRole,
};
