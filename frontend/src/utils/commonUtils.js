export const debounce = (func, wait, immediate = false) => {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			timeout = null;
			if (!immediate) func(...args);
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func(...args);
	};
};

export const throttle = (func, limit) => {
	let inThrottle;
	return function executedFunction(...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
};

export const deepClone = (obj) => {
	if (obj === null || typeof obj !== "object") return obj;
	if (obj instanceof Date) return new Date(obj.getTime());
	if (obj instanceof Array) return obj.map((item) => deepClone(item));
	if (typeof obj === "object") {
		const clonedObj = {};
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				clonedObj[key] = deepClone(obj[key]);
			}
		}
		return clonedObj;
	}
};

export const isEmpty = (value) => {
	if (value === null || value === undefined) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === "object") return Object.keys(value).length === 0;
	return false;
};

export const generateId = (prefix = "id") => {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const capitalize = (str) => {
	if (!str || typeof str !== "string") return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toCamelCase = (str) => {
	if (!str || typeof str !== "string") return str;
	return str
		.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
			return index === 0 ? word.toLowerCase() : word.toUpperCase();
		})
		.replace(/\s+/g, "");
};

export const toKebabCase = (str) => {
	if (!str || typeof str !== "string") return str;
	return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
};

export const formatFileSize = (bytes, decimals = 2) => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const isValidEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const isValidUrl = (url) => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
};

export const getNestedProperty = (obj, path, defaultValue = undefined) => {
	const keys = path.split(".");
	let result = obj;

	for (const key of keys) {
		if (result === null || result === undefined || !(key in result)) {
			return defaultValue;
		}
		result = result[key];
	}

	return result;
};

export const setNestedProperty = (obj, path, value) => {
	const keys = path.split(".");
	const lastKey = keys.pop();
	let current = obj;

	for (const key of keys) {
		if (!(key in current) || typeof current[key] !== "object") {
			current[key] = {};
		}
		current = current[key];
	}

	current[lastKey] = value;
	return obj;
};

export const removeDuplicates = (array, key) => {
	if (!Array.isArray(array)) return array;

	if (key) {
		const seen = new Set();
		return array.filter((item) => {
			const value = item[key];
			if (seen.has(value)) {
				return false;
			}
			seen.add(value);
			return true;
		});
	}

	return [...new Set(array)];
};

export const groupBy = (array, key) => {
	if (!Array.isArray(array)) return {};

	return array.reduce((groups, item) => {
		const group = item[key];
		groups[group] = groups[group] || [];
		groups[group].push(item);
		return groups;
	}, {});
};

export const sortBy = (array, key, direction = "asc") => {
	if (!Array.isArray(array)) return array;

	return [...array].sort((a, b) => {
		const aVal = a[key];
		const bVal = b[key];

		if (aVal < bVal) return direction === "asc" ? -1 : 1;
		if (aVal > bVal) return direction === "asc" ? 1 : -1;
		return 0;
	});
};

export const delay = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
	try {
		return await fn();
	} catch (error) {
		if (retries > 0) {
			await new Promise((resolve) => setTimeout(resolve, delay));
			return retryWithBackoff(fn, retries - 1, delay * 2);
		}
		throw error;
	}
};

export const safeAsync = (fn, defaultValue = null) => {
	return async (...args) => {
		try {
			return await fn(...args);
		} catch (error) {
			console.error("Safe async error:", error);
			return defaultValue;
		}
	};
};

export const isBrowser = () => {
	return typeof window !== "undefined";
};

export const isDevelopment = () => {
	return process.env.NODE_ENV === "development";
};

export const getQueryParams = (url = null) => {
	if (!isBrowser()) return {};

	const urlObj = new URL(url || window.location.href);
	const params = {};

	urlObj.searchParams.forEach((value, key) => {
		params[key] = value;
	});

	return params;
};

export const buildQueryString = (params) => {
	const searchParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== null && value !== undefined && value !== "") {
			searchParams.append(key, value);
		}
	});

	return searchParams.toString();
};
