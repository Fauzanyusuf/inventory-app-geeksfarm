import { ApiError, parseErrorBody } from "@/utils/apiError";

const API_BASE_URL = "http://localhost:4000/api";

const getAuthHeaders = () => {
	const token = localStorage.getItem("token");
	return {
		"Content-Type": "application/json",
		...(token && { Authorization: `Bearer ${token}` }),
	};
};

const inFlightRequests = new Map();
const responseCache = new Map();
const CACHE_TTL_MS = 2000;

const clearCacheForPrefix = (endpointPrefix) => {
	const prefix = `GET:${API_BASE_URL}${endpointPrefix}`;

	for (const key of Array.from(responseCache.keys())) {
		if (key.startsWith(prefix)) responseCache.delete(key);
	}

	for (const key of Array.from(inFlightRequests.keys())) {
		if (key.startsWith(prefix)) inFlightRequests.delete(key);
	}
};

const apiCall = async (endpoint, options = {}) => {
	const url = `${API_BASE_URL}${endpoint}`;
	const method = (options.method || "GET").toUpperCase();
	const config = {
		headers: getAuthHeaders(),
		credentials: options.credentials || "include",
		...options,
	};

	const key = `${method}:${url}`;

	if (method === "GET") {
		const cached = responseCache.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.data;
		}

		const inFlight = inFlightRequests.get(key);
		if (inFlight) return inFlight;
	}

	const promise = (async () => {
		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				const parsed = await parseErrorBody(response);
				const errMsg =
					parsed.message ||
					(parsed.errors && parsed.errors.length
						? parsed.errors[0].message
						: null) ||
					`HTTP error! status: ${response.status}`;
				throw new ApiError({
					message: errMsg,
					status: response.status,
					errors: parsed.errors,
					raw: parsed.raw,
				});
			}

			let parsedBody = null;
			try {
				const contentType = response.headers.get("content-type") || "";
				if (contentType.includes("application/json")) {
					parsedBody = await response.json();
				} else {
					const txt = await response.text();
					try {
						parsedBody = txt ? JSON.parse(txt) : null;
					} catch {
						parsedBody = txt || null;
					}
				}
			} catch {
				parsedBody = null;
			}

			const normalized = {
				data:
					parsedBody && parsedBody.data !== undefined
						? parsedBody.data
						: parsedBody,
				meta: parsedBody && parsedBody.meta ? parsedBody.meta : null,
				message: parsedBody && parsedBody.message ? parsedBody.message : null,
				raw: parsedBody,
			};

			if (method === "GET") {
				responseCache.set(key, {
					expiresAt: Date.now() + CACHE_TTL_MS,
					data: normalized,
				});
			}

			return normalized;
		} catch (error) {
			console.error("API call failed:", error);
			if (error instanceof ApiError) throw error;

			// Enhanced error handling for network issues
			let message = "Network error";
			if (error.name === "TypeError" && error.message.includes("fetch")) {
				message =
					"Unable to connect to server. Please check your internet connection.";
			} else if (error.message?.includes("timeout")) {
				message = "Connection timeout. Please try again.";
			} else if (
				error.message?.includes("refused") ||
				error.message?.includes("ECONNREFUSED")
			) {
				message = "Server is unavailable. Please try again later.";
			} else if (error.message) {
				message = error.message;
			}

			throw new ApiError({
				message,
				raw: error,
			});
		} finally {
			if (method === "GET") inFlightRequests.delete(key);
		}
	})();

	if (method === "GET") inFlightRequests.set(key, promise);

	return promise;
};

const getAuthHeadersForFormData = () => {
	const token = localStorage.getItem("token");
	return {
		...(token && { Authorization: `Bearer ${token}` }),
	};
};

