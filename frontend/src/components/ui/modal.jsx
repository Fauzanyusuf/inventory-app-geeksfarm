import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Unified modal component that consolidates BaseModal and ConfirmModal
 * Uses shadcn/ui Dialog for consistency
 */
const Modal = ({
	open,
	onClose,
	onCancel,
	title,
	children,
	footer,
	showCloseButton = true,
	className = "",
	size = "default",
	type = "default", // "default" | "confirm" | "alert"
}) => {
	const sizeClasses = {
		sm: "sm:max-w-sm",
		default: "sm:max-w-lg",
		lg: "sm:max-w-2xl",
		xl: "sm:max-w-4xl",
		"2xl": "sm:max-w-6xl",
	};

	const typeClasses = {
		default: "",
		confirm: "sm:max-w-md",
		alert: "sm:max-w-md",
	};

	const getSizeClass = () => {
		if (type !== "default") return typeClasses[type];
		return sizeClasses[size];
	};

	const handleOpenChange = (isOpen) => {
		if (!isOpen) {
			// If modal is closed (click outside or X button), use onCancel if available, otherwise use onClose
			if (onCancel) {
				onCancel();
			} else {
				onClose();
			}
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className={cn(getSizeClass(), className)}
				showCloseButton={showCloseButton}>
				{title && (
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>
							Please review the information and confirm your action.
						</DialogDescription>
					</DialogHeader>
				)}

				<div className="py-4">{children}</div>

				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	);
};

/**
 * Pre-configured confirm modal
 */
const ConfirmModal = ({
	open,
	onClose,
	onConfirm,
	onCancel,
	title = "Confirm",
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "destructive",
}) => {
	const footer = (
		<div className="flex justify-end gap-3">
			<Button variant="outline" onClick={onCancel || onClose}>
				{cancelText}
			</Button>
			<Button variant={variant} onClick={onConfirm}>
				{confirmText}
			</Button>
		</div>
	);

	return (
		<Modal
			open={open}
			onClose={onClose}
			onCancel={onCancel}
			title={title}
			footer={footer}
			type="confirm">
			<div className="text-sm text-muted-foreground">{message}</div>
		</Modal>
	);
};

/**
 * Pre-configured alert modal
 */
const AlertModal = ({
	open,
	onClose,
	title = "Alert",
	message,
	buttonText = "OK",
	variant = "default",
}) => {
	const footer = (
		<div className="flex justify-end">
			<Button variant={variant} onClick={onClose}>
				{buttonText}
			</Button>
		</div>
	);

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={title}
			footer={footer}
			type="alert">
			<div className="text-sm text-muted-foreground">{message}</div>
		</Modal>
	);
};

export { Modal, ConfirmModal, AlertModal };
