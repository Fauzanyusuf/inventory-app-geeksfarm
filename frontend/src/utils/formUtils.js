/**
 * Form utility functions for common form patterns
 * Consolidates form-related logic and validation helpers
 */

// Import the existing getErrorFromRHF function
export const getErrorFromRHF = (errorsObj, field) => {
	if (!errorsObj || !field) return null;
	return errorsObj[field]?.message || null;
};

/**
 * Create form field props for react-hook-form
 * @param {object} register - React Hook Form register function
 * @param {object} errors - React Hook Form errors object
 * @param {string} name - Field name
 * @param {object} options - Additional options
 * @returns {object} Form field props
 */
export const createFormFieldProps = (register, errors, name, options = {}) => {
	const error = getErrorFromRHF(errors, name);

	return {
		...register(name, options),
		error: error,
		hasError: !!error,
		...options,
	};
};

/**
 * Validate form data against schema
 * @param {object} data - Form data
 * @param {object} schema - Validation schema (zod)
 * @returns {object} Validation result
 */
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

/**
 * Reset form to initial values
 * @param {object} formMethods - React Hook Form methods
 * @param {object} initialValues - Initial form values
 */
export const resetForm = (formMethods, initialValues = {}) => {
	const { reset, setValue } = formMethods;

	// Reset all fields
	reset(initialValues);

	// Set individual values to ensure all fields are updated
	Object.entries(initialValues).forEach(([key, value]) => {
		setValue(key, value);
	});
};

/**
 * Get form submission handler
 * @param {Function} onSubmit - Submit handler function
 * @param {object} options - Options for the handler
 * @returns {Function} Form submission handler
 */
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
				console.log("Form submitted successfully");
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

/**
 * Create form validation rules
 * @param {object} rules - Validation rules object
 * @returns {object} React Hook Form validation rules
 */
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

/**
 * Format form data for API submission
 * @param {object} data - Form data
 * @param {object} mapping - Field mapping object
 * @returns {object} Formatted data
 */
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

/**
 * Create form field error display
 * @param {string} error - Error message
 * @param {string} className - Additional CSS classes
 * @returns {object|null} Error display object
 */
export const createFieldError = (error, className = "") => {
	if (!error) return null;

	return {
		message: error,
		className: `text-sm text-destructive ${className}`,
	};
};

/**
 * Check if form has any errors
 * @param {object} errors - React Hook Form errors object
 * @returns {boolean} True if form has errors
 */
export const hasFormErrors = (errors) => {
	return Object.keys(errors).length > 0;
};

/**
 * Get all form errors as array
 * @param {object} errors - React Hook Form errors object
 * @returns {Array} Array of error messages
 */
export const getAllFormErrors = (errors) => {
	const errorMessages = [];

	Object.entries(errors).forEach(([field, error]) => {
		if (error && error.message) {
			errorMessages.push(`${field}: ${error.message}`);
		}
	});

	return errorMessages;
};

/**
 * Create form field configuration
 * @param {object} props - Field props
 * @returns {object} Form field configuration
 */
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

/**
 * Create form section configuration
 * @param {object} props - Section props
 * @returns {object} Form section configuration
 */
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
