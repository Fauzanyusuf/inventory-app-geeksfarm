import { useState, useCallback } from "react";
import { ApiError } from "@/utils/apiError";

export const useErrorHandler = (initialState = null) => {
	const [error, setError] = useState(initialState);
	const [fieldErrors, setFieldErrors] = useState({});

	const handleError = useCallback((error, options = {}) => {
		const {
			showToast = false,
			logError = true,
			field = null,
			fallbackMessage = "An error occurred",
		} = options;

		let errorMessage = fallbackMessage;

		if (error instanceof ApiError) {
			errorMessage = error.message;

			// Handle field-specific errors
			if (error.errors && error.errors.length > 0) {
				const fieldErrorMap = {};
				error.errors.forEach((err) => {
					if (err.field) {
						fieldErrorMap[err.field] = err.message;
					}
				});

				if (Object.keys(fieldErrorMap).length > 0) {
					setFieldErrors(fieldErrorMap);
					return; // Don't set global error if we have field errors
				}
			}
		} else if (error instanceof Error) {
			errorMessage = error.message;
		} else if (typeof error === "string") {
			errorMessage = error;
		}

		if (logError) {
			console.error("Error handled:", error);
		}

		if (field) {
			setFieldErrors((prev) => ({ ...prev, [field]: errorMessage }));
		} else {
			setError(errorMessage);
		}

		if (showToast) {
			// TODO: Integrate with toast system when available
			console.log("Toast:", errorMessage);
		}
	}, []);

	const clearError = useCallback((field = null) => {
		if (field) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		} else {
			setError(null);
		}
	}, []);

	const clearAllErrors = useCallback(() => {
		setError(null);
		setFieldErrors({});
	}, []);

	const getFieldError = useCallback(
		(field) => {
			return fieldErrors[field] || null;
		},
		[fieldErrors]
	);

	const hasErrors = useCallback(() => {
		return error !== null || Object.keys(fieldErrors).length > 0;
	}, [error, fieldErrors]);

	const withErrorHandling = useCallback(
		async (asyncFn, options = {}) => {
			try {
				clearAllErrors();
				return await asyncFn();
			} catch (error) {
				handleError(error, options);
				throw error;
			}
		},
		[handleError, clearAllErrors]
	);

	return {
		error,
		fieldErrors,
		handleError,
		clearError,
		clearAllErrors,
		getFieldError,
		hasErrors,
		withErrorHandling,
	};
};
