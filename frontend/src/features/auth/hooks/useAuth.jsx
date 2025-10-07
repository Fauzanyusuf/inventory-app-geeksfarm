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
	// Refresh token helper (stable)
	const refreshToken = useCallback(async () => {
		try {
			const res = await authApi.refresh();
			const newToken = res.data?.accessToken;
			if (newToken) {
				localStorage.setItem("token", newToken);
				setToken(newToken);
				try {
					// usersApi.getCurrentUser already returns `r.data || null`.
					let me = await usersApi.getCurrentUser();
					// If API returned a role reference without permissions, try to fetch role details
					try {
						if (
							me &&
							me.role &&
							(!me.role.permissions || me.role.permissions.length === 0) &&
							me.role.id
						) {
							const roleRes = await rolesApi.getRole(me.role.id);
							const roleData = roleRes && roleRes.data ? roleRes.data : roleRes;
							if (roleData) me = { ...me, role: roleData };
						}
					} catch {
						// ignore role enrichment errors
						console.debug("Role enrichment failed");
					}
					setUser(normalizeUser(me) || null);
				} catch {
					// If fetching user fails but refresh succeeded, mark as authenticated
					setUser({ isAuthenticated: true });
				}
				return true;
			}
		} catch (err) {
			console.debug("Refresh failed", err);
		}
		return false;
	}, []);

	// Normalize user object: ensure a flat `permissions` string[] exists
	const normalizeUser = (rawUser) => {
		if (!rawUser) return null;
		// Keep the original user object shape. Permission checks will rely on
		// role.permissions or roles[].permissions per team decision.
		return { ...rawUser };
	};

	// On mount (and when token changes) try to refresh and resolve loading
	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (token) {
				const ok = await refreshToken();
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
				// If login didn't return full user payload, fetch it and enrich role if needed
				try {
					let me = await usersApi.getCurrentUser();
					try {
						if (
							me &&
							me.role &&
							(!me.role.permissions || me.role.permissions.length === 0) &&
							me.role.id
						) {
							const roleRes = await rolesApi.getRole(me.role.id);
							const roleData = roleRes && roleRes.data ? roleRes.data : roleRes;
							if (roleData) me = { ...me, role: roleData };
						}
					} catch (e) {
						console.debug("Role enrichment failed", e);
					}
					setUser(normalizeUser(me) || null);
				} catch {
					// fallback: at least mark authenticated
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
					try {
						if (
							me &&
							me.role &&
							(!me.role.permissions || me.role.permissions.length === 0) &&
							me.role.id
						) {
							const roleRes = await rolesApi.getRole(me.role.id);
							const roleData = roleRes && roleRes.data ? roleRes.data : roleRes;
							if (roleData) me = { ...me, role: roleData };
						}
					} catch (e) {
						console.debug("Role enrichment failed", e);
					}
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

	const logout = () => {
		// Call backend logout endpoint if available (best-effort)
		(async () => {
			try {
				await authApi.logout();
			} catch {
				// ignore network errors during logout
			}
			// Clear client auth state and caches
			localStorage.removeItem("token");
			setToken(null);
			setUser(null);
			try {
				clearAllCaches();
			} catch {
				// ignore
			}
		})();
	};

	// periodic refresh (optional): refresh every 15 minutes while logged in
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
		[user, token, loading, refreshToken, login, register]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
