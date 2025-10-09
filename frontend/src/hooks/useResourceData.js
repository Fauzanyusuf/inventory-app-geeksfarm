import { useState, useEffect, useCallback } from "react";
import { getErrorMessage } from "@/utils/errorUtils";
import { useDebounce } from "./useDebounce";

/**
 * Generic hook for fetching resource data with pagination, search, and filtering
 * Unifies the common pattern used across products, stock movements, categories, etc.
 *
 * @param {Object} config - Configuration object
 * @param {Function} config.api - API function to call for data fetching
 * @param {Object} config.schema - Zod schema for validation
 * @param {URLSearchParams} config.searchParams - URL search parameters
 * @param {Function} config.buildParams - Function to build query params from validated data
 * @param {string} config.resourceName - Name of the resource for error messages
 * @param {Object} config.options - Additional options
 * @param {boolean} config.options.enableDebounce - Enable debouncing for search (default: false)
 * @param {number} config.options.debounceDelay - Debounce delay in ms (default: 300)
 * @param {Function} config.options.onSuccess - Success callback
 * @param {Function} config.options.onError - Error callback
 * @returns {Object} Resource data and state
 */
export const useResourceData = ({
	api,
	schema,
	searchParams,
	buildParams,
	resourceName = "resource",
	options = {},
}) => {
	const {
		enableDebounce = false,
		debounceDelay = 300,
		onSuccess,
		onError,
	} = options;

	const [data, setData] = useState([]);
	const [meta, setMeta] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [validated, setValidated] = useState(null);

	// Debounce search if enabled
	const searchValue = searchParams.get("search") || "";
	const debouncedSearch = useDebounce(searchValue, debounceDelay);
	const finalSearchValue = enableDebounce ? debouncedSearch : searchValue;

	// Fetch data with error handling
	const fetchData = useCallback(
		async (params, signal) => {
			setLoading(true);
			try {
				const res = await api(params, { signal });
				setData(res?.data || []);
				setMeta(res?.meta || null);
				setError("");

				if (onSuccess) {
					onSuccess(res);
				}
			} catch (err) {
				if (err.name !== "AbortError") {
					const errorMessage = getErrorMessage(err, resourceName, "load");
					setError(errorMessage);

					if (onError) {
						onError(err, errorMessage);
					}
				}
			} finally {
				setLoading(false);
			}
		},
		[api, resourceName, onSuccess, onError]
	);

	// Effect to validate params and fetch data
	useEffect(() => {
		const raw = Object.fromEntries(searchParams.entries());

		let parsed;
		if (schema) {
			// Use Zod schema for validation
			const result = schema.safeParse(raw);
			if (!result.success) {
				setValidated(null);
				setError("Invalid query parameters");
				return;
			}
			parsed = result.data;
		} else {
			// Basic validation fallback
			parsed = {
				page: raw.page ? parseInt(raw.page) : 1,
				limit: raw.limit ? parseInt(raw.limit) : 10,
				search: finalSearchValue,
				...raw,
			};
		}

		setValidated(parsed);
		const params = buildParams(parsed);
		const controller = new AbortController();
		fetchData(params, controller.signal);

		return () => controller.abort();
	}, [searchParams, finalSearchValue, fetchData, buildParams, schema]);

	// Calculate total pages
	const totalPages =
		meta && validated?.limit
			? Math.max(
					1,
					Math.ceil((meta.total || meta.totalItems || 0) / validated.limit)
			  )
			: 1;

	return {
		data,
		meta,
		loading,
		error,
		validated,
		totalPages,
		// Additional utilities
		refetch: () => {
			if (validated) {
				const params = buildParams(validated);
				fetchData(params);
			}
		},
	};
};
