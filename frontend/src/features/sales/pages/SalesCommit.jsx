import { useState, useEffect, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { useFieldArray } from "react-hook-form";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { productsApi, salesApi } from "@/services/api";
import { hasPermission } from "@/utils/permissions";
import { commitSalesSchema } from "@/validation/stock-movement-validation";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { useFormHandler } from "@/hooks/useFormHandler";

const SalesCommit = () => {
	// Use unified form handler
	const {
		register,
		control,
		handleSubmit,
		setValue,
		formState: { errors: rhfErrors },
		loading,
		onSubmit,
		resetForm,
	} = useFormHandler(commitSalesSchema, {
		defaultValues: { sales: [{ productId: "", quantity: 1 }], note: "" },
		resetOnSuccess: true,
	});

	const { fields, append, remove } = useFieldArray({ control, name: "sales" });
	const [products, setProducts] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearch = useDebounce(searchTerm, 300);
	const [showProductSearch, setShowProductSearch] = useState(false);
	const { user } = useAuth();
	const inFlightRef = useRef(false);

	// Search products with an in-flight guard to avoid overlapping requests
	const searchProducts = async (term) => {
		if (!term.trim()) {
			setProducts([]);
			return;
		}
		if (inFlightRef.current) return;
		inFlightRef.current = true;
		try {
			const response = await productsApi.getProducts({
				search: term,
				limit: 10,
			});
			const items = Array.isArray(response) ? response : response.data || [];
			setProducts(items);
		} catch (err) {
			console.error("Failed to search products:", err);
		} finally {
			inFlightRef.current = false;
		}
	};

	const handleSearchChange = useCallback((e) => {
		const term = e.target.value;
		setSearchTerm(term);
	}, []);

	// trigger product search when the debounced search term changes
	useEffect(() => {
		if (!debouncedSearch || !debouncedSearch.trim()) {
			setProducts([]);
			return;
		}

		let mounted = true;
		(async () => {
			try {
				await searchProducts(debouncedSearch);
			} catch (err) {
				if (mounted) console.error("Debounced search failed", err);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [debouncedSearch]);

	const selectProduct = (product, index) => {
		setValue(`sales.${index}.productId`, product.id);
		setShowProductSearch(false);
		setSearchTerm("");
		setProducts([]);
		setValue(`sales.${index}.maxQuantity`, product.totalQuantity || 0);
	};

	const addSaleItem = () => append({ productId: "", quantity: 1 });

	const handleFormSubmit = async (formValues) => {
		const submitFn = async (data) => {
			return await salesApi.commitSales(data);
		};

		await onSubmit(formValues, submitFn, {
			successMessage: "Sales transaction completed successfully!",
			onSuccess: () => {
				resetForm();
			},
		});
	};

	return (
		<div className="max-w-4xl mx-auto">
			<div className="bg-card shadow overflow-hidden sm:rounded-lg border border-border">
				<div className="px-4 py-5 sm:px-6">
					<h3 className="text-lg leading-6 font-medium text-card-foreground">
						Process Sales Transaction
					</h3>
					<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
						Add products and quantities to process a sales transaction.
					</p>
				</div>

				<form
					onSubmit={handleSubmit(handleFormSubmit)}
					className="border-t border-border">
					<div className="px-4 py-5 sm:px-6 space-y-6">
						{/* Sales Items */}
						<div>
							<h4 className="text-sm font-medium text-card-foreground mb-4">
								Products to Sell
							</h4>
							<div className="space-y-4">
								{fields.map((field, index) => (
									<div
										key={field.id}
										className="flex items-center space-x-4 p-4 border border-border rounded-lg bg-popover">
										<div className="flex-1">
											<Label className="block text-sm font-medium text-muted-foreground mb-1">
												Product
											</Label>
											{field.productName ? (
												<div className="flex items-center justify-between">
													<span className="text-sm text-card-foreground">
														{field.productName}
													</span>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => {
															setValue(`sales.${index}.productId`, "");
															setValue(`sales.${index}.productName`, "");
															setValue(`sales.${index}.maxQuantity`, 0);
														}}
														className="text-destructive hover:text-destructive-foreground">
														Change
													</Button>
												</div>
											) : (
												<div className="relative">
													<FormField
														type="text"
														name={`search_${index}`}
														placeholder="Search product..."
														value={
															showProductSearch &&
															index === fields.findIndex((s) => !s.productId)
																? searchTerm
																: ""
														}
														onChange={handleSearchChange}
														onFocus={() => setShowProductSearch(true)}
														className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-input text-input-foreground"
														errors={rhfErrors}
													/>
													{showProductSearch && products.length > 0 && (
														<div className="absolute z-10 mt-1 w-full bg-card shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-border overflow-auto focus:outline-none sm:text-sm">
															{products.map((product) => (
																<Button
																	key={product.id}
																	type="button"
																	variant="ghost"
																	onClick={() => selectProduct(product, index)}
																	className="w-full justify-start px-4 py-2 h-auto">
																	<div className="text-left">
																		<div className="font-medium text-card-foreground">
																			{product.name}
																		</div>
																		<div className="text-sm text-muted-foreground">
																			Stock: {product.totalQuantity} \u2022{" "}
																			{product.barcode}
																		</div>
																	</div>
																</Button>
															))}
														</div>
													)}
												</div>
											)}
										</div>

										<div className="w-32">
											<FormField
												type="number"
												{...register(`sales.${index}.quantity`, {
													valueAsNumber: true,
												})}
												label="Quantity"
												min="1"
												max={field.maxQuantity || 999}
												className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-input text-input-foreground"
												errors={rhfErrors}
											/>
											{field.maxQuantity && (
												<div className="text-xs text-muted-foreground mt-1">
													Max: {field.maxQuantity}
												</div>
											)}
										</div>

										{fields.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => remove(index)}
												className="text-destructive hover:text-destructive-foreground">
												<svg
													className="h-5 w-5"
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
											</Button>
										)}
									</div>
								))}
							</div>

							{hasPermission(user, "inventory:manage") ? (
								<Button
									type="button"
									variant="outline"
									onClick={addSaleItem}
									className="mt-4">
									<svg
										className="h-5 w-5 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 6v6m0 0v6m0-6h6m-6 0H6"
										/>
									</svg>
									Add Product
								</Button>
							) : (
								<p className="mt-4 text-sm text-muted-foreground">
									You don&#39;t have permission to add products to this sale.
								</p>
							)}
						</div>

						{/* Note */}
						<div>
							<FormField
								as="textarea"
								id="note"
								{...register("note")}
								name="note"
								label="Note (Optional)"
								rows={3}
								placeholder="Add a note for this sales transaction..."
								className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-input text-input-foreground"
								errors={rhfErrors}
							/>
						</div>

						{/* Error/Success Messages */}

						{/* field-level errors are shown inline via RHF errors */}

						{/* Submit Button */}
						<div className="flex justify-end">
							<Button type="submit" disabled={loading} size="lg">
								{loading ? (
									<>
										<svg
											className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground"
											fill="none"
											viewBox="0 0 24 24">
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Processing...
									</>
								) : (
									"Process Sale"
								)}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SalesCommit;
