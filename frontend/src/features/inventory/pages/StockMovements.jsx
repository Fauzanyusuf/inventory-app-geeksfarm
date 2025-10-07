import { useCallback, useState, useRef } from "react";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import { stockMovementsApi } from "@/services/api";
import { formatDate } from "@/utils/format";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/shared/Pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const StockMovements = () => {
	const [filters, setFilters] = useState({
		productId: "",
		movementType: "all",
	});
	const debounceRef = useRef(null);

	const fetcher = useCallback(async (params) => {
		// Clean params
		const p = { ...params };
		Object.keys(p).forEach((k) => {
			if (p[k] === "" || p[k] == null || p[k] === "all") delete p[k];
		});

		// Validate productId if it exists - only send if it looks like a valid UUID
		if (p.productId) {
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(p.productId)) {
				// If productId doesn't look like a UUID, remove it to avoid API error
				delete p.productId;
			}
		}

		const res = await stockMovementsApi.getStockMovements(p);
		return res;
	}, []);

	const {
		data: movements,
		meta,
		loading,
		error,
		setPage,
		setPageSize,
		setFilters: setHookFilters,
	} = usePaginatedResource(fetcher, {
		initialPage: 1,
		initialPageSize: 10,
		initialFilters: filters,
	});

	// Keep local filters in sync with hook filters
	const handleFilterChange = (filterName, value) => {
		setFilters((prev) => ({ ...prev, [filterName]: value }));
		// debounce applying filters to the hook to avoid rapid API calls
		if (!debounceRef.current) debounceRef.current = {};
		const key = filterName;
		if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
		debounceRef.current[key] = setTimeout(() => {
			setHookFilters((prev) => ({ ...prev, [filterName]: value }));
			setPage(1);
			debounceRef.current[key] = null;
		}, 300);
	};

	const handlePageChange = (p) => setPage(p);
	const handlePageSizeChange = (size) => {
		setPageSize(size);
		setPage(1);
	};

	const getMovementTypeColor = (type) => {
		switch (type) {
			case "IN":
				return "bg-success text-success-foreground";
			case "OUT":
				return "bg-danger text-danger-foreground";
			case "ADJUSTMENT":
				return "bg-warning text-warning-foreground";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	return (
		<div className="form-container">
			{/* Main Content */}
			<div className="page-content">
				{/* Stock Movements */}
				<div className="page-content-header">
					<h3 className="page-title">Stock Movements ({meta.total || 0})</h3>
					<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
						Track inventory movements and stock changes.
					</p>
				</div>

				{/* Filters */}
				<div className="page-content-body">
					<h4 className="text-md font-medium text-card-foreground mb-4">
						Filters
					</h4>
					<div className="form-grid-2">
						<div>
							<Label
								htmlFor="movementType"
								className="block text-sm font-medium text-muted-foreground mb-2">
								Movement Type
							</Label>
							<Select
								value={filters.movementType || "all"}
								onValueChange={(value) =>
									handleFilterChange("movementType", value)
								}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All Types" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="IN">Stock In</SelectItem>
									<SelectItem value="OUT">Stock Out</SelectItem>
									<SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label
								htmlFor="productId"
								className="block text-sm font-medium text-muted-foreground mb-2">
								Product ID (Optional)
							</Label>
							<Input
								name="productId"
								type="text"
								id="productId"
								value={filters.productId}
								onChange={(e) =>
									handleFilterChange("productId", e.target.value)
								}
								placeholder="Enter product ID (UUID format)"
								className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-popover text-popover-foreground"
							/>
						</div>
					</div>

					{error && (
						<Alert variant="destructive" className="mt-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
				</div>

				<div className="border-t border-border flex-1 flex flex-col">
					{loading ? (
						<LoadingSpinner size="lg" text="Loading..." />
					) : movements && movements.length > 0 ? (
						<>
							<div className="flex-1 overflow-auto">
								<ul className="divide-y divide-border">
									{movements.map((movement) => (
										<li key={movement.id}>
											<div className="px-4 py-4 sm:px-6">
												<div className="flex items-center justify-between">
													<div className="flex items-center">
														<div className="flex-shrink-0">
															<span
																className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementTypeColor(
																	movement.movementType
																)}`}>
																{movement.movementType}
															</span>
														</div>
														<div className="ml-4">
															<div className="text-sm font-medium text-card-foreground">
																{movement.product?.name || "Unknown Product"}
															</div>
															<div className="text-sm text-muted-foreground">
																{movement.product?.barcode &&
																	`Barcode: ${movement.product.barcode}`}
															</div>
														</div>
													</div>
													<div className="text-right">
														<div className="text-sm font-medium text-card-foreground">
															Quantity: {movement.quantity > 0 ? "+" : ""}
															{movement.quantity}
														</div>
														<div className="text-sm text-muted-foreground">
															{formatDate(movement.createdAt)}
														</div>
														{movement.note && (
															<div className="text-xs text-muted-foreground mt-1">
																{movement.note}
															</div>
														)}
													</div>
												</div>
											</div>
										</li>
									))}
								</ul>
							</div>

							{/* Pagination */}
							<div className="bg-card px-4 py-3 border-t border-border sm:px-6 flex-shrink-0">
								<Pagination
									currentPage={meta.page}
									totalPages={meta.totalPages}
									onPageChange={handlePageChange}
									onPageSizeChange={handlePageSizeChange}
									pageSize={meta.limit}
									totalItems={meta.total}
								/>
							</div>
						</>
					) : (
						<div className="text-center py-12">
							<svg
								className="mx-auto h-12 w-12 text-muted-foreground"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6"
								/>
							</svg>
							<h3 className="mt-2 text-sm font-medium text-card-foreground">
								No stock movements found
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Stock movements will appear here as inventory changes occur.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default StockMovements;
