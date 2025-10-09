export const getErrorFromRHF = (errorsObj, field) => {
	if (!errorsObj || !field) return null;
	return errorsObj[field]?.message || null;
};
export const createFormFieldProps = (register, errors, name, options = {}) => {
	const error = getErrorFromRHF(errors, name);

	return {
		...register(name, options),
		error: error,
		hasError: !!error,
		...options,
	};
};

export const validateFormData = (data, schema) => {
	try {
		const result = schema.parse(data);
		return { success: true, data: result, errors: null };
	} catch (error) {
		const fieldErrors = {};
		if (error.errors) {
			error.errors.forEach((err) => {
				if (err.path && err.path.length > 0) {
					fieldErrors[err.path[0]] = err.message;
				}
			});
		}
		return { success: false, data: null, errors: fieldErrors };
	}
};

export const resetForm = (formMethods, initialValues = {}) => {
	const { reset, setValue } = formMethods;

	// Reset all fields
	reset(initialValues);

	// Set individual values to ensure all fields are updated
	Object.entries(initialValues).forEach(([key, value]) => {
		setValue(key, value);
	});
};
export const createSubmitHandler = (onSubmit, options = {}) => {
	const { onSuccess, onError, showSuccess = true } = options;

	return async (data, event) => {
		try {
			const result = await onSubmit(data, event);

			if (onSuccess) {
				onSuccess(result);
			}

			if (showSuccess) {
				// TODO: Show success toast/notification
				// Success handled by caller
			}

			return result;
		} catch (error) {
			console.error("Form submission error:", error);

			if (onError) {
				onError(error);
			}

			throw error;
		}
	};
};

export const createValidationRules = (rules) => {
	const validationRules = {};

	Object.entries(rules).forEach(([field, rule]) => {
		if (typeof rule === "object") {
			validationRules[field] = rule;
		} else if (typeof rule === "string") {
			// Convert string rules to object format
			validationRules[field] = { required: rule };
		}
	});

	return validationRules;
};

export const formatFormDataForAPI = (data, mapping = {}) => {
	const formatted = {};

	Object.entries(data).forEach(([key, value]) => {
		const apiKey = mapping[key] || key;

		// Handle different data types
		if (value instanceof File) {
			formatted[apiKey] = value;
		} else if (value instanceof Date) {
			formatted[apiKey] = value.toISOString();
		} else if (typeof value === "string" && value.trim() === "") {
			// Skip empty strings unless explicitly mapped
			if (mapping[key] !== undefined) {
				formatted[apiKey] = null;
			}
		} else {
			formatted[apiKey] = value;
		}
	});

	return formatted;
};

export const createFieldError = (error, className = "") => {
	if (!error) return null;

	return {
		message: error,
		className: `text-sm text-destructive ${className}`,
	};
};

export const hasFormErrors = (errors) => {
	return Object.keys(errors).length > 0;
};

export const getAllFormErrors = (errors) => {
	const errorMessages = [];

	Object.entries(errors).forEach(([field, error]) => {
		if (error && error.message) {
			errorMessages.push(`${field}: ${error.message}`);
		}
	});

	return errorMessages;
};

export const createFormFieldConfig = ({
	name,
	label,
	type = "text",
	placeholder,
	required = false,
	disabled = false,
	className = "",
	register,
	errors,
	...props
}) => {
	const error = getErrorFromRHF(errors, name);

	return {
		name,
		label,
		type,
		placeholder,
		required,
		disabled,
		className: `space-y-2 ${className}`,
		error,
		hasError: !!error,
		inputClassName: `flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
			error ? "border-destructive focus-visible:ring-destructive" : ""
		}`,
		labelClassName: `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
			error ? "text-destructive" : ""
		}`,
		register: register(name),
		...props,
	};
};

export const createFormSectionConfig = ({
	title,
	description,
	className = "",
}) => {
	return {
		title,
		description,
		className: `space-y-4 ${className}`,
		headerClassName: "space-y-1",
		titleClassName: "text-lg font-medium",
		descriptionClassName: "text-sm text-muted-foreground",
	};
};
