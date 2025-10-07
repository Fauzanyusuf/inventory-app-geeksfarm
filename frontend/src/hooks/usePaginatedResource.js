import { useState, useCallback, useEffect, useRef } from "react";
import { getErrorMessage } from "@/utils/errorUtils";

export function usePaginatedResource(fetcher, options = {}) {
	const {
		initialPage = 1,
		initialPageSize = 10,
		initialFilters = {},
		context = "data",
	} = options;

	const [data, setData] = useState([]);
	const [meta, setMeta] = useState({
		page: initialPage,
		limit: initialPageSize,
		total: 0,
		totalPages: 1,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [page, setPage] = useState(initialPage);
	const [pageSize, setPageSize] = useState(initialPageSize);
	const [filters, setFilters] = useState(initialFilters);

	const inFlightRef = useRef(false);
	const [refreshCounter, setRefreshCounter] = useState(0);

	const refresh = useCallback(() => {
		setRefreshCounter((c) => c + 1);
	}, []);

	const doFetch = useCallback(async () => {
		if (!fetcher) return;
		inFlightRef.current = true;
		setLoading(true);
		setError("");
		try {
			const params = { page, limit: pageSize, ...filters };
			const res = await fetcher(params);

			const items = res.data || res.items || [];
			setData(items);

			if (res.meta) {
				setMeta((m) => ({
					...m,
					page: res.meta.page || page,
					limit: res.meta.limit || pageSize,
					total: res.meta.total || res.meta.totalItems || m.total,
					totalPages: res.meta.totalPages || m.totalPages,
				}));
			}
		} catch (err) {
			console.error("usePaginatedResource fetch error", err);
			setError(getErrorMessage(err, context, "load"));
		} finally {
			inFlightRef.current = false;
			setLoading(false);
		}
	}, [fetcher, page, pageSize, filters, context]);

	useEffect(() => {
		doFetch();
	}, [doFetch, page, pageSize, filters, refreshCounter]);

	return {
		data,
		meta,
		loading,
		error,
		page,
		pageSize,
		setPage,
		setPageSize,
		setFilters,
		refresh,
	};
}