const apiCallWithFormData = async (endpoint, formData, options = {}) => {
	const url = `${API_BASE_URL}${endpoint}`;
	const config = {
		headers: getAuthHeadersForFormData(),
		credentials: options.credentials || "include",
		...options,
		body: formData,
	};

	try {
		const response = await fetch(url, config);

		if (!response.ok) {
			const parsed = await parseErrorBody(response);
			const errMsg =
				parsed.message ||
				(parsed.errors && parsed.errors.length
					? parsed.errors[0].message
					: null) ||
				`HTTP error! status: ${response.status}`;
			throw new ApiError({
				message: errMsg,
				status: response.status,
				errors: parsed.errors,
				raw: parsed.raw,
			});
		}

		let parsedBody = null;
		try {
			const contentType = response.headers.get("content-type") || "";
			if (contentType.includes("application/json")) {
				parsedBody = await response.json();
			} else {
				const txt = await response.text();
				try {
					parsedBody = txt ? JSON.parse(txt) : null;
				} catch {
					parsedBody = txt || null;
				}
			}
		} catch {
			parsedBody = null;
		}

		return {
			data:
				parsedBody && parsedBody.data !== undefined
					? parsedBody.data
					: parsedBody,
			meta: parsedBody && parsedBody.meta ? parsedBody.meta : null,
			message: parsedBody && parsedBody.message ? parsedBody.message : null,
			raw: parsedBody,
		};
	} catch (error) {
		console.error("API call failed:", error);
		if (error instanceof ApiError) throw error;

		// Enhanced error handling for network issues
		let message = "Network error";
		if (error.name === "TypeError" && error.message.includes("fetch")) {
			message =
				"Unable to connect to server. Please check your internet connection.";
		} else if (error.message?.includes("timeout")) {
			message = "Connection timeout. Please try again.";
		} else if (
			error.message?.includes("refused") ||
			error.message?.includes("ECONNREFUSED")
		) {
			message = "Server is unavailable. Please try again later.";
		} else if (error.message) {
			message = error.message;
		}

		throw new ApiError({
			message,
			raw: error,
		});
	}
};

export const productsApi = {
	getProducts: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();

		return apiCall(`/products?${queryString}`);
	},

	getProduct: (id) => apiCall(`/products/${id}`).then((r) => r.data || null),

	getProductBatches: (id, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiCall(
			`/products/${id}/batches${queryString ? `?${queryString}` : ""}`
		);
	},

	getProductBatch: (productId, batchId) =>
		apiCall(`/products/${productId}/batches/${batchId}`).then(
			(r) => r.data || null
		),

	createProduct: (productData) =>
		apiCallWithFormData("/products", productData, {
			method: "POST",
		}),

	updateProduct: (id, productData) =>
		apiCall(`/products/${id}`, {
			method: "PATCH",
			body: JSON.stringify(productData),
		}).then((r) => r),

	deleteProduct: (id) =>
		apiCall(`/products/${id}`, {
			method: "DELETE",
		}).then((r) => r),

	uploadProductImages: async (id, formData) => {
		const res = await apiCallWithFormData(`/products/${id}/images`, formData, {
			method: "POST",
		});
		clearCacheForPrefix(`/products/${id}`);
		clearCacheForPrefix(`/products`);
		return res;
	},

	deleteProductImage: async (productId, imgId) => {
		const res = await apiCall(`/products/${productId}/images/${imgId}`, {
			method: "DELETE",
		});
		clearCacheForPrefix(`/products/${productId}`);
		clearCacheForPrefix(`/products`);
		return res;
	},

	addProductStock: async (id, stockData) => {
		const res = await apiCall(`/products/${id}/stock`, {
			method: "POST",
			body: JSON.stringify(stockData),
		});
		clearCacheForPrefix(`/products/${id}`);
		clearCacheForPrefix(`/products`);
		return res;
	},

	updateProductBatch: async (productId, batchId, batchData) => {
		const res = await apiCall(`/products/${productId}/batches/${batchId}`, {
			method: "PATCH",
			body: JSON.stringify(batchData),
		});
		clearCacheForPrefix(`/products/${productId}`);
		clearCacheForPrefix(`/products`);
		return res;
	},

	getProductImages: (id) =>
		apiCall(`/products/${id}/images`).then((r) => r.data || []),

	updateProductImages: async (id, formData) => {
		const res = await apiCallWithFormData(`/products/${id}/images`, formData, {
			method: "PATCH",
		});
		clearCacheForPrefix(`/products/${id}`);
		clearCacheForPrefix(`/products`);
		return res;
	},
};

