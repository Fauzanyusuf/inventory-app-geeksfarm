import { useEffect, useState, useRef } from "react";
import { rolesApi, usersApi } from "@/services/api";
import { approveUserValidation } from "@/validation/user-validation";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { useFormHandler } from "@/hooks/useFormHandler";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const ApproveUserModal = ({ user, open, onClose, onSuccess }) => {
	const [roles, setRoles] = useState([]);
	const inFlightRef = useRef(false);

	// Use unified form handler
	const {
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
		error,
		loading,
		onSubmit,
		resetForm,
	} = useFormHandler(approveUserValidation, {
		defaultValues: {
			roleId: null,
		},
		resetOnSuccess: true,
	});

	useEffect(() => {
		if (!open) return;
		let mounted = true;
		const fetchRoles = async () => {
			try {
				const res = await rolesApi.getRoles();
				const items = Array.isArray(res) ? res : res.data || [];
				if (mounted) {
					setRoles(items);
					setValue("roleId", items[0]?.id || "");
				}
			} catch (err) {
				console.error("Failed to load roles", err);
			}
		};
		fetchRoles();
		return () => {
			mounted = false;
		};
	}, [open, setValue]);

	if (!open) return null;

	const handleApprove = async (data) => {
		const submitFn = async (formData) => {
			if (inFlightRef.current) return;
			inFlightRef.current = true;

			try {
				return await usersApi.approveUser(user.id, formData.roleId);
			} finally {
				inFlightRef.current = false;
			}
		};

		await onSubmit(data, submitFn, {
			successMessage: "User approved successfully",
			onSuccess: () => {
				resetForm();
				if (onSuccess) onSuccess();
				onClose();
			},
		});
	};

	const footer = (
		<div className="flex justify-end gap-3">
			<Button variant="outline" onClick={onClose} disabled={loading}>
				Cancel
			</Button>
			<Button
				onClick={handleSubmit(handleApprove)}
				disabled={loading}
				aria-busy={loading}>
				{loading ? (
					<span className="inline-flex items-center gap-2">
						<LoadingSpinner size="sm" />
						<span>Approving...</span>
					</span>
				) : (
					"Approve & Assign Role"
				)}
			</Button>
		</div>
	);

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Verify user: {user.name}</DialogTitle>
					<DialogDescription>
						Assign a role before approving the account.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<SelectField
						name="roleId"
						label="Role"
						value={watch("roleId") || ""}
						onChange={(value) =>
							setValue("roleId", value === undefined ? "" : value)
						}
						placeholder="Select role"
						options={roles.map((r) => ({
							value: r.id,
							label: r.name,
						}))}
						errors={errors}
					/>

					{error && <div className="text-sm text-destructive">{error}</div>}
				</div>

				<DialogFooter>{footer}</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ApproveUserModal;
