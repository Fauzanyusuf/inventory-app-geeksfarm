import { useCallback, useEffect, useState } from "react";
import { rolesApi } from "@/services/api";
import { formatDate } from "@/utils/format";
import EditRoleDialog from "../components/EditRoleDialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const RolesList = () => {
	const [roles, setRoles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [dataFetched, setDataFetched] = useState(false);

	const fetchRoles = useCallback(async () => {
		if (dataFetched) return; // Prevent multiple calls

		try {
			setLoading(true);
			const response = await rolesApi.getRoles();
			const items = Array.isArray(response) ? response : response.data || [];
			setRoles(items);
			setDataFetched(true);
		} catch (err) {
			console.error("Failed to fetch roles:", err);
			setError("Failed to load roles");
			setDataFetched(true); // Mark as fetched even on error
		} finally {
			setLoading(false);
		}
	}, [dataFetched]);

	useEffect(() => {
		if (!dataFetched) {
			fetchRoles();
		}
	}, [dataFetched, fetchRoles]);

	const handleRoleUpdated = () => {
		setDataFetched(false); // Trigger refetch
	};

	if (loading) {
		return <LoadingSpinner size="lg" text="Loading roles..." fullScreen />;
	}

	return (
		<main className="max-w-7xl mx-auto">
			<Card>
				<CardHeader>
					<CardTitle>System Roles ({roles.length})</CardTitle>
					<CardDescription>
						Manage system roles and their associated permissions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					{roles.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Role Name</TableHead>
									<TableHead>Permissions</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{roles.map((role) => (
									<TableRow key={role.id}>
										<TableCell className="font-medium">{role.name}</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-1">
												{role.permissions && role.permissions.length > 0 ? (
													<>
														{role.permissions.map((permission) => (
															<Badge
																key={permission.id}
																variant="secondary"
																className="text-xs">
																{permission.accessKey}
															</Badge>
														))}
													</>
												) : (
													<span className="text-sm text-muted-foreground">
														No permissions
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{formatDate(role.createdAt)}
										</TableCell>
										<TableCell className="text-right">
											<EditRoleDialog
												role={role}
												onRoleUpdated={handleRoleUpdated}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="text-center py-12">
							<svg
								className="mx-auto h-12 w-12 text-muted-foreground"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							<h3 className="mt-2 text-sm font-medium text-card-foreground">
								No roles found
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								System roles will appear here.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</main>
	);
};

export default RolesList;
