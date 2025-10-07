import { toast } from "sonner";

/**
 * Unified Toast utility for consistent notifications across the application
 * Uses Sonner for modern, accessible toast notifications
 */
export const useToast = () => {
	const showSuccess = (message, options = {}) => {
		return toast.success(message, {
			duration: 4000,
			...options,
		});
	};

	const showError = (message, options = {}) => {
		return toast.error(message, {
			duration: 5000,
			...options,
		});
	};

	const showWarning = (message, options = {}) => {
		return toast.warning(message, {
			duration: 4000,
			...options,
		});
	};

	const showInfo = (message, options = {}) => {
		return toast.info(message, {
			duration: 4000,
			...options,
		});
	};

	const showLoading = (message, options = {}) => {
		return toast.loading(message, {
			duration: Infinity,
			...options,
		});
	};

	const showPromise = (promise, messages, options = {}) => {
		return toast.promise(promise, {
			loading: messages.loading || "Loading...",
			success: messages.success || "Success!",
			error: messages.error || "Something went wrong!",
			...options,
		});
	};

	const dismiss = (toastId) => {
		if (toastId) {
			toast.dismiss(toastId);
		} else {
			toast.dismiss();
		}
	};

	return {
		success: showSuccess,
		error: showError,
		warning: showWarning,
		info: showInfo,
		loading: showLoading,
		promise: showPromise,
		dismiss,
		// Direct access to toast for advanced usage
		toast,
	};
};

/**
 * Direct toast functions for simple usage without hook
 */
export const toastUtils = {
	success: (message, options = {}) =>
		toast.success(message, { duration: 4000, ...options }),
	error: (message, options = {}) =>
		toast.error(message, { duration: 5000, ...options }),
	warning: (message, options = {}) =>
		toast.warning(message, { duration: 4000, ...options }),
	info: (message, options = {}) =>
		toast.info(message, { duration: 4000, ...options }),
	loading: (message, options = {}) =>
		toast.loading(message, { duration: Infinity, ...options }),
	promise: (promise, messages, options = {}) =>
		toast.promise(promise, {
			loading: messages.loading || "Loading...",
			success: messages.success || "Success!",
			error: messages.error || "Something went wrong!",
			...options,
		}),
	dismiss: (toastId) => (toastId ? toast.dismiss(toastId) : toast.dismiss()),
};

export default useToast;
