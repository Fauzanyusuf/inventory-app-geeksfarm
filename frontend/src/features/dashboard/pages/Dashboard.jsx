import { useCallback, useTransition } from "react";
import { useNavigate } from "react-router";
import { useDashboard } from "@/hooks/useDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Pagination from "@/components/shared/Pagination";
import { Label } from "@/components/ui/label";
import ProductCard from "@/components/shared/ProductCard";
import SearchInput from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScanBarcode } from "lucide-react";

const Dashboard = () => {
	const navigate = useNavigate();
	const [, startTransition] = useTransition();

	// Use custom hook for dashboard logic
	const {
		products,
		loading,
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
	} = useDashboard();

	const handleProductClick = useCallback(
		(id) => {
			startTransition(() => {
				navigate(`/products/${id}`);
			});
		},
		[navigate, startTransition]
	);

	if (loading)
		return <LoadingSpinner size="2xl" text="Loading products..." fullScreen />;

	return (
		<div className="form-container">
			{/* Content Header */}
			<div className="page-header">
				<div className="page-header-content">
					<h2 className="page-title">
						Products {searchTerm && `(${pagination.totalItems})`}
					</h2>
					<Button onClick={fetchProducts} variant="outline">
						Refresh
					</Button>
				</div>
			</div>

			{/* Search Section */}
			<div className="page-content mb-6">
				<div className="page-content-header">
					<div className="flex items-center space-x-4">
						<div className="flex-1">
							<Label htmlFor="search" className="sr-only">
								Search products
							</Label>
							<SearchInput
								ref={searchInputRef}
								value={searchTerm}
								onChange={handleSearchChange}
								placeholder="Search products by name or barcode..."
								onClear={clearSearch}>
								{isFetching && (
									<div className="absolute right-10 top-2 flex items-center">
										<svg
											className="animate-spin h-5 w-5 text-primary"
											viewBox="0 0 24 24">
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
												fill="none"></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
										</svg>
									</div>
								)}
							</SearchInput>
						</div>
						<Button onClick={() => navigate("/scan")} variant="outline">
							<ScanBarcode />
							Scan Barcode
						</Button>
					</div>
					{searchTerm && (
						<div className="mt-2 text-sm text-muted-foreground">
							Searching for:{" "}
							<span className="font-medium">&quot;{searchTerm}&quot;</span>
							{pagination.totalItems > 0 && (
								<span className="ml-2">
									• Found {pagination.totalItems} product
									{pagination.totalItems !== 1 ? "s" : ""}
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{products.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground text-lg">No products found</p>
				</div>
			) : (
				<div className="mb-4">
					{isFallbackRefetching && (
						<div>
							<Alert>
								<AlertDescription>
									Server reports matches — fetching first page to show
									results...
								</AlertDescription>
							</Alert>
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{products.map((product) => (
							<ProductCard
								key={product.id}
								product={product}
								onClick={handleProductClick}
							/>
						))}
					</div>
				</div>
			)}

			{/* Pagination */}
			<Pagination
				currentPage={pagination.currentPage}
				totalPages={pagination.totalPages}
				totalItems={pagination.totalItems}
				pageSize={pagination.pageSize}
				onPageChange={handlePageChange}
				onPageSizeChange={handlePageSizeChange}
			/>
		</div>
	);
};

export default Dashboard;
