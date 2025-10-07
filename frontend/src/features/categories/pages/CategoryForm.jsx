import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { FormField } from "@/components/ui/form-field";
import { categoriesApi } from "@/services/api";
import {
	categoryCreateSchema,
	categoryUpdateSchema,
} from "@/validation/category-validation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useFormHandler } from "@/hooks/useFormHandler";

const CategoryForm = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const confirm = useConfirm();

	const isEdit = Boolean(id);
	const schema = isEdit ? categoryUpdateSchema : categoryCreateSchema;

	// Use unified form handler
	const {
		register,
		handleSubmit,
		formState,
		loading,
		onSubmit,
		loadData,
		setError: setFormError,
		setSuccess: setFormSuccess,
	} = useFormHandler(schema, {
		defaultValues: { name: "", description: "" },
		resetOnSuccess: false,
	});

	const { errors: rhfErrors } = formState;

	// Image state (specific to this form)
	const [imageFile, setImageFile] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [currentImageUrl, setCurrentImageUrl] = useState(null);
	const [imageUploading, setImageUploading] = useState(false);

	useEffect(() => {
		if (isEdit && id) {
			const fetchCategory = async () => {
				try {
					const response = await categoriesApi.getCategory(id);
					const category =
						response && response.data !== undefined ? response.data : response;

					// Load form data using unified handler
					loadData(category);

					const imageResponse = await categoriesApi.getCategoryImage(id);
					if (imageResponse) {
						setCurrentImageUrl(imageResponse.url);
					}
				} catch (err) {
					console.error("Failed to fetch category:", err);
					// Error will be handled by useFormHandler
				}
			};
			fetchCategory();
		}
	}, [isEdit, id, loadData]);

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setImageFile(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const handleRemoveImage = async () => {
		try {
			const confirmed = await confirm({
				title: "Hapus Foto Kategori",
				message:
					"Apakah Anda yakin ingin menghapus foto kategori ini? Tindakan ini tidak dapat dibatalkan.",
			});

			if (confirmed) {
				// Jika sedang dalam mode edit dan ada currentImageUrl, hapus dari server
				if (isEdit && id && currentImageUrl) {
					try {
						await categoriesApi.deleteCategoryImage(id);
						setFormSuccess("Category photo successfully deleted");
					} catch (apiError) {
						console.error("Error deleting image from server:", apiError);
						setFormError("Failed to delete photos from the server");
						return;
					}
				}

				// Reset state lokal
				setImageFile(null);
				setImagePreview(null);
				if (currentImageUrl) {
					URL.revokeObjectURL(currentImageUrl);
					setCurrentImageUrl(null);
				}
			}
		} catch (err) {
			console.error("Error removing image:", err);
			setFormError("Failed to delete category photos");
		}
	};

	const uploadImage = async (categoryId) => {
		if (!imageFile) return;

		setImageUploading(true);
		try {
			const formData = new FormData();
			formData.append("image", imageFile);
			await categoriesApi.uploadCategoryImage(categoryId, formData);
		} catch (err) {
			console.error("Failed to upload image:", err);
			throw new Error("Failed to upload category image");
		} finally {
			setImageUploading(false);
		}
	};

	const deleteCurrentImage = async (categoryId) => {
		if (!currentImageUrl) return;

		try {
			await categoriesApi.deleteCategoryImage(categoryId);
		} catch (err) {
			console.error("Failed to delete current image:", err);
			// Don't throw error here as it's not critical
		}
	};

	const handleFormSubmit = async (values) => {
		const submitFn = async (data) => {
			let categoryId;

			if (isEdit) {
				await categoriesApi.updateCategory(id, data);
				categoryId = id;

				// Handle image changes for existing category
				if (imageFile) {
					// Delete current image if exists, then upload new one
					await deleteCurrentImage(categoryId);
					await uploadImage(categoryId);
				} else if (!imagePreview && currentImageUrl) {
					// User removed the image
					await deleteCurrentImage(categoryId);
				}

				return { id: categoryId };
			} else {
				// Create new category first
				const newCategory = await categoriesApi.createCategory(data);
				categoryId = newCategory.id || newCategory.data?.id;

				// Upload image if provided
				if (imageFile) {
					await uploadImage(categoryId);
				}

				return { id: categoryId };
			}
		};

		await onSubmit(values, submitFn, {
			successMessage: isEdit
				? "Category updated successfully"
				: "Category created successfully",
			onSuccess: () => {
				navigate("/categories");
			},
		});
	};

	return (
		<div className="form-container">
			<div className="form-card">
				{loading && (
					<div className="loading-container">
						<div className="loading-spinner"></div>
						<span className="loading-text">Loading category...</span>
					</div>
				)}
				{!loading && (
					<>
						<form
							onSubmit={handleSubmit(handleFormSubmit)}
							className="form-section">
							<div className="form-grid">
								<div>
									<FormField
										name="name"
										label="Name"
										type="text"
										{...register("name")}
										className="mt-1 block w-full"
										errors={rhfErrors}
										required
									/>
								</div>

								<div>
									<FormField
										as="textarea"
										name="description"
										label="Description"
										{...register("description")}
										className="mt-1 block w-full"
										errors={rhfErrors}
										rows={4}
									/>
								</div>

								<div>
									<Label className="block text-sm font-medium text-muted-foreground">
										Category Image
									</Label>
									<div className="mt-1 flex items-center space-x-4">
										{(imagePreview || currentImageUrl) && (
											<div className="relative">
												<img
													src={imagePreview || currentImageUrl}
													alt="Category preview"
													className="w-32 h-32 object-cover rounded-lg border border-border"
												/>
												<Button
													type="button"
													onClick={handleRemoveImage}
													variant="destructive"
													size="sm"
													className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0">
													<svg
														className="w-3 h-3"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24">
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												</Button>
											</div>
										)}
										<div className="flex-1">
											<Input
												type="file"
												accept="image/*"
												onChange={handleImageChange}
											/>
											<p className="mt-1 text-xs text-muted-foreground">
												Upload a category image (optional). Supported formats:
												JPG, PNG, GIF.
											</p>
											{imageUploading && (
												<p className="mt-1 text-xs text-blue-600">
													Uploading image...
												</p>
											)}
										</div>
									</div>
								</div>

								<div className="form-actions">
									<Button
										type="button"
										onClick={() => navigate("/categories")}
										variant="outline">
										Cancel
									</Button>
									<Button type="submit" disabled={formState.isSubmitting}>
										{formState.isSubmitting ? "Saving..." : "Save Category"}
									</Button>
								</div>
							</div>
						</form>
					</>
				)}
			</div>
		</div>
	);
};

export default CategoryForm;
