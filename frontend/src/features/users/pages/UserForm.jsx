import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usersApi } from "@/services/api";
import { updateUserSchema } from "@/validation/user-validation";
import { FormField } from "@/components/ui/form-field";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useUserFormData } from "@/hooks/useUserFormData";
import { useImageUpload } from "@/hooks/useImageUpload";
import { SelectField } from "@/components/ui/select-field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormHandler } from "@/hooks/useFormHandler";
import { toastUtils } from "@/hooks/useToast";
import { User2Icon } from "lucide-react";

const UserForm = () => {
	const navigate = useNavigate();
	const { refreshToken } = useAuth();
	const confirm = useConfirm();

	// Use unified form handler
	const {
		register,
		handleSubmit,
		setValue,
		formState,
		watch,
		onSubmit: onSubmitForm,
		setError: setFormError,
	} = useFormHandler(updateUserSchema, {
		resetOnSuccess: false,
	});

	// Upload success state (specific to this form)
	const [, setUploadSuccess] = useState("");

	// Custom hooks for data management
	const {
		user,
		loading: userLoading,
		error: userError,
	} = useUserFormData(setValue);

	const {
		imageInputRef,
		localPreview,
		selectedFile,
		imageUrl,
		loading: uploadingImage,
		handleFileSelect,
		handleUpload,
		handleDelete,
	} = useImageUpload(user);

	const rhfErrors = formState.errors;

	// Handle user data loading errors
	useEffect(() => {
		if (userError) {
			setFormError(userError);
		}
	}, [userError, setFormError]);

	const handleFormSubmit = async (values) => {
		const submitFn = async (formData) => {
			await usersApi.updateCurrentUser(formData);
			await refreshToken().catch(() => {});
			return { success: true };
		};

		await onSubmitForm(values, submitFn, {
			successMessage: "Profile updated successfully!",
			onSuccess: () => {
				toastUtils.success("Profile updated successfully!");
				setUploadSuccess("");
			},
		});
	};

	const handleImageUpload = async () => {
		const success = await handleUpload();
		if (success) {
			toastUtils.success("Profile photo uploaded successfully!");
			setUploadSuccess("");
		} else {
			toastUtils.error("Failed to upload profile photo");
		}
	};

	const handleImageDelete = async () => {
		try {
			const confirmed = await confirm({
				title: "Delete Profile Photo",
				message:
					"Are you sure you want to delete this profile photo? This action cannot be undone.",
			});

			if (confirmed) {
				const result = await handleDelete();
				if (result.success) {
					setUploadSuccess("Profile photo deleted successfully!");
					setTimeout(() => setUploadSuccess(""), 3000);
				} else {
					setFormError("Failed to delete profile photo");
				}
			}
		} catch (err) {
			console.error("Error removing image:", err);
			setFormError("Failed to delete profile photo");
		}
	};

	return (
		<div className="form-container">
			<div className="form-card">
				{userLoading ? (
					<div className="loading-container">
						<div className="loading-spinner"></div>
						<span className="loading-text">Loading user data...</span>
					</div>
				) : (
					<div>
						<form
							onSubmit={handleSubmit(handleFormSubmit)}
							className="form-section">
							<div className="form-grid">
								<div>
									<FormField
										name="name"
										label="Full name"
										type="text"
										{...register("name")}
										className="mt-1 block w-full bg-popover text-popover-foreground border border-border rounded"
										errors={rhfErrors}
										required
									/>
								</div>
								<div>
									<FormField
										name="email"
										label="Email"
										type="email"
										{...register("email")}
										disabled
										className="mt-1 block w-full bg-popover text-popover-foreground border border-border rounded"
										errors={rhfErrors}
										required
									/>
								</div>

								{/* Profile image */}
								<div>
									<Label className="block text-sm font-medium text-muted-foreground">
										Profile photo
									</Label>
									<div className="mt-2 flex items-center space-x-4">
										<div className="h-16 w-16 rounded-full bg-popover overflow-hidden flex items-center justify-center border-2 border-border">
											{localPreview ? (
												<img
													src={localPreview}
													alt="New profile preview"
													className="h-full w-full object-cover"
												/>
											) : imageUrl ? (
												<img
													src={imageUrl}
													alt="Profile photo"
													className="h-full w-full object-cover"
												/>
											) : (
												<User2Icon className="bg-popover text-popover-foreground" />
											)}
										</div>
										<div className="flex items-center space-x-2">
											<Input
												ref={imageInputRef}
												type="file"
												accept="image/*"
												onChange={handleFileSelect}
												className="text-sm"
											/>
											{selectedFile && (
												<Button
													type="button"
													onClick={handleImageUpload}
													disabled={uploadingImage}
													size="sm">
													{uploadingImage ? "Uploading..." : "Upload"}
												</Button>
											)}
											{imageUrl && (
												<Button
													type="button"
													onClick={handleImageDelete}
													variant="destructive"
													size="sm">
													Remove
												</Button>
											)}
										</div>
									</div>
								</div>
								<div>
									<FormField
										name="phone"
										label="Phone"
										type="tel"
										{...register("phone")}
										className="mt-1 block w-full bg-popover text-popover-foreground border border-border rounded"
										errors={rhfErrors}
									/>
								</div>
								<div>
									<SelectField
										name="sex"
										label="Gender"
										value={watch("sex")}
										onChange={(value) => setValue("sex", value)}
										placeholder="Pilih gender"
										options={[
											{ value: "MALE", label: "Male" },
											{ value: "FEMALE", label: "Female" },
										]}
										errors={rhfErrors}
									/>
								</div>

								<div className="form-actions">
									<Button
										type="button"
										onClick={() => navigate(-1)}
										variant="outline">
										Cancel
									</Button>
									<Button type="submit" disabled={formState.isSubmitting}>
										{formState.isSubmitting ? "Saving..." : "Save"}
									</Button>
								</div>
							</div>
						</form>
					</div>
				)}
			</div>
		</div>
	);
};

export default UserForm;
