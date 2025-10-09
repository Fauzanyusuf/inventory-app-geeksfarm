import { useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";

/**
 * Custom hook for managing URL parameters in ProductList
 * Provides utilities for updating search parameters with automatic page reset
 */
export const useProductListParams = () => {
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

			navigate(`?${newParams.toString()}`);
		},
		[searchParams, navigate]
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
			navigate(`?${newParams.toString()}`);
		},
		[searchParams, navigate]
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
			navigate(`?${newParams.toString()}`);
		},
		[searchParams, navigate]
	);

	return {
		searchParams,
		updateParams,
		updateParam,
		getParam,
		handlePageChange,
		handlePageSizeChange,
	};
};
