import { useState, useEffect, useCallback } from "react";
import { stockMovementsApi } from "@/services/api";
import { getErrorMessage } from "@/utils/errorUtils";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * Custom hook for fetching stock movements data
 * Handles loading states, error handling, and data fetching
 */
export const useStockMovementsData = (searchParams) => {
	const [movements, setMovements] = useState([]);
	const [meta, setMeta] = useState(null);
	const [error, setError] = useState("");
	const [validated, setValidated] = useState(null);

	// Debounce search parameter
	const searchValue = searchParams.get("search") || "";
	const debouncedSearch = useDebounce(searchValue, 300);

	// Build API query params from validated data
	const buildQueryParams = useCallback(
		(validated) => ({
			page: validated.page,
			limit: validated.limit,
			...(validated.search && { search: validated.search }),
			...(validated.movementType &&
				validated.movementType !== "all" && {
					movementType: validated.movementType,
				}),
			...(validated.startDate && { startDate: validated.startDate }),
			...(validated.endDate && { endDate: validated.endDate }),
		}),
		[]
	);

	// Fetch stock movements with error handling
	const fetchStockMovements = useCallback(async (params) => {
		try {
			const res = await stockMovementsApi.getStockMovements(params);
			setMovements(res?.data || []);
			setMeta(res?.meta || null);
			setError("");
		} catch (err) {
			if (err.name !== "AbortError") {
				setError(getErrorMessage(err, "stock movements", "load"));
			}
		}
	}, []);

	// Effect to validate params and fetch stock movements
	useEffect(() => {
		const raw = Object.fromEntries(searchParams.entries());

		// Basic validation - we'll handle more complex validation in the backend
		const parsed = {
			page: raw.page ? parseInt(raw.page) : 1,
			limit: raw.limit ? parseInt(raw.limit) : 10,
			search: debouncedSearch,
			movementType: raw.movementType || "all",
			startDate: raw.startDate || "",
			endDate: raw.endDate || "",
		};

		setValidated(parsed);
		const params = buildQueryParams(parsed);
		const controller = new AbortController();
		fetchStockMovements(params, controller.signal);

		return () => controller.abort();
	}, [searchParams, debouncedSearch, fetchStockMovements, buildQueryParams]);

	// Calculate total pages
	const totalPages =
		meta && validated?.limit
			? Math.max(
					1,
					Math.ceil((meta.total || meta.totalItems || 0) / validated.limit)
			  )
			: 1;

	return {
		movements,
		meta,
		error,
		validated,
		totalPages,
	};
};
