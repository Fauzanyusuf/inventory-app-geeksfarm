/**
 * Data transformation and manipulation utilities
 * Consolidates common data processing patterns
 */

/**
 * Transform API response data to consistent format
 * @param {any} data - Raw API response data
 * @param {object} options - Transformation options
 * @returns {object} Transformed data
 */
export const transformApiResponse = (data, options = {}) => {
	const {
		normalizeFields = true,
		camelCase = true,
		removeNulls = false,
	} = options;

	if (!data) return data;

	let transformed = data;

	// Normalize field names if requested
	if (normalizeFields && typeof data === "object") {
		transformed = normalizeObjectFields(transformed, camelCase);
	}

	// Remove null values if requested
	if (removeNulls && typeof transformed === "object") {
		transformed = removeNullValues(transformed);
	}

	return transformed;
};

/**
 * Normalize object field names
 * @param {object} obj - Object to normalize
 * @param {boolean} camelCase - Whether to convert to camelCase
 * @returns {object} Normalized object
 */
export const normalizeObjectFields = (obj, camelCase = true) => {
	if (!obj || typeof obj !== "object") return obj;

	if (Array.isArray(obj)) {
		return obj.map((item) => normalizeObjectFields(item, camelCase));
	}

	const normalized = {};

	Object.entries(obj).forEach(([key, value]) => {
		const normalizedKey = camelCase ? toCamelCase(key) : key;
		normalized[normalizedKey] = normalizeObjectFields(value, camelCase);
	});

	return normalized;
};

/**
 * Remove null and undefined values from object
 * @param {object} obj - Object to clean
 * @returns {object} Cleaned object
 */
export const removeNullValues = (obj) => {
	if (!obj || typeof obj !== "object") return obj;

	if (Array.isArray(obj)) {
		return obj
			.map((item) => removeNullValues(item))
			.filter((item) => item !== null);
	}

	const cleaned = {};

	Object.entries(obj).forEach(([key, value]) => {
		if (value !== null && value !== undefined) {
			cleaned[key] = removeNullValues(value);
		}
	});

	return cleaned;
};

/**
 * Convert string to camelCase
 * @param {string} str - String to convert
 * @returns {string} CamelCase string
 */
const toCamelCase = (str) => {
	if (!str || typeof str !== "string") return str;
	return str
		.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
			return index === 0 ? word.toLowerCase() : word.toUpperCase();
		})
		.replace(/\s+/g, "");
};

/**
 * Create pagination metadata
 * @param {object} params - Pagination parameters
 * @returns {object} Pagination metadata
 */
export const createPaginationMeta = (params) => {
	const { page = 1, limit = 10, total = 0, ...otherParams } = params;

	const totalPages = Math.ceil(total / limit);
	const hasNextPage = page < totalPages;
	const hasPrevPage = page > 1;

	return {
		page: parseInt(page),
		limit: parseInt(limit),
		total: parseInt(total),
		totalPages,
		hasNextPage,
		hasPrevPage,
		...otherParams,
	};
};

/**
 * Transform paginated API response
 * @param {object} response - API response with pagination
 * @param {object} options - Transformation options
 * @returns {object} Transformed paginated response
 */
export const transformPaginatedResponse = (response, options = {}) => {
	const { dataKey = "data", metaKey = "meta" } = options;

	if (!response || typeof response !== "object") {
		return { data: [], meta: createPaginationMeta({}) };
	}

	const data = response[dataKey] || response.data || [];
	const meta = response[metaKey] || response.meta || {};

	return {
		data: Array.isArray(data) ? data : [],
		meta: createPaginationMeta(meta),
	};
};

/**
 * Create search filters object
 * @param {object} filters - Filter parameters
 * @returns {object} Formatted filters
 */
export const createSearchFilters = (filters) => {
	const formatted = {};

	Object.entries(filters).forEach(([key, value]) => {
		if (value !== null && value !== undefined && value !== "") {
			// Handle array values
			if (Array.isArray(value)) {
				if (value.length > 0) {
					formatted[key] = value;
				}
			} else {
				formatted[key] = value;
			}
		}
	});

	return formatted;
};

/**
 * Sort array of objects by multiple criteria
 * @param {Array} array - Array to sort
 * @param {Array} sortCriteria - Array of sort criteria objects
 * @returns {Array} Sorted array
 */
