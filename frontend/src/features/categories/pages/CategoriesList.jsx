import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import Pagination from "@/components/shared/Pagination";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { categoriesApi } from "@/services/api";
import { hasPermission } from "@/utils/permissions";
import { getErrorMessage } from "@/utils/errorUtils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CategoriesList = () => {
	const [categories, setCategories] = useState([]);
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		pageSize: 20,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const { user } = useAuth();

	const fetchCategories = useCallback(async () => {
		try {
			setLoading(true);
			const params = {
				page: pagination.currentPage,
				limit: pagination.pageSize,
			};
			const response = await categoriesApi.getCategories(params);
			const items = Array.isArray(response) ? response : response.data || [];
			setCategories(items);
			const meta = Array.isArray(response) ? null : response.meta;
			if (meta) {
				setPagination((prev) => ({
					...prev,
					currentPage: meta.page || 1,
					totalPages: meta.totalPages || 1,
					totalItems: meta.total || items.length,
					pageSize: meta.limit || prev.pageSize,
				}));
			} else {
				setPagination((prev) => ({ ...prev, totalItems: items.length }));
			}
		} catch (err) {
			console.error("Failed to fetch categories:", err);
			setError(getErrorMessage(err, "categories", "load"));
		} finally {
			setLoading(false);
		}
	}, [pagination.currentPage, pagination.pageSize]);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	const handleCategoryClick = (categoryId) => {
		navigate(`/categories/${categoryId}`);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
					<p className="mt-4 text-muted-foreground">Loading categories...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="form-container">
			{/* Main Content */}
			<div className="page-header">
				<div className="page-header-content">
					<h1 className="page-title">Categories</h1>
					{hasPermission(user, "product:manage") && (
						<Button
							onClick={() => navigate("/categories/add")}
							className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm">
							Add Category
						</Button>
					)}
				</div>
			</div>
			{error && (
				<Alert variant="destructive" className="mb-6">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Categories Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{categories.map((category) => (
					<div
						key={category.id}
						onClick={() => handleCategoryClick(category.id)}
						className="bg-card overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-border">
						<div className="p-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-10 h-10 bg-popover rounded-lg flex items-center justify-center">
										{category.image ? (
											<img
												src={category.image.thumbnailUrl}
												alt={category.name}
												className="w-full h-full object-cover rounded-lg"
											/>
										) : (
											<svg
												className="w-6 h-6 text-popover-foreground"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
												/>
											</svg>
										)}
									</div>
								</div>
								<div className="ml-4 flex-1">
									<h3 className="text-lg font-medium text-card-foreground">
										{category.name}
									</h3>
									<p className="text-sm text-muted-foreground">
										{category.description || "No description"}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-popover px-6 py-3">
							<div className="flex items-center justify-between">
								<div className="text-sm text-popover-foreground">
									Click to view details
								</div>
								{hasPermission(user, "product:manage") && (
									<button
										onClick={(e) => {
											e.stopPropagation();
											navigate(`/categories/${category.id}/edit`);
										}}
										className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
										<svg
											className="w-3 h-3 mr-1"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
										Edit
									</button>
								)}
							</div>
						</div>
					</div>
				))}
			</div>

			{categories.length === 0 && !loading && (
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
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<h3 className="mt-2 text-sm font-medium text-card-foreground">
						No categories
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Get started by creating a new category.
					</p>
				</div>
			)}
			{/* Pagination */}
			<div className="mt-6">
				<Pagination
					currentPage={pagination.currentPage}
					totalPages={pagination.totalPages}
					totalItems={pagination.totalItems}
					pageSize={pagination.pageSize}
					onPageChange={(p) =>
						setPagination((prev) => ({ ...prev, currentPage: p }))
					}
					onPageSizeChange={(ps) =>
						setPagination((prev) => ({
							...prev,
							pageSize: ps,
							currentPage: 1,
						}))
					}
				/>
			</div>
		</div>
	);
};

export default CategoriesList;
