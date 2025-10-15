import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useConfirm } from "@/contexts/ConfirmContext";
import { categoriesApi, productsApi } from "@/services/api";
import { formatDate, formatPrice } from "@/utils/format";
import { hasPermission } from "@/utils/permissions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BackButton } from "@/components/shared";
import { Button } from "@/components/ui/button";

const useCategoryData = (id) => {
	const [category, setCategory] = useState(null);
	const [categoryImage, setCategoryImage] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const fetchCategory = useCallback(async () => {
		if (!id) return;

		try {
			setLoading(true);
			const response = await categoriesApi.getCategory(id);
			const cat =
				response && response.data !== undefined ? response.data : response;
			setCategory(cat || null);

			try {
				const imageResponse = await categoriesApi.getCategoryImage(id);
				if (imageResponse) {
					setCategoryImage(URL.createObjectURL(imageResponse));
				}
			} catch {
				setCategoryImage(null);
			}
		} catch {
			setError("Failed to load category details");
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchCategory();
	}, [fetchCategory]);

	return { category, categoryImage, loading, error };
};

const useProductsWithImages = (categoryId, category) => {
	const [products, setProducts] = useState([]);
	const [productImages, setProductImages] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const fetchProducts = useCallback(async () => {
		if (!categoryId || !category) return;

		try {
			setLoading(true);
			setError("");

			let currentProducts = [];

			if (category.products) {
				currentProducts = category.products;
			} else {
				const response = await productsApi.getProducts();
				const productsData = Array.isArray(response)
					? response
					: response.data || response.products || response || [];

				currentProducts = productsData.filter(
					(product) => product.category && product.category.id === categoryId
				);
			}

			setProducts(currentProducts);
			await fetchProductImages(currentProducts);
		} catch {
			setError("Failed to load products for this category");
			setProducts([]);
		} finally {
			setLoading(false);
		}
	}, [categoryId, category]);

	const fetchProductImages = async (productsList) => {
		const imagesMap = {};

		for (const product of productsList) {
			const productDetail = await productsApi.getProduct(product.id);
			if (
				productDetail &&
				productDetail.images &&
				productDetail.images.length > 0
			) {
				imagesMap[product.id] = productDetail.images[0].url;
			}
		}

		setProductImages(imagesMap);
	};

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	return { products, productImages, loading, error };
};

const CategoryDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const confirm = useConfirm();

	const {
		category,
		categoryImage,
		loading: categoryLoading,
		error: categoryError,
	} = useCategoryData(id);

	const {
		products,
		productImages,
		loading: productsLoading,
		error: productsError,
	} = useProductsWithImages(id, category);

	useEffect(() => {
		if (!categoryLoading && (categoryError || !category)) {
			navigate("/dashboard");
		}
	}, [categoryLoading, categoryError, category, navigate]);

	const handleDelete = useCallback(async () => {
		if (!category) return;

		const confirmed = await confirm({
			title: "Delete Category",
			message: `Are you sure you want to delete "${
				category.name
			}"? This action cannot be undone and will affect ${
				products.length
			} product${products.length !== 1 ? "s" : ""}.`,
		});

		if (!confirmed) return;

		try {
			await categoriesApi.deleteCategory(id);
			navigate("/categories", {
				state: { message: "Category deleted successfully", type: "success" },
			});
		} catch (err) {
			console.error("Failed to delete category:", err);
		}
	}, [id, category, products.length, confirm, navigate]);

	const handleEdit = useCallback(() => {
		navigate(`/categories/${id}/edit`);
	}, [id, navigate]);

	if (categoryLoading) {
		return (
			<LoadingSpinner size="lg" text="Loading category details..." fullScreen />
		);
	}

	if (!category) return null;

	return (
		<div className="page-container">
			<main className="form-container">
				<div>
					<div className="page-content">
						<div className="page-content-header">
							<div className="flex justify-between items-center">
								<div>
									<h3 className="page-title">Category Information</h3>
									<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
										Details and statistics for this category.
									</p>
								</div>
								{hasPermission(user, "product:manage") && category && (
									<div className="flex space-x-3">
										<Button onClick={handleEdit} title="Edit category">
											<svg
												className="w-4 h-4 mr-2"
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
										</Button>
										<Button
											onClick={handleDelete}
											variant="destructive"
											title="Delete category">
											<svg
												className="w-4 h-4 mr-2"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
											Delete
										</Button>
									</div>
								)}
							</div>
						</div>
						<div className="border-t border-border">
							<dl className="striped sm:grid">
								<div className="px-4 py-5 sm:px-6">
									<dt>Category Name</dt>
									<dd>{category.name}</dd>
								</div>
								<div className="px-4 py-5 sm:px-6">
									<dt>Description</dt>
									<dd>{category.description || "No description provided"}</dd>
								</div>
								{categoryImage && (
									<div className="px-4 py-5 sm:px-6">
										<dt>Category Image</dt>
										<dd>
											<img
												src={categoryImage}
												alt={`${category.name} category`}
												className="w-32 h-32 object-cover rounded-lg border border-border"
											/>
										</dd>
									</div>
								)}
								<div className="px-4 py-5 sm:px-6">
									<dt>Total Products</dt>
									<dd>
										{products.length} product{products.length !== 1 ? "s" : ""}
									</dd>
								</div>
								<div className="px-4 py-5 sm:px-6">
									<dt>Created</dt>
									<dd>{formatDate(category.createdAt)}</dd>
								</div>
								<div className="px-4 py-5 sm:px-6">
									<dt>Last Updated</dt>
									<dd>{formatDate(category.updatedAt)}</dd>
								</div>
							</dl>
						</div>
					</div>

					<div className="mt-6">
						<div className="page-content">
							<div className="page-content-header">
								<h3 className="page-title">
									Products in this Category ({products.length})
								</h3>
								<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
									All products belonging to this category.
								</p>
							</div>
							<div className="border-t border-border">
								{productsError ? (
									<div className="text-center py-12">
										<div className="text-destructive-foreground">
											<svg
												className="mx-auto h-12 w-12"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
												/>
											</svg>
										</div>
										<h3 className="mt-2 text-sm font-medium text-card-foreground">
											Error loading products
										</h3>
										<p className="mt-1 text-sm text-muted-foreground">
											{productsError}
										</p>
									</div>
								) : productsLoading ? (
									<LoadingSpinner size="default" text="Loading products..." />
								) : products.length > 0 ? (
									<ul className="divide-y">
										{products.map((product) => (
											<li key={product.id}>
												<div
													className="px-4 py-4 sm:px-6 hover:bg-popover cursor-pointer"
													onClick={() => navigate(`/products/${product.id}`)}>
													<div className="flex items-center justify-between">
														<div className="flex items-center">
															<div className="flex-shrink-0 h-10 w-10">
																{productImages[product.id] ? (
																	<img
																		src={productImages[product.id]}
																		alt={product.name}
																		className="h-10 w-10 rounded-lg object-cover"
																	/>
																) : (
																	<div className="h-10 w-10 rounded-lg bg-popover flex items-center justify-center">
																		<svg
																			className="h-6 w-6 text-popover-foreground"
																			fill="none"
																			stroke="currentColor"
																			viewBox="0 0 24 24">
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
																			/>
																		</svg>
																	</div>
																)}
															</div>
															<div className="ml-4">
																<div className="text-sm font-medium text-card-foreground">
																	{product.name}
																</div>
																<div className="text-sm text-muted-foreground">
																	Barcode: {product.barcode}
																</div>
															</div>
														</div>
														<div className="text-right">
															<div className="text-sm font-medium text-card-foreground">
																{product.sellingPrice
																	? formatPrice(product.sellingPrice)
																	: "N/A"}
															</div>
															<div className="text-sm text-muted-foreground">
																{product.totalQuantity !== undefined
																	? `Stock: ${product.totalQuantity} ${product.unit}`
																	: "Details available on product page"}
															</div>
														</div>
													</div>
												</div>
											</li>
										))}
									</ul>
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
												d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
											/>
										</svg>
										<h3 className="mt-2 text-sm font-medium text-card-foreground">
											No products in this category
										</h3>
										<p className="mt-1 text-sm text-muted-foreground">
											Products in this category will appear here.
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6">
					<BackButton>Back to Categories List</BackButton>
				</div>
			</main>
		</div>
	);
};

export default CategoryDetail;
