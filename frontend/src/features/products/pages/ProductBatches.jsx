import { useParams, useSearchParams } from "react-router";
import { productsApi } from "@/services/api";
import { formatDate } from "@/utils/format";
import { useResourceData } from "@/hooks/useResourceData";
import { usePaginationParams } from "@/hooks/usePaginationParams";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Pagination from "@/components/shared/Pagination";

const ProductBatches = () => {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const { handlePageChange, handlePageSizeChange } = usePaginationParams();

	// Build query params function
	const buildQueryParams = (validated) => ({
		page: validated.page,
		limit: validated.limit,
	});

	// Use generic resource data hook
	const {
		data: batches,
		meta,
		loading,
		error,
	} = useResourceData({
		api: (params) => productsApi.getProductBatches(id, params),
		schema: null, // Basic validation handled in hook
		searchParams,
		buildParams: buildQueryParams,
		resourceName: "batches",
		options: {
			onError: (err, _errorMessage) => {
				console.error("Failed to fetch batches:", err);
			},
		},
	});

	if (loading) {
		return <LoadingSpinner size="lg" text="Loading batches..." fullScreen />;
	}

	return (
		<div className="form-container">
			{/* Main Content */}
			<div className="page-content">
				{/* Product Batches */}
				<div className="page-content-header">
					<h3 className="page-title">Product Batches ({meta?.total || 0})</h3>
					<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
						Track product batch information and inventory details.
					</p>
				</div>

				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className="border-t border-border flex-1 flex flex-col">
					{batches.length === 0 ? (
						<div className="text-center py-12">
							<div className="text-muted-foreground">No batches found</div>
						</div>
					) : (
						<>
							<div className="flex-1 overflow-auto">
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-border">
										<thead className="bg-muted/50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
													Batch ID
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
													Quantity
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
													Cost
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
													Status
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
													Received
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
													Expired
												</th>
											</tr>
										</thead>
										<tbody className="bg-card divide-y divide-border">
											{batches.map((b) => (
												<tr key={b.id} className="hover:bg-muted/50">
													<td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-card-foreground">
														{b.id.slice(-8)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
														{b.quantity}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
														{b.costPrice}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
														{b.status}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
														{formatDate(b.receivedAt)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
														{b.expiredAt ? formatDate(b.expiredAt) : "N/A"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							{/* Pagination */}
							<div className="bg-card px-4 py-3 border-t border-border sm:px-6 flex-shrink-0">
								<Pagination
									currentPage={meta?.page || 1}
									totalPages={meta?.totalPages || 1}
									totalItems={meta?.total || 0}
									pageSize={meta?.limit || 10}
									onPageChange={handlePageChange}
									onPageSizeChange={handlePageSizeChange}
								/>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProductBatches;
