import {
	createContext,
	useContext,
	useState,
	useEffect,
	useMemo,
	useCallback,
} from "react";
import { usersApi, authApi, clearAllCaches, rolesApi } from "@/services/api";

const AuthContext = createContext();

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(localStorage.getItem("token"));
	const [loading, setLoading] = useState(true);

	const refreshToken = useCallback(async (signal) => {
		try {
			const res = await authApi.refresh();
			if (signal?.aborted) return false;

			const newToken = res.data?.accessToken;
			if (newToken) {
				localStorage.setItem("token", newToken);
				setToken(newToken);
				try {
					let me = await usersApi.getCurrentUser();
					if (signal?.aborted) return false;

					me = await enrichUserWithRole(me);
					if (signal?.aborted) return false;

					setUser(normalizeUser(me) || null);
				} catch {
					if (!signal?.aborted) {
						setUser({ isAuthenticated: true });
					}
				}
				return true;
			}
		} catch (err) {
			console.debug("Refresh failed", err);
		}
		return false;
	}, []);

	const enrichUserWithRole = async (user) => {
		if (!user?.role?.id || user.role.permissions?.length > 0) return user;
		try {
			const roleRes = await rolesApi.getRole(user.role.id);
			const roleData = roleRes?.data || roleRes;
			return roleData ? { ...user, role: roleData } : user;
		} catch {
			console.debug("Role enrichment failed");
			return user;
		}
	};

	const normalizeUser = (rawUser) => {
		if (!rawUser) return null;
		return { ...rawUser };
	};

	useEffect(() => {
		const controller = new AbortController();
		let cancelled = false;

		(async () => {
			if (token) {
				const ok = await refreshToken(controller.signal);
				if (!ok && !cancelled) {
					localStorage.removeItem("token");
					setToken(null);
					setUser(null);
				}
			}
			if (!cancelled) setLoading(false);
		})();

		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [token, refreshToken]);

	const login = useCallback(async (email, password) => {
		try {
			const res = await authApi.login({ email, password });
			const accessToken = res.data?.accessToken;
			const userData = res.data?.user;
			if (!accessToken) throw new Error("Login returned no token");
			localStorage.setItem("token", accessToken);
			setToken(accessToken);
			if (userData) {
				setUser(normalizeUser(userData) || null);
			} else {
				try {
					let me = await usersApi.getCurrentUser();
					me = await enrichUserWithRole(me);
					setUser(normalizeUser(me) || null);
				} catch {
					setUser({ isAuthenticated: true });
				}
			}
			return { success: true };
		} catch (error) {
			return { success: false, error: error.message };
		}
	}, []);

	const register = useCallback(async (name, email, password, phone, sex) => {
		try {
			const res = await authApi.register({ name, email, password, phone, sex });
			const accessToken = res.data?.accessToken;
			if (accessToken) {
				localStorage.setItem("token", accessToken);
				setToken(accessToken);
				try {
					let me = await usersApi.getCurrentUser();
					me = await enrichUserWithRole(me);
					setUser(normalizeUser(me) || null);
				} catch {
					setUser({ isAuthenticated: true });
				}
			}
			return { success: true, message: res.message || res.data?.message };
		} catch (error) {
			return { success: false, error: error.message };
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			await authApi.logout();
		} catch (error) {
			console.warn("Logout API call failed:", error);
		}

		localStorage.removeItem("token");
		setToken(null);
		setUser(null);

		try {
			clearAllCaches();
		} catch (error) {
			console.warn("Failed to clear caches:", error);
		}
	}, []);

	useEffect(() => {
		let handle;
		if (token) {
			handle = setInterval(() => {
				refreshToken();
			}, 1000 * 60 * 15);
		}
		return () => clearInterval(handle);
	}, [token, refreshToken]);

	const value = useMemo(
		() => ({
			user,
			token,
			loading,
			login,
			register,
			logout,
			refreshToken,
			isAuthenticated: !!token,
		}),
		[user, token, loading, refreshToken, login, register, logout]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
