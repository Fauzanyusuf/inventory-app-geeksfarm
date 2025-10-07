import { ApiError } from "./apiError";

export const ERROR_MESSAGES = {
	// Network errors
	NETWORK_ERROR:
		"Unable to connect to server. Please check your internet connection.",
	SERVER_UNAVAILABLE: "Server is unavailable. Please try again later.",
	CONNECTION_TIMEOUT: "Connection timeout. Please try again.",
	CONNECTION_REFUSED: "Connection refused. Server may be under maintenance.",

	// Generic errors
	UNKNOWN_ERROR: "An unknown error occurred.",
	LOADING_ERROR: "Failed to load data.",
	SAVE_ERROR: "Failed to save data.",
	DELETE_ERROR: "Failed to delete data.",
	UPDATE_ERROR: "Failed to update data.",

	// Specific resource errors
	PRODUCTS_LOAD_ERROR: "Failed to load products list.",
	PRODUCT_LOAD_ERROR: "Failed to load product details.",
	PRODUCT_SAVE_ERROR: "Failed to save product.",
	PRODUCT_DELETE_ERROR: "Failed to delete product.",

	CATEGORIES_LOAD_ERROR: "Failed to load categories list.",
	CATEGORY_LOAD_ERROR: "Failed to load category details.",
	CATEGORY_SAVE_ERROR: "Failed to save category.",
	CATEGORY_DELETE_ERROR: "Failed to delete category.",

	USERS_LOAD_ERROR: "Failed to load users list.",
	USER_LOAD_ERROR: "Failed to load user details.",
	USER_SAVE_ERROR: "Failed to save user.",
	USER_DELETE_ERROR: "Failed to delete user.",

	AUDIT_LOGS_LOAD_ERROR: "Failed to load audit logs.",
	STOCK_MOVEMENTS_LOAD_ERROR: "Failed to load stock movements.",
	ROLES_LOAD_ERROR: "Failed to load roles list.",
	PERMISSIONS_LOAD_ERROR: "Failed to load permissions list.",

	// Authentication errors
	AUTH_ERROR: "Authentication failed. Please login again.",
	PERMISSION_ERROR: "You don't have permission to perform this action.",
	SESSION_EXPIRED: "Session has expired. Please login again.",

	// Validation errors
	VALIDATION_ERROR: "The entered data is invalid.",
	REQUIRED_FIELD: "This field is required.",
	INVALID_FORMAT: "Invalid data format.",
	INVALID_EMAIL: "Invalid email format.",
	INVALID_URL: "Invalid URL format.",
	INVALID_UUID: "Invalid ID format.",

	// File upload errors
	FILE_TOO_LARGE: "File size is too large.",
	INVALID_FILE_TYPE: "File type is not supported.",
	UPLOAD_ERROR: "Failed to upload file.",

	// Barcode scanner errors
	CAMERA_ERROR: "Failed to access camera.",
	SCANNER_ERROR: "Failed to start barcode scanner.",
	SCANNER_STOP_ERROR: "Failed to stop scanner.",
};

export const ERROR_TYPES = {
	NETWORK: "NETWORK",
	SERVER: "SERVER",
	VALIDATION: "VALIDATION",
	AUTHENTICATION: "AUTHENTICATION",
	PERMISSION: "PERMISSION",
	FILE_UPLOAD: "FILE_UPLOAD",
	UNKNOWN: "UNKNOWN",
};

export const detectErrorType = (error) => {
	if (!error) return ERROR_TYPES.UNKNOWN;

	// Check for network errors
	if (error.name === "TypeError" && error.message.includes("fetch")) {
		return ERROR_TYPES.NETWORK;
	}

	if (
		error.message?.includes("NetworkError") ||
		error.message?.includes("Failed to fetch") ||
		error.message?.includes("Connection refused") ||
		error.message?.includes("timeout")
	) {
		return ERROR_TYPES.NETWORK;
	}

	// Check for server errors
	if (error instanceof ApiError) {
		if (error.status >= 500) return ERROR_TYPES.SERVER;
		if (error.status === 401) return ERROR_TYPES.AUTHENTICATION;
		if (error.status === 403) return ERROR_TYPES.PERMISSION;
		if (error.status === 422) return ERROR_TYPES.VALIDATION;
	}

	// Check for specific error messages
	if (error.message?.includes("camera") || error.message?.includes("scanner")) {
		return ERROR_TYPES.FILE_UPLOAD;
	}

	return ERROR_TYPES.UNKNOWN;
};