export const categoriesApi = {
	getCategories: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();

		return apiCall(`/categories?${queryString}`);
	},

	getCategory: (id) => apiCall(`/categories/${id}`).then((r) => r.data || null),

	createCategory: (categoryData) =>
		apiCall("/categories", {
			method: "POST",
			body: JSON.stringify(categoryData),
		}),

	updateCategory: (id, categoryData) =>
		apiCall(`/categories/${id}`, {
			method: "PATCH",
			body: JSON.stringify(categoryData),
		}),

	deleteCategory: (id) =>
		apiCall(`/categories/${id}`, {
			method: "DELETE",
		}),

	uploadCategoryImage: async (id, formData) => {
		const res = await apiCallWithFormData(`/categories/${id}/image`, formData, {
			method: "PUT",
		});
		clearCacheForPrefix(`/categories/${id}`);
		clearCacheForPrefix(`/categories`);
		return res;
	},

	getCategoryImage: (id) =>
		apiCall(`/categories/${id}/image`).then((r) => r.data || null),

	deleteCategoryImage: async (id) => {
		const res = await apiCall(`/categories/${id}/image`, { method: "DELETE" });
		clearCacheForPrefix(`/categories/${id}`);
		clearCacheForPrefix(`/categories`);
		return res;
	},
};

export const usersApi = {
	getUsers: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiCall(`/users?${queryString}`);
	},

	getCurrentUser: () => apiCall("/users/me").then((r) => r.data || null),

	updateCurrentUser: (userData) =>
		apiCall("/users/me", {
			method: "PATCH",
			body: JSON.stringify(userData),
		}),

	getUser: (id) => apiCall(`/users/${id}`).then((r) => r.data || null),

	approveUser: (id, roleId) =>
		apiCall(`/users/${id}/approve`, {
			method: "PATCH",
			body: JSON.stringify({ roleId }),
		}),

	uploadCurrentUserImage: async (formData) => {
		const res = await apiCallWithFormData(`/users/me/image`, formData, {
			method: "PUT",
		});
		clearCacheForPrefix(`/users/me`);
		clearCacheForPrefix(`/users`);
		return res;
	},

	getCurrentUserImage: () => apiCall(`/users/me/image`),

	deleteCurrentUserImage: async () => {
		const res = await apiCall(`/users/me/image`, { method: "DELETE" });
		clearCacheForPrefix(`/users/me`);
		clearCacheForPrefix(`/users`);
		return res;
	},
};

export const stockMovementsApi = {
	getStockMovements: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiCall(`/stock-movements?${queryString}`);
	},
};

export const salesApi = {
	commitSales: (salesData) =>
		apiCall("/sales/commit", {
			method: "POST",
			body: JSON.stringify(salesData),
		}),
};

export const rolesApi = {
	getRoles: () => apiCall("/roles"),
	getRole: (id) => apiCall(`/roles/${id}`).then((r) => r.data || null),
	updateRolePermissions: (id, permissionIds) =>
		apiCall(`/roles/${id}/permissions`, {
			method: "PATCH",
			body: JSON.stringify({ permissionIds }),
		}).then((r) => r.data || null),
};

export const auditLogsApi = {
	getAuditLogs: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiCall(`/audit-logs?${queryString}`);
	},
	getEntityCreator: (entity, entityId) => {
		return apiCall(`/audit-logs/creator/${entity}/${entityId}`);
	},
};

export const accessPermissionsApi = {
	getAccessPermissions: () => apiCall("/access-permissions"),

	getAccessPermission: (id) =>
		apiCall(`/access-permissions/${id}`).then((r) => r.data || null),
};

export const clearAllCaches = () => {
	responseCache.clear();
	inFlightRequests.clear();
};

export const authApi = {
	logout: () =>
		apiCall("/auth/logout", {
			method: "POST",
			credentials: "include",
		}),

	login: (credentials) =>
		apiCall("/auth/login", {
			method: "POST",
			body: JSON.stringify(credentials),
			credentials: "include",
		}),

	register: (userData) =>
		apiCall("/auth/register", {
			method: "POST",
			body: JSON.stringify(userData),
			credentials: "include",
		}),

	refresh: () =>
		apiCall("/auth/refresh", {
			method: "POST",
			credentials: "include",
		}),
};
