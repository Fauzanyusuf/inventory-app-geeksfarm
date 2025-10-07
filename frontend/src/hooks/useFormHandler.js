import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/utils/apiError";
import { normalizeServerField } from "@/utils/normalizeServerField";

export const useFormHandler = (schema, options = {}) => {
	const {
		defaultValues = {},
		mode = "onChange",
		resetOnSuccess = true,
		normalizeData = true,
	} = options;

	// Form state
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	// React Hook Form setup
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues,
		mode,
	});

	const { handleSubmit, setValue, setError: setFieldError, reset } = form;

	// Unified error handler
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

					// Set field errors
					Object.entries(fieldErrorMap).forEach(([field, message]) => {
						setFieldError(field, { type: "server", message });
					});
				}
			} else if (error?.message) {
				errorMessage = error.message;
			}

			setError(errorMessage);
			setLoading(false);

			if (logError) {
				console.error("Form error:", error);
			}
		},
		[setFieldError]
	);

	// Success handler
	const handleSuccess = useCallback(
		(message = "Operation completed successfully", options = {}) => {
			const { resetForm = resetOnSuccess } = options;

			setSuccess(message);
			setError("");
			setLoading(false);

			if (resetForm) {
				reset();
			}

			// Auto-clear success message after 3 seconds
			setTimeout(() => {
				setSuccess("");
			}, 3000);
		},
		[reset, resetOnSuccess]
	);

	// Form submission handler
	const onSubmit = useCallback(
		async (data, submitFn, options = {}) => {
			const {
				onSuccess,
				onError,
				successMessage = "Operation completed successfully",
				normalize = normalizeData,
			} = options;

			setLoading(true);
			setError("");
			setSuccess("");

			try {
				// Normalize data if needed
				const processedData = normalize ? normalizeServerField(data) : data;

				const result = await submitFn(processedData);

				handleSuccess(successMessage);

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
		[handleError, handleSuccess, normalizeData]
	);

	// Load data into form
	const loadData = useCallback(
		(data) => {
			const normalizedData = normalizeData ? normalizeServerField(data) : data;

			Object.entries(normalizedData).forEach(([key, value]) => {
				setValue(key, value);
			});
		},
		[setValue, normalizeData]
	);

	// Clear form state
	const clearState = useCallback(() => {
		setError("");
		setSuccess("");
		setLoading(false);
	}, []);

	// Reset form and state
	const resetForm = useCallback(() => {
		reset();
		clearState();
	}, [reset, clearState]);

	return {
		// Form methods
		...form,
		handleSubmit,
		onSubmit,
		loadData,
		clearState,
		resetForm,

		// State
		error,
		success,
		loading,
		setError,
		setSuccess,
		setLoading,

		// Handlers
		handleError,
		handleSuccess,
	};
};