export const getErrorMessage = (error, context = null, action = "load") => {
	if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;

	const errorType = detectErrorType(error);

	// Handle network errors
	if (errorType === ERROR_TYPES.NETWORK) {
		if (error.message?.includes("timeout")) {
			return ERROR_MESSAGES.CONNECTION_TIMEOUT;
		}
		if (
			error.message?.includes("refused") ||
			error.message?.includes("ECONNREFUSED")
		) {
			return ERROR_MESSAGES.CONNECTION_REFUSED;
		}
		return ERROR_MESSAGES.NETWORK_ERROR;
	}

	// Handle server errors
	if (errorType === ERROR_TYPES.SERVER) {
		return ERROR_MESSAGES.SERVER_UNAVAILABLE;
	}

	// Handle authentication errors
	if (errorType === ERROR_TYPES.AUTHENTICATION) {
		return ERROR_MESSAGES.AUTH_ERROR;
	}

	// Handle permission errors
	if (errorType === ERROR_TYPES.PERMISSION) {
		return ERROR_MESSAGES.PERMISSION_ERROR;
	}

	// Handle validation errors
	if (errorType === ERROR_TYPES.VALIDATION) {
		return ERROR_MESSAGES.VALIDATION_ERROR;
	}

	// Handle specific context and action combinations
	if (context && action) {
		const key = `${context.toUpperCase()}_${action.toUpperCase()}_ERROR`;
		if (ERROR_MESSAGES[key]) {
			return ERROR_MESSAGES[key];
		}
	}

	// Use ApiError message if available
	if (error instanceof ApiError && error.message) {
		return error.message;
	}

	// Use error message if available
	if (error.message) {
		return error.message;
	}

	// Fallback to generic error
	return ERROR_MESSAGES.UNKNOWN_ERROR;
};

export const isNetworkError = (error) => {
	return detectErrorType(error) === ERROR_TYPES.NETWORK;
};

/**
 * Check if error is a server error
 * @param {Error|ApiError} error - Error object
 * @returns {boolean} True if server error
 */
export const isServerError = (error) => {
	return detectErrorType(error) === ERROR_TYPES.SERVER;
};

export const isRetryableError = (error) => {
	const errorType = detectErrorType(error);
	return errorType === ERROR_TYPES.NETWORK || errorType === ERROR_TYPES.SERVER;
};

export const getRetryDelay = (error, attempt = 0) => {
	const baseDelay = isNetworkError(error) ? 1000 : 2000;
	return baseDelay * Math.pow(2, attempt); // Exponential backoff
};

export const handleError = (error, options = {}) => {
	const { context = null, action = "load", logError = true } = options;

	const errorType = detectErrorType(error);
	const message = getErrorMessage(error, context, action);
	const isRetryable = isRetryableError(error);

	if (logError) {
		console.error(`Error in ${context || "unknown"} ${action}:`, {
			error,
			errorType,
			message,
			isRetryable,
		});
	}

	return {
		message,
		type: errorType,
		isRetryable,
		originalError: error,
	};
};

export const createErrorHandler = (
	context,
	action = "load",
	onError = null
) => {
	return (error) => {
		const result = handleError(error, { context, action });

		if (onError) {
			onError(result);
		}

		return result;
	};
};

export const withErrorHandling = async (operation, options = {}) => {
	const {
		context = "operation",
		action = "execute",
		fallbackValue = null,
		throwError = true,
	} = options;

	try {
		return await operation();
	} catch (error) {
		const result = handleError(error, { context, action });

		if (throwError) {
			throw new Error(result.message);
		}

		return fallbackValue;
	}
};
