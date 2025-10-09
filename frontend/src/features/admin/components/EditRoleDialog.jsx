import { useState, useEffect } from "react";
import { rolesApi, accessPermissionsApi } from "@/services/api";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X } from "lucide-react";

const EditRoleDialog = ({ role, onRoleUpdated }) => {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	// Form state
	const [name, setName] = useState("");
	const [permissions, setPermissions] = useState([]);
	const [selectedPermissions, setSelectedPermissions] = useState(new Set());

	// Load data when dialog opens
	useEffect(() => {
		if (open && role) {
			setName(role.name || "");
			setSelectedPermissions(new Set(role.permissions?.map((p) => p.id) || []));
			loadPermissions();
		}
	}, [open, role]);

	const loadPermissions = async () => {
		try {
			setLoading(true);
			const response = await accessPermissionsApi.getAccessPermissions();
			const items = Array.isArray(response) ? response : response.data || [];
			setPermissions(items.filter((p) => !p.isDeleted));
		} catch (err) {
			console.error("Failed to load permissions:", err);
			setError("Failed to load permissions");
		} finally {
			setLoading(false);
		}
	};

	const handlePermissionToggle = (permissionId) => {
		const newSelected = new Set(selectedPermissions);
		if (newSelected.has(permissionId)) {
			newSelected.delete(permissionId);
		} else {
			newSelected.add(permissionId);
		}
		setSelectedPermissions(newSelected);
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			setError("");

			// Update permissions
			const permissionIds = Array.from(selectedPermissions);
			await rolesApi.updateRolePermissions(role.id, permissionIds);

			onRoleUpdated?.();
			setOpen(false);
		} catch (err) {
			console.error("Failed to update role:", err);
			setError("Failed to update role");
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		setName(role.name || "");
		setSelectedPermissions(new Set(role.permissions?.map((p) => p.id) || []));
		setError("");
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Edit className="w-4 h-4 mr-2" />
					Edit
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit Role: {role?.name}</DialogTitle>
					<DialogDescription>Update role permissions.</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Permissions */}
					<div className="space-y-4">
						<Label>Permissions</Label>
						{loading ? (
							<LoadingSpinner size="sm" text="Loading permissions..." />
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-md p-4">
								{permissions.map((permission) => (
									<div
										key={permission.id}
										className="flex items-center space-x-2">
										<Checkbox
											id={`perm-${permission.id}`}
											checked={selectedPermissions.has(permission.id)}
											onCheckedChange={() =>
												handlePermissionToggle(permission.id)
											}
										/>
										<Label
											htmlFor={`perm-${permission.id}`}
											className="text-sm font-normal cursor-pointer flex-1">
											{permission.accessKey}
										</Label>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Current Permissions Display */}
					{role?.permissions && role.permissions.length > 0 && (
						<div className="space-y-2">
							<Label>Current Permissions</Label>
							<div className="flex flex-wrap gap-2">
								{role.permissions.map((permission) => (
									<Badge key={permission.id} variant="secondary">
										{permission.accessKey}
									</Badge>
								))}
							</div>
						</div>
					)}

					{error && (
						<div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
							{error}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleCancel} disabled={saving}>
						<X className="w-4 h-4 mr-2" />
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={saving || !name.trim()}>
						{saving ? (
							<>
								<LoadingSpinner size="sm" />
								<span>Saving...</span>
							</>
						) : (
							<>
								<Save className="w-4 h-4 mr-2" />
								Save Changes
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default EditRoleDialog;
