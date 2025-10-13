import { useEffect, useState, useMemo } from "react";
import {
	productCreateSchema,
	productUpdateSchema,
} from "@/validation/product-validation";
import { productsApi } from "@/services/api";
import { useCategoriesData } from "@/features/categories/hooks/useCategoriesData";
import BarcodeScanner from "./BarcodeScanner";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/ui/select-field";
import { getErrorFromRHF } from "@/utils";
import { useFormHandler } from "@/hooks/useFormHandler";
import { toastUtils } from "@/hooks/useToast";

const ProductEditor = ({ mode = "create", productId = null, onSuccess }) => {
	const isEdit = mode === "edit" && productId;
	const schema = isEdit ? productUpdateSchema : productCreateSchema;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState,
		error,
		success,
		loading,
		onSubmit,
		loadData,
	} = useFormHandler(schema, {
		defaultValues: {
			name: "",
			barcode: "",
			description: "",
			unit: "pcs",
			sellingPrice: "",
			costPrice: "",
			isActive: false,
			categoryId: "",
			quantity: "",
			receivedAt: new Date().toISOString().split("T")[0],
			expiredAt: "",
			movementNote: "",
			isPerishable: false,
		},
		resetOnSuccess: false,
	});

	const { errors: rhfErrors } = formState;
	const { categories } = useCategoriesData({ limit: 100 }); // Get all categories for editor
	const [showScanner, setShowScanner] = useState(false);

	useEffect(() => {
		let cancelled = false;

		if (isEdit) {
			const fetchExisting = async () => {
				try {
					const res = await productsApi.getProduct(productId);
					const prod = res && res.data !== undefined ? res.data : res;
					if (prod && !cancelled) {
						// Load form data using unified handler
						loadData({
							name: prod.name || "",
							barcode: prod.barcode || "",
							description: prod.description || "",
							unit: prod.unit || "pcs",
							sellingPrice: prod.sellingPrice || "",
							categoryId: prod.categoryId
								? String(prod.categoryId)
								: prod.category?.id
								? String(prod.category.id)
								: "",
							isPerishable: Boolean(prod.isPerishable),
							isActive: Boolean(prod.isActive),
						});
					}
				} catch (err) {
					console.error("Failed to load product for edit:", err);
					// Error will be handled by useFormHandler
				}
			};

			fetchExisting();
		}

		return () => {
			cancelled = true;
		};
	}, [isEdit, productId, loadData]);

	const isPerishable = watch("isPerishable");
	useEffect(() => {
		if (!isPerishable) setValue("expiredAt", "");
	}, [isPerishable, setValue]);

	// Memoized categoryId value to prevent controlled/uncontrolled switching
	const categoryIdValue = useMemo(() => {
		const value = watch("categoryId");
		return value === null || value === undefined ? "" : String(value);
	}, [watch]);

	const handleScanSuccess = (decodedText) => setValue("barcode", decodedText);

	const handleFormSubmit = async (values) => {
		const submitFn = async (formData) => {
			if (isEdit) {
				// Update existing product
				const patchPayload = {};
				[
					"name",
					"barcode",
					"description",
					"unit",
					"sellingPrice",
					"costPrice",
					"isPerishable",
					"isActive",
					"movementNote",
				].forEach((k) => {
					if (
						formData[k] !== undefined &&
						formData[k] !== null &&
						formData[k] !== ""
					) {
						patchPayload[k] = formData[k];
					}
				});

				// Handle categoryId separately to convert empty string to null
				if (
					formData.categoryId !== undefined &&
					formData.categoryId !== null &&
					formData.categoryId !== ""
				) {
					patchPayload.categoryId = formData.categoryId;
				} else if (formData.categoryId === "") {
					patchPayload.categoryId = null;
				}

				const result = await productsApi.updateProduct(productId, patchPayload);

				return result;
			} else {
				// Create new product
				const submitData = new FormData();
				Object.keys(formData).forEach((key) => {
					if (key === "categoryId") {
						// Handle categoryId separately - convert empty string to null
						if (
							formData[key] !== "" &&
							formData[key] !== null &&
							formData[key] !== undefined
						) {
							submitData.append(key, formData[key]);
						} else if (formData[key] === "") {
							submitData.append(key, "");
						}
					} else if (
						formData[key] !== "" &&
						formData[key] !== null &&
						formData[key] !== undefined
					) {
						submitData.append(key, formData[key]);
					}
				});

				return await productsApi.createProduct(submitData);
			}
		};

		await onSubmit(values, submitFn, {
			onSuccess: () => {
				// Show toast notification for successful submission
				toastUtils.success(
					isEdit
						? "Product updated successfully!"
						: "Product created successfully!"
				);

				if (onSuccess) onSuccess();
			},
			onError: (error) => {
				console.error("Form submission error:", error);
				toastUtils.error(
					isEdit ? "Failed to update product" : "Failed to create product"
				);
			},
		});
	};

	return (
		<>
			<div className="form-card">
				{error && (
					<div
						role="status"
						aria-live="polite"
						aria-atomic="true"
						className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded">
						{error}
					</div>
				)}
				{success && (
					<div
						role="status"
						aria-live="polite"
						aria-atomic="true"
						className="bg-green-500/15 border border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded">
						{success}
					</div>
				)}

				<form
					onSubmit={handleSubmit(handleFormSubmit)}
					className="form-section">
					<div>
						<FormField
							{...register("name")}
							name="name"
							label="Name"
							errors={rhfErrors}
							required
						/>
					</div>

					<div>
						<Label>Barcode</Label>
						<div className="mt-1 flex rounded-md">
							<FormField
								{...register("barcode")}
								name="barcode"
								className="flex-1 rounded-l-md"
								errors={rhfErrors}
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowScanner(true)}>
								Scan
							</Button>
						</div>
					</div>

					<div>
						<FormField
							as="textarea"
							{...register("description")}
							name="description"
							label="Description"
							errors={rhfErrors}
							rows={3}
						/>
					</div>

					<div>
						<FormField
							{...register("unit")}
							name="unit"
							label="Unit"
							errors={rhfErrors}
						/>
					</div>

					<div className="form-grid-2">
						<div>
							<FormField
								{...register("sellingPrice", { valueAsNumber: true })}
								name="sellingPrice"
								label="Selling Price (IDR)"
								type="number"
								errors={rhfErrors}
								min="0"
							/>
						</div>
						{!isEdit && (
							<div>
								<FormField
									{...register("costPrice", { valueAsNumber: true })}
									name="costPrice"
									label="Cost Price (IDR)"
									type="number"
									errors={rhfErrors}
									min="0"
								/>
							</div>
						)}
					</div>

					{/* Stock Information (create only) */}
					{!isEdit && (
						<div className="space-y-4">
							<h4 className="text-md font-medium text-card-foreground">
								Stock Information
							</h4>
							<div className="form-grid-2">
								<div>
									<FormField
										{...register("quantity", { valueAsNumber: true })}
										name="quantity"
										label="Initial Quantity *"
										type="number"
										min="1"
										errors={rhfErrors}
									/>
								</div>

								<div>
									<DatePicker
										value={watch("receivedAt")}
										onChange={(value) => setValue("receivedAt", value)}
										label="Received Date"
										placeholder="Pilih tanggal diterima"
										errors={getErrorFromRHF(rhfErrors, "receivedAt")}
									/>
								</div>

								<div className="sm:col-span-2">
									<FormField
										{...register("movementNote")}
										name="movementNote"
										as="textarea"
										label="Movement Note"
										className="h-24"
										errors={rhfErrors}
									/>
								</div>

								<div className="sm:col-span-2">
									<div className="flex items-center">
										<Checkbox
											name="isPerishable"
											id="isPerishable"
											checked={watch("isPerishable")}
											onCheckedChange={(checked) =>
												setValue("isPerishable", checked)
											}
										/>
										<Label
											htmlFor="isPerishable"
											className="ml-2 block text-sm text-card-foreground">
											This product is perishable
										</Label>
									</div>
								</div>

								{isPerishable && (
									<div>
										<DatePicker
											value={watch("expiredAt")}
											onChange={(value) => setValue("expiredAt", value)}
											label="Expiry Date"
											placeholder="Pilih tanggal kadaluarsa"
											errors={getErrorFromRHF(rhfErrors, "expiredAt")}
										/>
									</div>
								)}
							</div>
						</div>
					)}

					<div>
						<SelectField
							name="categoryId"
							label="Category"
							value={categoryIdValue}
							onChange={(value) =>
								setValue("categoryId", value === undefined ? "" : value)
							}
							placeholder="Select Category"
							options={categories.map((c) => ({
								value: c.id,
								label: c.name,
							}))}
							errors={getErrorFromRHF(rhfErrors, "categoryId")}
						/>
					</div>

					{isEdit && (
						<div className="flex items-center">
							<Checkbox {...register("isActive")} id="isActive" />
							<Label
								htmlFor="isActive"
								className="ml-2 block text-sm text-card-foreground">
								Active
							</Label>
						</div>
					)}

					<div className="form-actions">
						<Button type="submit" disabled={loading}>
							{loading
								? isEdit
									? "Updating..."
									: "Creating..."
								: isEdit
								? "Update"
								: "Create"}
						</Button>
					</div>
				</form>
			</div>
			{showScanner && (
				<BarcodeScanner
					onScanSuccess={handleScanSuccess}
					onClose={() => setShowScanner(false)}
				/>
			)}
		</>
	);
};

export default ProductEditor;
