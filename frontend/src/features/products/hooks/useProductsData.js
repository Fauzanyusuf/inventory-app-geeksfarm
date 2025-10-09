import { useState, useEffect, useCallback } from "react";
import { productsApi } from "@/services/api";
import { getErrorMessage } from "@/utils/errorUtils";
import { productListQuerySchema } from "@/validation/product-validation";

/**
 * Custom hook for fetching products data
 * Handles loading states, error handling, and data fetching
 */
export const useProductsData = (searchParams) => {
	const [products, setProducts] = useState([]);
	const [meta, setMeta] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [validated, setValidated] = useState(null);

	// Build API query params from validated data
	const buildQueryParams = useCallback(
		(validated) => ({
			page: validated.page,
			limit: validated.limit,
			...(validated.search && { search: validated.search }),
			...(validated.category &&
				validated.category !== "all" && { category: validated.category }),
			...(validated.minPrice !== undefined && { minPrice: validated.minPrice }),
			...(validated.maxPrice !== undefined && { maxPrice: validated.maxPrice }),
			sortBy: validated.sortBy,
			sortOrder: validated.sortOrder,
		}),
		[]
	);

	// Fetch products with error handling
	const fetchProducts = useCallback(async (params, signal) => {
		setLoading(true);
		try {
			const res = await productsApi.getProducts(params, { signal });
			setProducts(res?.data || []);
			setMeta(res?.meta || null);
			setError("");
		} catch (err) {
			if (err.name !== "AbortError") {
				setError(getErrorMessage(err, "products", "load"));
			}
		} finally {
			setLoading(false);
		}
	}, []);

	// Effect to validate params and fetch products
	useEffect(() => {
		const raw = Object.fromEntries(searchParams.entries());
		const parsed = productListQuerySchema.safeParse(raw);

		if (!parsed.success) {
			setValidated(null);
			setError("Invalid query parameters");
			return;
		}

		setValidated(parsed.data);
		const params = buildQueryParams(parsed.data);
		const controller = new AbortController();
		fetchProducts(params, controller.signal);

		return () => controller.abort();
	}, [searchParams, fetchProducts, buildQueryParams]);

	// Calculate total pages
	const totalPages =
		meta && validated?.limit
			? Math.max(
					1,
					Math.ceil((meta.total || meta.totalItems || 0) / validated.limit)
			  )
			: 1;

	return {
		products,
		meta,
		loading,
		error,
		validated,
		totalPages,
	};
};
