import { useState, useCallback, useEffect, useRef } from "react";
import { usersApi } from "@/services/api";

const bustCache = (url) => {
	if (!url) return url;
	const sep = url.includes("?") ? "&" : "?";
	return `${url}${sep}t=${Date.now()}`;
};

export const useImageUpload = (user = null, options = {}) => {
	const {
		autoFetch = true,
		cacheBusting = true,
		maxFileSize = 5 * 1024 * 1024, // 5MB default
		acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
	} = options;

	const [imageUrl, setImageUrl] = useState(null);
	const [localPreview, setLocalPreview] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const imageInputRef = useRef(null);

	const userImageKey = user ? `${user.imageId || ""}${user.image || ""}` : null;

	const createObjectURL = useCallback((file) => {
		if (!(file instanceof File)) return null;
		return URL.createObjectURL(file);
	}, []);

	const revokeObjectURL = useCallback((url) => {
		if (typeof url !== "string") return;
		URL.revokeObjectURL(url);
	}, []);

	const validateFile = useCallback(
		(file) => {
			if (!file) return { valid: false, error: "No file provided" };

			if (!acceptedTypes.includes(file.type)) {
				return {
					valid: false,
					error: "Invalid file type. Please upload an image.",
				};
			}

			if (file.size > maxFileSize) {
				return {
					valid: false,
					error: `File size too large. Maximum size is ${Math.round(
						maxFileSize / 1024 / 1024
					)}MB.`,
				};
			}

			return { valid: true };
		},
		[acceptedTypes, maxFileSize]
	);

	const fetchImage = useCallback(
		async (force = false) => {
			if (!user)
				return { success: false, url: null, error: "No user provided" };

			if (!user.imageId && !user.image) {
				setImageUrl(null);
				return { success: true, url: null };
			}

			if (imageUrl && !force) {
				return { success: true, url: imageUrl };
			}

			try {
				setLoading(true);
				setError(null);
				const res = await usersApi.getCurrentUserImage();
				const data = res?.data || res;
				let newImageUrl = data?.url || null;

				if (newImageUrl && cacheBusting) {
					newImageUrl = bustCache(newImageUrl);
				}

				setImageUrl(newImageUrl);
				return { success: true, url: newImageUrl };
			} catch (error) {
				const errMsg = error?.message || "Failed to fetch image";
				setError(errMsg);
				return { success: false, url: imageUrl, error: errMsg };
			} finally {
				setLoading(false);
			}
		},
		[user, imageUrl, cacheBusting]
	);

	const uploadImage = useCallback(
		async (file) => {
			const validation = validateFile(file);
			if (!validation.valid) {
				setError(validation.error);
				return { success: false, url: null, error: validation.error };
			}

			try {
				setLoading(true);
				setError(null);
				const formData = new FormData();
				formData.append("image", file);
				await usersApi.uploadCurrentUserImage(formData);

				const { success, url } = await fetchImage(true);
				if (success && url) {
					const finalUrl = cacheBusting ? bustCache(url) : url;
					setImageUrl(finalUrl);
					return { success: true, url: finalUrl };
				}
				return { success: false, url: null, error: "Upload failed" };
			} catch (error) {
				const errMsg = error?.message || "Upload failed";
				setError(errMsg);
				return { success: false, url: null, error: errMsg };
			} finally {
				setLoading(false);
			}
		},
		[validateFile, fetchImage, cacheBusting]
	);

	const deleteImage = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			await usersApi.deleteCurrentUserImage();
			setImageUrl(null);
			setLocalPreview(null);
			setSelectedFile(null);
			return { success: true };
		} catch (error) {
			const errMsg = error?.message || "Delete failed";
			setError(errMsg);
			return { success: false, error: errMsg };
		} finally {
			setLoading(false);
		}
	}, []);

	const handleFileSelect = useCallback(
		(e) => {
			const file = e.target.files && e.target.files[0];
			if (!file) return;

			const validation = validateFile(file);
			if (!validation.valid) {
				setError(validation.error);
				return;
			}

			const url = createObjectURL(file);
			if (url) {
				setLocalPreview(url);
				setSelectedFile(file);
				setError(null);
			}
		},
		[validateFile, createObjectURL]
	);

	const handleUpload = useCallback(async () => {
		if (!selectedFile) return { success: false, error: "No file selected" };

		const result = await uploadImage(selectedFile);
		if (result.success) {
			revokeObjectURL(localPreview);
			setLocalPreview(null);
			setSelectedFile(null);
		}
		return result;
	}, [selectedFile, uploadImage, localPreview, revokeObjectURL]);

	const handleDelete = useCallback(async () => {
		const result = await deleteImage();
		if (result.success) {
			revokeObjectURL(localPreview);
			setLocalPreview(null);
			setSelectedFile(null);
		}
		return result;
	}, [deleteImage, localPreview, revokeObjectURL]);

	const clearLocalPreview = useCallback(() => {
		revokeObjectURL(localPreview);
		setLocalPreview(null);
		setSelectedFile(null);
		setError(null);
	}, [localPreview, revokeObjectURL]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Auto-fetch on mount or when user/image key changes
	useEffect(() => {
		if (autoFetch && userImageKey !== null) {
			fetchImage();
		}
	}, [autoFetch, userImageKey, fetchImage]);

	// Cleanup object URLs on unmount
	useEffect(() => {
		return () => {
			revokeObjectURL(localPreview);
		};
	}, [localPreview, revokeObjectURL]);

	return {
		// State
		imageUrl,
		localPreview,
		selectedFile,
		loading,
		error,

		// Actions
		fetchImage,
		uploadImage,
		deleteImage,
		handleFileSelect,
		handleUpload,
		handleDelete,
		clearLocalPreview,
		clearError,

		// Refs
		imageInputRef,

		// Utilities
		validateFile,
		bustCache: (url) => bustCache(url),
	};
};
