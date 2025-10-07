import { useEffect, useState } from "react";
import { usersApi } from "@/services/api";

export function useUserFormData(setValue) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const loadUserData = async () => {
			try {
				setLoading(true);
				setError("");

				const res = await usersApi.getCurrentUser();
				const data = res.data || res || {};

				setUser(data);

				setValue("name", data.name || "");
				setValue("email", data.email || "");
				setValue("phone", data.phone || "");
				setValue("sex", data.sex || "MALE");
			} catch (err) {
				console.error("Failed to load user data:", err);
				setError("Failed to load user data");
			} finally {
				setLoading(false);
			}
		};

		loadUserData();
	}, [setValue]);

	return {
		user,
		loading,
		error,
	};
}
