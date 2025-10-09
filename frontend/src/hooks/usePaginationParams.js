import { useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";

/**
 * Generic hook for managing URL parameters with pagination
 * Provides utilities for updating search parameters with automatic page reset
 *
 * @param {string} basePath - Base path for navigation (optional)
 * @returns {Object} Pagination parameter utilities
 */
export const usePaginationParams = (basePath = "") => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	/**
	 * Updates URL parameters and optionally resets page to 1
	 * @param {Object} updates - Object with parameter updates
	 * @param {boolean} resetPage - Whether to reset page to 1 (default: true)
	 */
	const updateParams = useCallback(
		(updates, resetPage = true) => {
			const newParams = new URLSearchParams(searchParams);

			Object.entries(updates).forEach(([key, value]) => {
				if (
					value === undefined ||
					value === null ||
					value === "" ||
					value === "all"
				) {
					newParams.delete(key);
				} else {
					newParams.set(key, String(value));
				}
			});

			if (resetPage) {
				newParams.delete("page");
			}

			const queryString = newParams.toString();
			const url = basePath ? `${basePath}?${queryString}` : `?${queryString}`;
			navigate(url);
		},
		[searchParams, navigate, basePath]
	);

	/**
	 * Updates a single parameter
	 * @param {string} key - Parameter key
	 * @param {string|number} value - Parameter value
	 * @param {boolean} resetPage - Whether to reset page to 1 (default: true)
	 */
	const updateParam = useCallback(
		(key, value, resetPage = true) => {
			updateParams({ [key]: value }, resetPage);
		},
		[updateParams]
	);

	/**
	 * Gets current parameter value with fallback
	 * @param {string} key - Parameter key
	 * @param {string} fallback - Fallback value
	 * @returns {string} Parameter value or fallback
	 */
	const getParam = useCallback(
		(key, fallback = "") => {
			const value = searchParams.get(key);
			return value !== null ? value : fallback;
		},
		[searchParams]
	);

	/**
	 * Handles pagination changes
	 * @param {number} page - Page number
	 */
	const handlePageChange = useCallback(
		(page) => {
			const newParams = new URLSearchParams(searchParams);
			if (page === 1) {
				newParams.delete("page");
			} else {
				newParams.set("page", String(page));
			}

			const queryString = newParams.toString();
			const url = basePath ? `${basePath}?${queryString}` : `?${queryString}`;
			navigate(url);
		},
		[searchParams, navigate, basePath]
	);

	/**
	 * Handles page size changes
	 * @param {number} pageSize - Page size
	 */
	const handlePageSizeChange = useCallback(
		(pageSize) => {
			const newParams = new URLSearchParams(searchParams);
			if (pageSize === 10) {
				newParams.delete("limit");
			} else {
				newParams.set("limit", String(pageSize));
			}
			newParams.delete("page"); // Reset to page 1

			const queryString = newParams.toString();
			const url = basePath ? `${basePath}?${queryString}` : `?${queryString}`;
			navigate(url);
		},
		[searchParams, navigate, basePath]
	);

	/**
	 * Clears all parameters except specified ones
	 * @param {Array} keepParams - Array of parameter keys to keep
	 */
	const clearParams = useCallback(
		(keepParams = []) => {
			const newParams = new URLSearchParams();

			keepParams.forEach((key) => {
				const value = searchParams.get(key);
				if (value !== null) {
					newParams.set(key, value);
				}
			});

			const queryString = newParams.toString();
			const url = basePath ? `${basePath}?${queryString}` : `?${queryString}`;
			navigate(url);
		},
		[searchParams, navigate, basePath]
	);

	return {
		searchParams,
		updateParams,
		updateParam,
		getParam,
		handlePageChange,
		handlePageSizeChange,
		clearParams,
	};
};
