// Removed unused useState import
import { productsApi } from "@/services/api";
import { addProductStockValidation } from "@/validation/product-validation";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useFormHandler } from "@/hooks/useFormHandler";

const AddProductStockModal = ({
	productId,
	productName,
	isPerishable = false,
	isOpen,
	onClose,
	onSuccess,
}) => {
	// Use unified form handler
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
		error,
		loading,
		onSubmit,
		resetForm,
	} = useFormHandler(addProductStockValidation, {
		mode: "onBlur",
		defaultValues: {
			quantity: 1,
			costPrice: 0,
			receivedAt: new Date().toISOString().split("T")[0], // Default to today
			expiredAt: "",
			note: "",
		},
		resetOnSuccess: true,
	});

	const handleFormSubmit = async (data) => {
		const submitFn = async (formData) => {
			console.log("Add stock form data:", formData);

			// Format data for API - only include expiredAt if product is perishable
			const stockData = {
				quantity: formData.quantity,
				costPrice: formData.costPrice,
				receivedAt: formData.receivedAt,
				...(isPerishable &&
					formData.expiredAt && { expiredAt: formData.expiredAt }),
				...(formData.note && { note: formData.note }),
			};

			return await productsApi.addProductStock(productId, stockData);
		};

		await onSubmit(data, submitFn, {
			successMessage: "Stock added successfully",
			onSuccess: () => {
				resetForm();
				onClose();
				if (onSuccess) {
					onSuccess();
				}
			},
		});
	};

	const handleClose = () => {
		if (!loading) {
			resetForm();
			onClose();
		}
	};

	if (!isOpen) return null;

	const footer = (
		<div className="flex justify-end space-x-3">
			<Button
				type="button"
				variant="outline"
				onClick={handleClose}
				disabled={loading}>
				Cancel
			</Button>
			<Button type="submit" form="add-stock-form" disabled={loading}>
				{loading ? "Adding..." : "Add Stock"}
			</Button>
		</div>
	);

	return (
		<Modal
			open={isOpen}
			onClose={handleClose}
			title={`Add Stock to ${productName}`}
			footer={footer}
			size="xl">
			<form
				id="add-stock-form"
				onSubmit={handleSubmit(handleFormSubmit)}
				className="space-y-4">
				{error && (
					<div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
						{error}
					</div>
				)}

				<div className="grid grid-cols-2 gap-4">
					<FormField
						name="quantity"
						label="Quantity"
						type="number"
						min="1"
						{...register("quantity", { valueAsNumber: true })}
						className="input-field"
						errors={errors}
						required
					/>

					<FormField
						name="costPrice"
						label="Cost Price"
						type="number"
						step="1"
						min="0"
						placeholder="0.00"
						{...register("costPrice", { valueAsNumber: true })}
						className="input-field"
						errors={errors}
						required
					/>
				</div>
				{isPerishable ? (
					<div className="grid grid-cols-2 gap-4">
						<DatePicker
							name="receivedAt"
							label="Received Date"
							value={watch("receivedAt")}
							onChange={(value) => setValue("receivedAt", value)}
							placeholder="Pilih tanggal diterima"
							errors={errors}
						/>
						<DatePicker
							name="expiredAt"
							label="Expiry Date"
							value={watch("expiredAt")}
							onChange={(value) => setValue("expiredAt", value)}
							placeholder="Pilih tanggal kadaluarsa"
							errors={errors}
						/>
					</div>
				) : (
					<DatePicker
						name="receivedAt"
						label="Received Date"
						value={watch("receivedAt")}
						onChange={(value) => setValue("receivedAt", value)}
						placeholder="Pilih tanggal diterima"
						errors={errors}
					/>
				)}

				<FormField
					as="textarea"
					name="note"
					label="Notes"
					{...register("note")}
					className="input-field resize-none"
					rows="3"
					placeholder="Additional notes..."
				/>
			</form>
		</Modal>
	);
};

export default AddProductStockModal;
