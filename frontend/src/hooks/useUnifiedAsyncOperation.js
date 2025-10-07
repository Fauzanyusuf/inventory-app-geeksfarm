import { useState, useCallback } from "react";
import { ApiError } from "@/utils/apiError";

/**
 * Unified hook for async operations that consolidates loading, error, and success states
 * Combines useAsyncOperation and useErrorHandler functionality
 */
export const useAsyncOperation = (initialState = false) => {
	const [loading, setLoading] = useState(initialState);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);
	const [fieldErrors, setFieldErrors] = useState({});

	const startOperation = useCallback(() => {
		setLoading(true);
		setError(null);
		setSuccess(false);
		setFieldErrors({});
	}, []);

	const stopOperation = useCallback(() => {
		setLoading(false);
	}, []);

	const setOperationError = useCallback((errorMessage) => {
		setLoading(false);
		setError(errorMessage);
		setSuccess(false);
	}, []);

	const setOperationSuccess = useCallback(
		(message = "Operation completed successfully") => {
			setLoading(false);
			setError(null);
			setSuccess(message);

			// Auto-clear success message after 3 seconds
			setTimeout(() => {
				setSuccess(false);
			}, 3000);
		},
		[]
	);

	const handleError = useCallback(
		(error, options = {}) => {
			const { logError = true, fallbackMessage = "An error occurred" } =
				options;

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

					setFieldErrors(fieldErrorMap);
				}
			} else if (error?.message) {
				errorMessage = error.message;
			}

			setOperationError(errorMessage);

			if (logError) {
				console.error("Async operation error:", error);
			}
		},
		[setOperationError]
	);

	const executeOperation = useCallback(
		async (operation, options = {}) => {
			const {
				onSuccess,
				onError,
				successMessage = "Operation completed successfully",
			} = options;

			startOperation();

			try {
				const result = await operation();
				setOperationSuccess(successMessage);

				if (onSuccess) {
					onSuccess(result);
				}

				return result;
			} catch (err) {
				handleError(err, { onError });

				if (onError) {
					onError(err);
				}

				throw err;
			}
		},
		[startOperation, setOperationSuccess, handleError]
	);

	const clearError = useCallback(() => {
		setError(null);
		setFieldErrors({});
	}, []);

	const clearSuccess = useCallback(() => {
		setSuccess(false);
	}, []);

	const clearAll = useCallback(() => {
		setError(null);
		setSuccess(false);
		setFieldErrors({});
		setLoading(false);
	}, []);

	return {
		// State
		loading,
		error,
		success,
		fieldErrors,

		// Actions
		startOperation,
		stopOperation,
		setOperationError,
		setOperationSuccess,
		handleError,
		executeOperation,

		// Clear methods
		clearError,
		clearSuccess,
		clearAll,
	};
};
