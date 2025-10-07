export const hasPermission = (user, accessKey) => {
	if (!user || !accessKey) return false;

	const matches = (perm) => {
		if (!perm) return false;
		if (typeof perm === "string") return perm === accessKey;
		if (typeof perm === "object") return perm.accessKey === accessKey;
		return false;
	};

	if (Array.isArray(user.permissions) && user.permissions.some(matches))
		return true;

	if (user.role && Array.isArray(user.role.permissions)) {
		if (user.role.permissions.some(matches)) return true;
	}

	if (Array.isArray(user.roles)) {
		for (const r of user.roles) {
			if (r && Array.isArray(r.permissions) && r.permissions.some(matches))
				return true;
		}
	}

	return false;
};
