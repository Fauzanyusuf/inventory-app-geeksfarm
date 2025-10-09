import { useState, useEffect } from "react";
import { categoriesApi } from "@/services/api";
import { getErrorMessage } from "@/utils/errorUtils";
import { CATEGORY_LIMIT } from "@/features/products/constants/product-list-constants";

/**
 * Shared hook for fetching categories data
 * Handles loading categories for filter dropdowns and other uses
 *
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Limit for categories (default: CATEGORY_LIMIT)
 * @param {boolean} options.enabled - Whether to fetch categories (default: true)
 * @returns {Object} Categories data and state
 */
export const useCategoriesData = (options = {}) => {
	const { limit = CATEGORY_LIMIT, enabled = true } = options;

	const [categories, setCategories] = useState([]);
	const [categoriesError, setCategoriesError] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!enabled) return;

		const controller = new AbortController();
		setLoading(true);

		(async () => {
			try {
				const res = await categoriesApi.getCategories(
					{ limit },
					{ signal: controller.signal }
				);
				setCategories(res?.data || []);
				setCategoriesError("");
			} catch (err) {
				if (err.name !== "AbortError") {
					console.error("Failed to load categories:", err.message);
					setCategoriesError(getErrorMessage(err, "categories", "load"));
				}
			} finally {
				setLoading(false);
			}
		})();

		return () => controller.abort();
	}, [limit, enabled]);

	return {
		categories,
		categoriesError,
		loading,
		refetch: () => {
			if (enabled) {
				setCategoriesError("");
				// Trigger re-fetch by updating a dependency
				setCategories([]);
			}
		},
	};
};
