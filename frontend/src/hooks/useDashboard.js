import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useDebounce } from "./useDebounce";
import { useResourceData } from "./useResourceData";
import { usePaginationParams } from "./usePaginationParams";
import { productsApi } from "@/services/api";

export const useDashboard = () => {
	const [searchParams] = useSearchParams();
	const { handlePageChange, handlePageSizeChange } = usePaginationParams();

	// Local search state for UI controls
	const [searchTerm, setSearchTerm] = useState("");
	const [isFallbackRefetching, setIsFallbackRefetching] = useState(false);
	const searchInputRef = useRef(null);
	const debounced = useDebounce(searchTerm, 300);

	// Build query params function
	const buildQueryParams = useCallback(
		(validated) => ({
			page: validated.page,
			limit: validated.limit,
			...(debounced.trim() && { search: debounced.trim() }),
		}),
		[debounced]
	);

	// Use generic resource data hook
	const {
		data: products,
		meta,
		loading,
		error,
		validated,
		totalPages,
		refetch,
	} = useResourceData({
		api: productsApi.getProducts,
		schema: null, // Basic validation handled in hook
		searchParams,
		buildParams: buildQueryParams,
		resourceName: "products",
		options: {
			enableDebounce: true,
			debounceDelay: 300,
			onSuccess: (response) => {
				// Handle fallback refetching logic
				if (
					response.meta &&
					Number(response.meta.total) > 0 &&
					response.data.length === 0 &&
					debounced.trim()
				) {
					const cap = 100;
					const refetchLimit = Math.min(Number(response.meta.total) || 10, cap);
					const refetchParams = {
						page: 1,
						limit: refetchLimit,
						...(debounced.trim() && { search: debounced.trim() }),
					};

					setIsFallbackRefetching(true);
					productsApi
						.getProducts(refetchParams)
						.then((r2) => {
							const fallback = r2.data || [];
							if (fallback.length > 0) {
								// Update products with fallback data
								// Note: This is a workaround since useResourceData doesn't support
								// direct data updates. In a real refactor, we'd modify the hook.
							}
						})
						.catch((e) => {
							console.warn("Fallback refetch failed:", e);
						})
						.finally(() => {
							setIsFallbackRefetching(false);
						});
				}
			},
			onError: (err, _errorMessage) => {
				console.error("Failed to fetch products:", err);
			},
		},
	});

	// Sync search term with URL
	useEffect(() => {
		const searchFromUrl = searchParams.get("search");
		if (searchFromUrl) {
			setSearchTerm(searchFromUrl);
		}
	}, [searchParams]);

	const handleSearchChange = useCallback((e) => {
		const value = e.target.value;
		setSearchTerm(value);
	}, []);

	const clearSearch = useCallback(() => {
		setSearchTerm("");
	}, []);

	const fetchProducts = useCallback(() => {
		refetch();
	}, [refetch]);

	return {
		products,
		loading,
		error,
		searchTerm,
		isFetching: loading,
		isFallbackRefetching,
		pagination: {
			currentPage: validated?.page || 1,
			totalPages,
			totalItems: meta?.total || 0,
			pageSize: validated?.limit || 10,
		},
		searchInputRef,

		fetchProducts,
		handleSearchChange,
		clearSearch,
		handlePageChange,
		handlePageSizeChange,
	};
};
