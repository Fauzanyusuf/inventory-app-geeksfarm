import { useState, useCallback, useRef, useEffect } from "react";
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

	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const timeoutRef = useRef(null);

	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues,
		mode,
	});

	const { handleSubmit, setValue, setError: setFieldError, reset } = form;

	const handleError = useCallback(
		(error, options = {}) => {
			const { logError = true, fallbackMessage = "An error occurred" } =
				options;

			let errorMessage = fallbackMessage;

			if (error instanceof ApiError) {
				errorMessage = error.message;

				if (error.errors && error.errors.length > 0) {
					const fieldErrorMap = {};
					error.errors.forEach((err) => {
						if (err.field) {
							fieldErrorMap[err.field] = err.message;
						}
					});

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

	const handleSuccess = useCallback(
		(message = "Operation completed successfully", options = {}) => {
			const { resetForm = resetOnSuccess } = options;

			setSuccess(message);
			setError("");
			setLoading(false);

			if (resetForm) {
				reset();
			}

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => {
				setSuccess("");
			}, 3000);
		},
		[reset, resetOnSuccess]
	);

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

	const loadData = useCallback(
		(data) => {
			const normalizedData = normalizeData ? normalizeServerField(data) : data;

			Object.entries(normalizedData).forEach(([key, value]) => {
				setValue(key, value);
			});
		},
		[setValue, normalizeData]
	);

	const clearState = useCallback(() => {
		setError("");
		setSuccess("");
		setLoading(false);
	}, []);

	const resetForm = useCallback(() => {
		reset();
		clearState();
	}, [reset, clearState]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return {
		...form,
		handleSubmit,
		onSubmit,
		loadData,
		clearState,
		resetForm,

		error,
		success,
		loading,
		setError,
		setSuccess,
		setLoading,

		handleError,
		handleSuccess,
	};
};
