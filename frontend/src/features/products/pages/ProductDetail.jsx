import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { productsApi } from "@/services/api";
import { formatDate, formatPrice } from "@/utils/format";
import { hasPermission } from "@/utils/permissions";
import ProductEditor from "@/features/products/components/ProductEditor";
import { useConfirm } from "@/contexts/ConfirmContext";
import useObjectURL from "@/hooks/useObjectURL";
import AddProductStockModal from "@/features/products/components/AddProductStockModal";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProductDetail = () => {
	const [product, setProduct] = useState(null);
	const [batches, setBatches] = useState([]);
	const [loading, setLoading] = useState(true);
	const { id } = useParams();
	const { user } = useAuth();
	const navigate = useNavigate();
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState("");
	// staged holds items: { file, name, url, sig }
	const [staged, setStaged] = useState([]);
	const [deletingImageIds, setDeletingImageIds] = useState([]);
	const uploadInFlightRef = useRef(false);
	const MAX_STAGED = 5;
	const [showEditor, setShowEditor] = useState(false);
	const [showAddStockModal, setShowAddStockModal] = useState(false);
	const { create, revoke, cleanup } = useObjectURL();

	// (stock form removed) previously used react-hook-form for add-stock UI

	const fetchProductDetails = useCallback(async () => {
		try {
			setLoading(true);
			const res = await productsApi.getProduct(id);
			// productsApi.getProduct is standardized to return the resource directly (or null)
			const prod = res || null;
			if (!prod) {
				// Missing or not found -> treat as invalid sub-URL and redirect to dashboard
				navigate("/dashboard");
				return;
			}
			setProduct(prod);

			try {
				const batchesRes = await productsApi.getProductBatches(id);
				const b = (batchesRes && batchesRes.data) || batchesRes || [];
				setBatches(Array.isArray(b) ? b : []);
			} catch {
				setBatches([]);
			}
		} catch (err) {
			console.error("Failed to load product details", err);
			// Redirect to dashboard on fetch error to avoid showing router error boundary
			navigate("/dashboard");
			return;
		} finally {
			setLoading(false);
		}
	}, [id, navigate]);

	const handleAddStockSuccess = useCallback(() => {
		// Refresh product details to show updated stock batches
		fetchProductDetails();
	}, [fetchProductDetails]);

	const handleDeleteProduct = async () => {
		// actual deletion is handled after user confirms in ConfirmModal
		try {
			setLoading(true);
			await productsApi.deleteProduct(id);
			// prefer SPA navigation
			navigate("/dashboard");
		} catch (err) {
			console.error("Delete product failed", err);
			alert(err.message || "Failed to delete product");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProductDetails();
	}, [fetchProductDetails]);

	// use shared formatDate from utils/format

	const handleImageUpload = async (e) => {
		const files = Array.from(e.target.files || []);

		if (!files.length) return;

		setUploadError("");
		setStaged((prev) => {
			const available = Math.max(0, MAX_STAGED - prev.length);
			if (available <= 0) {
				setUploadError(`Maximum ${MAX_STAGED} images can be staged`);
				return prev;
			}
			const toAdd = files.slice(0, available);
			const items = toAdd.map((f) => ({
				file: f,
				name: f.name,
				url: create(f),
				sig: `${f.name}:${f.size}:${f.lastModified || 0}`,
			}));

			return [...prev, ...items];
		});
		e.target.value = null;
	};

	// Upload staged files when user confirms
	const commitStagedUpload = async () => {
		if (!staged || staged.length === 0) return;
		const formData = new FormData();
		staged.forEach((it) => formData.append("images", it.file));
		try {
			if (uploadInFlightRef.current) return;
			uploadInFlightRef.current = true;
			setUploading(true);
			setUploadError("");
			await productsApi.uploadProductImages(id, formData);
			// cleanup previews
			staged.forEach((p) => revoke(p.url));
			setStaged([]);
			await fetchProductDetails();
		} catch (err) {
			console.error("Upload failed", err);
			setUploadError(err.message || "Upload failed");
		} finally {
			uploadInFlightRef.current = false;
			setUploading(false);
		}
	};

	const cancelStagedUpload = () => {
		staged.forEach((p) => revoke(p.url));
		setStaged([]);
	};

	const stagedRef = useRef(null);
	const revokeRef = useRef(null);

	// Update refs when values change
	useEffect(() => {
		stagedRef.current = staged;
		revokeRef.current = revoke;
	}, [staged, revoke]);

	// revoke any staged previews on unmount as a safety net
	useEffect(() => {
		return () => {
			if (stagedRef.current && revokeRef.current) {
				stagedRef.current.forEach((p) => revokeRef.current(p.url));
			}
			cleanup();
			uploadInFlightRef.current = false;
		};
	}, [cleanup]);

	const handleEditSuccess = async () => {
		setShowEditor(false);
		await fetchProductDetails();
	};

	const handleDeleteImage = async (imgId) => {
		if (deletingImageIds.includes(imgId)) return;
		setDeletingImageIds((prev) => [...prev, imgId]);
		try {
			await productsApi.deleteProductImage(id, imgId);
			await fetchProductDetails();
		} catch (err) {
			console.error("Delete image failed", err);
			alert(err.message || "Failed to delete image");
		} finally {
			setDeletingImageIds((prev) => prev.filter((i) => i !== imgId));
		}
	};

	const confirm = useConfirm();

	const getBatchStatusColor = (status) => {
		switch (status) {
			case "AVAILABLE":
				return "bg-green-100 text-green-800";
			case "EXPIRED":
				return "bg-red-100 text-red-800";
			case "SOLD_OUT":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div
						className="animate-spin rounded-full h-32 w-32 border-b-2"
						style={{ borderBottomColor: "var(--color-primary)" }}></div>
					<p className="mt-4 text-muted-foreground">
						Loading product details...
					</p>
				</div>
			</div>
		);
	}

	// If we reach here and no product is present, the fetch should have redirected.
	if (!product) {
		return null;
	}

	// Display all batches (do not filter out SOLD_OUT)
	const visibleBatches = Array.isArray(batches) ? batches : [];

	return (
		<div className="form-container">
			{/* Product Details */}
			<div className="page-content mb-6">
				<div className="page-content-header flex justify-between">
					<h1 className="page-title">{product.name}</h1>
					<div>
						{hasPermission(user, "product:manage") && (
							<div className="flex items-center gap-2">
								<Button type="button" onClick={() => setShowEditor((s) => !s)}>
									{showEditor ? "Close Editor" : "Edit"}
								</Button>
								{hasPermission(user, "inventory:manage") && (
									<Button
										onClick={async () => {
											try {
												const ok = await confirm({
													title: "Delete product",
													message: "Delete this product?",
												});
												if (!ok) return;
												await handleDeleteProduct();
											} catch (err) {
												console.error("Delete product error", err);
											}
										}}
										variant="destructive"
										title="Delete product">
										Delete
									</Button>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="page-content-body">
					{showEditor ? (
						<div className="mt-6">
							<ProductEditor
								mode="edit"
								productId={id}
								onSuccess={handleEditSuccess}
							/>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h3 className="text-lg font-medium text-card-foreground mb-4">
									Product Information
								</h3>
								{/* Images */}
								<div className="mb-4">
									<dt className="text-sm font-medium text-muted-foreground">
										Images
									</dt>
									<div className="mt-2 flex items-center gap-4">
										{product.images && product.images.length > 0 ? (
											product.images.map((img) => (
												<div key={img.id} className="relative">
													<img
														src={img.url}
														alt={img.filename || "product image"}
														className="h-20 w-20 object-cover rounded"
													/>
													{hasPermission(user, "product:manage") &&
														hasPermission(user, "inventory:manage") && (
															<Button
																onClick={async () => {
																	try {
																		const ok = await confirm({
																			title: "Delete image",
																			message: "Delete this image?",
																		});
																		if (!ok) return;
																		await handleDeleteImage(img.id);
																	} catch (err) {
																		console.error("Delete image error", err);
																	}
																}}
																variant="destructive"
																size="sm"
																className={`absolute top-0 right-0 rounded-full px-1.5 ${
																	deletingImageIds.includes(img.id)
																		? "opacity-60 cursor-not-allowed pointer-events-none"
																		: "hover:opacity-90"
																}`}
																title={
																	deletingImageIds.includes(img.id)
																		? "Deleting..."
																		: "Delete image"
																}
																aria-live="polite">
																{deletingImageIds.includes(img.id) ? (
																	<span
																		className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
																		aria-hidden="true"
																	/>
																) : (
																	"×"
																)}
															</Button>
														)}
												</div>
											))
										) : (
											<p className="text-sm text-muted-foreground">No images</p>
										)}
									</div>

									<div className="mt-3">
										{hasPermission(user, "product:manage") && (
											<Label className="inline-flex items-center px-3 py-2 bg-popover rounded cursor-pointer text-sm text-popover-foreground">
												<Input
													type="file"
													accept="image/*"
													multiple
													onChange={handleImageUpload}
													className="hidden"
												/>
												<span className="flex items-center gap-2">
													<span>
														{uploading ? "Uploading..." : "Upload images"}
													</span>
													<span className="text-xs bg-muted rounded px-2 py-0.5 text-muted-foreground">
														{staged.length}/{MAX_STAGED}
													</span>
												</span>
											</Label>
										)}
										{uploadError && (
											<p className="text-sm text-destructive-foreground mt-2">
												{uploadError}
											</p>
										)}

										{/* Staged previews */}
										{staged && staged.length > 0 && (
											<div className="mt-3">
												<div className="grid grid-cols-5 gap-2">
													{staged.map((p, idx) => (
														<div key={p.url} className="relative">
															<img
																src={p.url}
																alt={p.name}
																className="h-20 w-20 object-cover rounded"
															/>
															<button
																type="button"
																onClick={() => {
																	try {
																		revoke(p.url);
																	} catch (err) {
																		console.error(
																			"Failed to revoke object URL",
																			err
																		);
																	}
																	setStaged((prev) =>
																		prev.filter((_, i) => i !== idx)
																	);
																}}
																className="absolute top-0 right-0 bg-destructive-foreground rounded-full p-1 text-destructive shadow"
																title="Remove">
																×
															</button>
														</div>
													))}
												</div>
												<div className="mt-2 flex gap-2">
													<Button
														type="button"
														onClick={commitStagedUpload}
														disabled={uploading}
														size="sm">
														{uploading ? "Uploading..." : "Upload selected"}
													</Button>
													<Button
														type="button"
														onClick={cancelStagedUpload}
														variant="outline"
														size="sm">
														Cancel
													</Button>
												</div>
											</div>
										)}
									</div>
								</div>

								<dl className="space-y-3">
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Description
										</dt>
										<dd className="text-sm text-card-foreground mt-1">
											{product.description || "No description available"}
										</dd>
									</div>
									<div>
										<dt>Barcode</dt>
										<dd>{product.barcode || "No barcode"}</dd>
									</div>
									<div>
										<dt>Unit</dt>
										<dd>{product.unit}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Selling Price
										</dt>
										<dd className="text-lg font-semibold text-primary mt-1">
											{formatPrice(product.sellingPrice)}
										</dd>
									</div>
									<div>
										<dt>Perishable</dt>
										<dd>{product.isPerishable ? "Yes" : "No"}</dd>
									</div>
									<div>
										<dt>Active</dt>
										<dd>{product.isActive ? "Yes" : "No"}</dd>
									</div>
									<div>
										<dt>Total Quantity</dt>
										<dd>
											{product.totalQuantity || 0} {product.unit}
										</dd>
									</div>
								</dl>
							</div>

							<div>
								<h3 className="text-lg font-medium text-card-foreground mb-4">
									Category & Dates
								</h3>
								<dl className="space-y-3">
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Category
										</dt>
										<dd className="text-sm text-card-foreground mt-1">
											{product.category?.name || "No category"}
										</dd>
									</div>
									<div>
										<dt>Created At</dt>
										<dd>{formatDate(product.createdAt)}</dd>
									</div>
									<div>
										<dt>Updated At</dt>
										<dd>{formatDate(product.updatedAt)}</dd>
									</div>
								</dl>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Stock Batches */}
			<div className="page-content">
				<div className="page-content-header">
					<div className="flex justify-between items-center">
						<h2 className="page-title">Stock Batches ({batches.length})</h2>
						{hasPermission(user, "inventory:manage") && (
							<Button onClick={() => setShowAddStockModal(true)} size="sm">
								Add Stock
							</Button>
						)}
					</div>
				</div>
				<div className="page-content-body">
					{visibleBatches.length === 0 ? (
						<p className="text-muted-foreground text-center py-8">
							No stock batches found for this product
						</p>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Batch ID</TableHead>
										<TableHead>Quantity</TableHead>
										<TableHead>Cost Price</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Received Date</TableHead>
										<TableHead>Expiry Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{visibleBatches.map((batch) => (
										<TableRow
											key={batch.id}
											className="hover:bg- cursor-pointer"
											onClick={() =>
												navigate(`/products/${id}/batches/${batch.id}`)
											}>
											<TableCell className="font-mono">{batch.id}</TableCell>
											<TableCell>
												{batch.quantity} {product.unit}
											</TableCell>
											<TableCell>{formatPrice(batch.costPrice)}</TableCell>
											<TableCell>
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBatchStatusColor(
														batch.status
													)}`}>
													{batch.status}
												</span>
											</TableCell>
											<TableCell>{formatDate(batch.receivedAt)}</TableCell>
											<TableCell>
												{batch.expiredAt ? formatDate(batch.expiredAt) : "N/A"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>
			<AddProductStockModal
				productId={id}
				productName={product?.name || "Product"}
				isPerishable={product?.isPerishable || false}
				isOpen={showAddStockModal}
				onClose={() => setShowAddStockModal(false)}
				onSuccess={handleAddStockSuccess}
			/>
		</div>
	);
};

export default ProductDetail;
