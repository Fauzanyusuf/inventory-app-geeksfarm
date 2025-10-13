import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { hasPermission } from "@/utils/permissions";

import { productsApi } from "@/services/api";
import { formatPrice, formatDate } from "@/utils/format";

import { updateProductBatchValidation } from "@/validation/product-validation";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/ui/select-field";
import { useFormHandler } from "@/hooks/useFormHandler";
import { toastUtils } from "@/hooks";
import { BackButton } from "@/components/shared";

const ProductBatchDetail = () => {
	const { productId, batchId } = useParams();
	const { user } = useAuth();
	const [batch, setBatch] = useState(null);
	const [product, setProduct] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const [showEdit, setShowEdit] = useState(false);

	useEffect(() => {
		let mounted = true;
		const fetchBatch = async () => {
			try {
				setLoading(true);

				// Validate parameters
				if (!productId || !batchId) {
					console.error("Missing productId or batchId:", {
						productId,
						batchId,
					});
					navigate("/dashboard");
					return;
				}

				const res = await productsApi.getProductBatch(productId, batchId);
				if (!mounted) return;
				if (!res) {
					navigate("/dashboard");
					return;
				}
				setBatch(res || null);
				// also fetch parent product so we can read isPerishable
				try {
					const p = await productsApi.getProduct(productId);
					if (mounted) setProduct(p || null);
				} catch (e) {
					// non-fatal
					console.warn("Failed to fetch parent product", e);
					console.warn("ProductId:", productId, "BatchId:", batchId);
				}
			} catch (err) {
				console.error("Failed to fetch batch detail", err);
				// redirect to dashboard on error
				navigate("/dashboard");
				return;
			} finally {
				if (mounted) setLoading(false);
			}
		};
		fetchBatch();
		return () => {
			mounted = false;
		};
	}, [productId, batchId, navigate]);

	// Form setup: declared before any early returns to satisfy hook rules
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
		error,
		loading: formLoading,
		onSubmit,
		resetForm,
	} = useFormHandler(updateProductBatchValidation, {
		defaultValues: {
			status: undefined,
			quantity: undefined,
			costPrice: undefined,
			receivedAt: undefined,
			expiredAt: undefined,
			notes: "",
		},
		resetOnSuccess: false,
	});

	useEffect(() => {
		if (!batch) return;
		// reset form when batch is available
		resetForm();
		setValue("status", batch.status);
		setValue("quantity", batch.quantity);
		setValue("costPrice", batch.costPrice);
		setValue(
			"receivedAt",
			batch.receivedAt ? batch.receivedAt.split("T")[0] : undefined
		);
		setValue(
			"expiredAt",
			batch.expiredAt ? batch.expiredAt.split("T")[0] : undefined
		);
		setValue("notes", batch.notes || "");
	}, [batch, resetForm, setValue]);

	if (loading) {
		return (
			<div className="page-container">
				<div className="loading-container">
					<div className="text-center">
						<div className="loading-spinner"></div>
						<p className="loading-text">Loading batch details...</p>
					</div>
				</div>
			</div>
		);
	}

	// If batch is missing, fetch path should have redirected. Render nothing.
	if (!batch) return null;

	const handleFormSubmit = async (data) => {
		const submitFn = async (formData) => {
			// prepare payload: convert Date objects to ISO strings
			const payload = {
				...(formData.status !== undefined ? { status: formData.status } : {}),
				...(formData.quantity !== undefined
					? { quantity: Number(formData.quantity) }
					: {}),
				...(formData.costPrice !== undefined
					? { costPrice: Number(formData.costPrice) }
					: {}),
				...(formData.receivedAt
					? { receivedAt: new Date(formData.receivedAt).toISOString() }
					: {}),
				...(formData.expiredAt
					? { expiredAt: new Date(formData.expiredAt).toISOString() }
					: {}),
				...(formData.notes ? { notes: formData.notes } : {}),
			};

			const result = await productsApi.updateProductBatch(
				productId,
				batchId,
				payload
			);
			// refetch batch
			const refreshed = await productsApi.getProductBatch(productId, batchId);
			setBatch(refreshed);
			return result;
		};

		await onSubmit(data, submitFn, {
			successMessage: "Batch updated successfully",
			onSuccess: () => {
				toastUtils.success("Batch updated");
			},
		});
	};

	return (
		<div className="page-container">
			<main className="form-container">
				<div className="page-content">
					<div className="page-content-header">
						<h2 className="page-title">Batch Details</h2>
					</div>
					<div className="page-content-body">
						<div className="form-grid-2">
							<div>
								<h3 className="text-lg font-medium text-card-foreground mb-4">
									Batch Information
								</h3>
								<dl>
									<div>
										<dt>Batch ID</dt>
										<dd className="font-mono">{batch.id}</dd>
									</div>
									<div>
										<dt>Quantity</dt>
										<dd>
											{batch.quantity} {product?.unit || ""}
										</dd>
									</div>
									<div>
										<dt>Cost Price</dt>
										<dd className="text-lg font-semibold text-primary">
											{formatPrice(batch.costPrice)}
										</dd>
									</div>
									<div>
										<dt>Status</dt>
										<dd>
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													batch.status === "AVAILABLE"
														? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
														: batch.status === "EXPIRED"
														? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
														: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200"
												}`}>
												{batch.status}
											</span>
										</dd>
									</div>
									<div>
										<dt>Received At</dt>
										<dd>{formatDate(batch.receivedAt)}</dd>
									</div>
									<div>
										<dt>Expired At</dt>
										<dd>
											{batch.expiredAt ? formatDate(batch.expiredAt) : "N/A"}
										</dd>
									</div>
								</dl>
							</div>

							<div>
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-medium text-card-foreground">
										Edit Batch
									</h3>
									{hasPermission(user, "inventory:manage") && (
										<div>
											{!showEdit ? (
												<Button onClick={() => setShowEdit(true)} size="sm">
													Edit
												</Button>
											) : (
												<Button
													onClick={() => setShowEdit(false)}
													variant="outline"
													size="sm">
													Cancel
												</Button>
											)}
										</div>
									)}
								</div>
								{hasPermission(user, "inventory:manage") ? (
									showEdit && (
										<form
											onSubmit={handleSubmit(handleFormSubmit)}
											className="form-section"
											noValidate>
											{error && (
												<div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
													{error}
												</div>
											)}
											<SelectField
												name="status"
												label="Status"
												value={watch("status") || ""}
												onChange={(value) =>
													setValue("status", value === undefined ? "" : value)
												}
												onBlur={register("status").onBlur}
												errors={errors}
												placeholder="Pilih status"
												options={[
													{ value: "AVAILABLE", label: "AVAILABLE" },
													{ value: "EXPIRED", label: "EXPIRED" },
													{ value: "SOLD_OUT", label: "SOLD_OUT" },
												]}
											/>

											<FormField
												name="quantity"
												label="Quantity"
												type="number"
												step="1"
												{...register("quantity", { valueAsNumber: true })}
												errors={errors}
											/>

											<FormField
												name="costPrice"
												label="Cost Price"
												type="number"
												step="1"
												{...register("costPrice", { valueAsNumber: true })}
												errors={errors}
											/>

											<DatePicker
												name="receivedAt"
												label="Received At"
												value={watch("receivedAt")}
												onChange={(value) => setValue("receivedAt", value)}
												errors={errors}
												placeholder="Pilih tanggal diterima"
											/>

											{((product && product.isPerishable) ||
												batch.isPerishable) && (
												<DatePicker
													name="expiredAt"
													label="Expired At"
													value={watch("expiredAt")}
													onChange={(value) => setValue("expiredAt", value)}
													errors={errors}
													placeholder="Pilih tanggal kadaluarsa"
												/>
											)}

											<FormField
												name="notes"
												label="Notes"
												as="textarea"
												{...register("notes")}
												errors={errors}
												rows="3"
											/>

											<div className="form-actions">
												<Button type="submit" disabled={formLoading}>
													{formLoading ? "Saving..." : "Save"}
												</Button>
											</div>
										</form>
									)
								) : (
									<p className="text-sm text-muted-foreground mt-3">
										You don&apos;t have permission to edit batches.
									</p>
								)}
								<h3 className="text-lg font-medium text-card-foreground mt-6 mb-4">
									Stock Movements
								</h3>
								{Array.isArray(batch.stockMovements) &&
								batch.stockMovements.length > 0 ? (
									<ul className="divide-y divide-border">
										{batch.stockMovements.map((m) => (
											<li key={m.id} className="py-3">
												<div className="text-sm font-medium text-card-foreground">
													{m.movementType} — {m.quantity}
												</div>
												<div className="text-sm text-muted-foreground">
													{m.note || ""}
												</div>
												<div className="text-xs text-muted-foreground">
													{formatDate(m.createdAt)}
												</div>
											</li>
										))}
									</ul>
								) : (
									<p className="text-sm text-muted-foreground">
										No stock movements for this batch.
									</p>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Back Button */}
				<div className="mt-6">
					<BackButton to={`/products/${productId}`}>
						Back to Product Detail
					</BackButton>
				</div>
			</main>
		</div>
	);
};

export default ProductBatchDetail;
