import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useDebounce } from "./useDebounce";
import { productsApi } from "@/services/api";

export const useDashboard = () => {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [isFetching, setIsFetching] = useState(false);
	const [initialLoad, setInitialLoad] = useState(true);
	const [isFallbackRefetching, setIsFallbackRefetching] = useState(false);

	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		pageSize: 10,
	});

	const searchInputRef = useRef(null);
	const [searchParams] = useSearchParams();
	const debounced = useDebounce(searchTerm, 300);

	useEffect(() => {
		const searchFromUrl = searchParams.get("search");
		if (searchFromUrl) {
			setSearchTerm(searchFromUrl);
			setPagination((prev) => ({ ...prev, currentPage: 1 }));
		}
	}, [searchParams]);

	const fetchProducts = useCallback(async () => {
		try {
			if (initialLoad) {
				setLoading(true);
			} else {
				setIsFetching(true);
			}

			const params = {
				page: pagination.currentPage,
				limit: pagination.pageSize,
				...(debounced.trim() && { search: debounced.trim() }),
			};

			const response = await productsApi.getProducts(params);
			let fetched = response.data || [];

			if (!response.meta && debounced && fetched.length > 0) {
				const q = debounced.trim().toLowerCase();
				fetched = fetched.filter((p) => {
					const name = (p.name || "").toLowerCase();
					const barcode = (p.barcode || "").toLowerCase();
					return name.includes(q) || barcode.includes(q);
				});
			}

			setProducts(fetched);

			if (
				response.meta &&
				Number(response.meta.total) > 0 &&
				fetched.length === 0
			) {
				const cap = 100;
				const refetchLimit = Math.min(Number(response.meta.total) || 10, cap);
				const refetchParams = {
					page: 1,
					limit: refetchLimit,
					...(debounced.trim() && { search: debounced.trim() }),
				};

				setIsFallbackRefetching(true);
				try {
					const r2 = await productsApi.getProducts(refetchParams);
					const fallback = r2.data || [];
					if (fallback.length > 0) {
						setProducts(fallback);
					}
				} catch (e) {
					console.warn("Fallback refetch failed:", e);
				} finally {
					setIsFallbackRefetching(false);
				}
			}

			if (response.meta) {
				setPagination((prev) => ({
					...prev,
					currentPage: response.meta.page || 1,
					totalPages: response.meta.totalPages || 1,
					totalItems: response.meta.total || 0,
					pageSize: response.meta.limit || 10,
				}));
			}
		} catch (err) {
			console.error("Failed to fetch products:", err);
			setError("Failed to load products");
		} finally {
			setLoading(false);
			setIsFetching(false);
			setInitialLoad(false);
		}
	}, [pagination.currentPage, pagination.pageSize, debounced, initialLoad]);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	const handleSearchChange = useCallback((e) => {
		const value = e.target.value;
		setSearchTerm(value);
		setPagination((prev) => ({ ...prev, currentPage: 1 }));
	}, []);

	const clearSearch = useCallback(() => {
		setSearchTerm("");
		setPagination((prev) => ({ ...prev, currentPage: 1 }));
	}, []);

	const handlePageChange = useCallback((page) => {
		setPagination((prev) => ({ ...prev, currentPage: page }));
	}, []);

	const handlePageSizeChange = useCallback((pageSize) => {
		setPagination((prev) => ({ ...prev, pageSize, currentPage: 1 }));
	}, []);

	return {
		products,
		loading,
		error,
		searchTerm,
		isFetching,
		isFallbackRefetching,
		pagination,
		searchInputRef,

		fetchProducts,
		handleSearchChange,
		clearSearch,
		handlePageChange,
		handlePageSizeChange,
	};
};