export const multiSort = (array, sortCriteria) => {
	if (!Array.isArray(array) || !Array.isArray(sortCriteria)) {
		return array;
	}

	return [...array].sort((a, b) => {
		for (const criteria of sortCriteria) {
			const { key, direction = "asc" } = criteria;
			const aVal = a[key];
			const bVal = b[key];

			if (aVal < bVal) return direction === "asc" ? -1 : 1;
			if (aVal > bVal) return direction === "asc" ? 1 : -1;
		}
		return 0;
	});
};

/**
 * Filter array of objects by multiple criteria
 * @param {Array} array - Array to filter
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered array
 */
export const multiFilter = (array, filters) => {
	if (!Array.isArray(array) || !filters || typeof filters !== "object") {
		return array;
	}

	return array.filter((item) => {
		return Object.entries(filters).every(([key, value]) => {
			const itemValue = item[key];

			// Handle different filter types
			if (typeof value === "string") {
				return (
					itemValue &&
					itemValue.toString().toLowerCase().includes(value.toLowerCase())
				);
			}

			if (typeof value === "number") {
				return itemValue === value;
			}

			if (Array.isArray(value)) {
				return value.includes(itemValue);
			}

			if (typeof value === "function") {
				return value(itemValue);
			}

			return itemValue === value;
		});
	});
};

/**
 * Create data export object
 * @param {Array} data - Data to export
 * @param {object} options - Export options
 * @returns {object} Export data
 */
export const createExportData = (data, options = {}) => {
	const {
		fields = null,
		format = "json",
		filename = "export",
		...otherOptions
	} = options;

	if (!Array.isArray(data)) {
		return { error: "Data must be an array" };
	}

	let exportData = data;

	// Filter fields if specified
	if (fields && Array.isArray(fields)) {
		exportData = data.map((item) => {
			const filtered = {};
			fields.forEach((field) => {
				if (Object.prototype.hasOwnProperty.call(item, field)) {
					filtered[field] = item[field];
				}
			});
			return filtered;
		});
	}

	return {
		data: exportData,
		format,
		filename,
		count: exportData.length,
		...otherOptions,
	};
};

/**
 * Validate data structure
 * @param {any} data - Data to validate
 * @param {object} schema - Validation schema
 * @returns {object} Validation result
 */
export const validateDataStructure = (data, schema) => {
	const errors = [];

	if (!schema || typeof schema !== "object") {
		return { valid: true, errors: [] };
	}

	Object.entries(schema).forEach(([key, rules]) => {
		const value = data[key];

		if (rules.required && (value === null || value === undefined)) {
			errors.push(`${key} is required`);
		}

		if (value !== null && value !== undefined) {
			if (rules.type && typeof value !== rules.type) {
				errors.push(`${key} must be of type ${rules.type}`);
			}

			if (rules.minLength && value.length < rules.minLength) {
				errors.push(`${key} must be at least ${rules.minLength} characters`);
			}

			if (rules.maxLength && value.length > rules.maxLength) {
				errors.push(`${key} must be at most ${rules.maxLength} characters`);
			}

			if (rules.pattern && !rules.pattern.test(value)) {
				errors.push(`${key} format is invalid`);
			}
		}
	});

	return {
		valid: errors.length === 0,
		errors,
	};
};

/**
 * Create data comparison result
 * @param {any} original - Original data
 * @param {any} modified - Modified data
 * @returns {object} Comparison result
 */
export const compareData = (original, modified) => {
	const changes = [];
	const added = [];
	const removed = [];

	if (typeof original !== "object" || typeof modified !== "object") {
		return { hasChanges: original !== modified, changes: [] };
	}

	// Check for changes in existing properties
	Object.keys(original).forEach((key) => {
		if (Object.prototype.hasOwnProperty.call(modified, key)) {
			if (original[key] !== modified[key]) {
				changes.push({
					field: key,
					original: original[key],
					modified: modified[key],
				});
			}
		} else {
			removed.push(key);
		}
	});

	// Check for added properties
	Object.keys(modified).forEach((key) => {
		if (!Object.prototype.hasOwnProperty.call(original, key)) {
			added.push(key);
		}
	});

	return {
		hasChanges: changes.length > 0 || added.length > 0 || removed.length > 0,
		changes,
		added,
		removed,
	};
};
