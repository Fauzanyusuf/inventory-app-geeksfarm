import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { accessPermissionsApi, rolesApi } from "@/services/api";

const AccessPermissionDetail = () => {
	const { id } = useParams();
	const [permission, setPermission] = useState(null);
	const [roles, setRoles] = useState([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const { user: authUser } = useAuth();

	// Require appropriate permission to access this page
	// For now, we'll allow access to users who can view access permissions
	useEffect(() => {
		// This might need adjustment based on backend permissions
		// For now, allow access to authenticated users who can view permissions
		if (!authUser) {
			navigate("/login");
			return;
		}
	}, [authUser, navigate]);

	const fetchPermissionDetail = useCallback(async () => {
		try {
			setLoading(true);
			const response = await accessPermissionsApi.getAccessPermission(id);
			const permissionData =
				response && response.data !== undefined ? response.data : response;
			if (!permissionData) {
				navigate("/dashboard");
				return;
			}
			setPermission(permissionData || null);

			// Also fetch roles to show which roles have this permission
			const rolesResponse = await rolesApi.getRoles();
			const rolesData = Array.isArray(rolesResponse)
				? rolesResponse
				: rolesResponse.data || [];

			// Filter roles that have this permission
			const rolesWithPermission = rolesData.filter((role) => {
				const permissions = role.permissions || [];
				return permissions.some((perm) => {
					const permKey = typeof perm === "string" ? perm : perm.accessKey;
					return permKey === permissionData?.accessKey;
				});
			});

			setRoles(rolesWithPermission);
		} catch (err) {
			console.error("Failed to fetch permission:", err);
			navigate("/dashboard");
			return;
		} finally {
			setLoading(false);
		}
	}, [id, navigate]);

	useEffect(() => {
		if (id && authUser) {
			fetchPermissionDetail();
		}
	}, [id, authUser, fetchPermissionDetail]);

	if (!authUser) {
		return null; // Will redirect in useEffect
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div
						className="animate-spin rounded-full h-12 w-12 border-b-2"
						style={{ borderColor: "var(--color-primary)" }}></div>
					<p className="mt-4 text-muted-foreground">
						Loading permission details...
					</p>
				</div>
			</div>
		);
	}

	if (!permission) {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Main Content */}
			<main className="max-w-7xl mx-auto">
				<div>
					<div className="bg-card shadow overflow-hidden sm:rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
										<svg
											className="h-6 w-6 text-primary-foreground"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
								</div>
								<div className="ml-4">
									<h3 className="text-lg leading-6 font-medium text-card-foreground">
										{permission.accessKey}
									</h3>
									<p className="text-sm text-muted-foreground">
										Access Permission
									</p>
								</div>
							</div>
						</div>
						<div
							className="border-t"
							style={{ borderColor: "var(--color-border)" }}>
							<dl className="striped sm:grid">
								<div className="px-4 py-5 sm:px-6">
									<dt>Permission Key</dt>
									<dd>
										<code className="bg-muted px-2 py-1 rounded text-xs font-mono">
											{permission.accessKey}
										</code>
									</dd>
								</div>
								<div className="px-4 py-5 sm:px-6">
									<dt>Description</dt>
									<dd>
										{permission.description || "No description available"}
									</dd>
								</div>
								<div className="px-4 py-5 sm:px-6">
									<dt>Module</dt>
									<dd>{permission.module || "General"}</dd>
								</div>
								<div className="px-4 py-5 sm:px-6">
									<dt>Assigned Roles ({roles.length})</dt>
									<dd>
										{roles.length > 0 ? (
											<div className="flex flex-wrap gap-2">
												{roles.map((role) => (
													<span
														key={role.id}
														className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
														{role.name}
													</span>
												))}
											</div>
										) : (
											<span className="text-muted-foreground">
												No roles assigned
											</span>
										)}
									</dd>
								</div>
								<div className="px-4 py-5 sm:px-6">
									<dt>Created At</dt>
									<dd>
										{permission.createdAt
											? new Date(permission.createdAt).toLocaleString()
											: "N/A"}
									</dd>
								</div>
								<div className="px-4 py-5 sm:px-6">
									<dt>Last Updated</dt>
									<dd>
										{permission.updatedAt
											? new Date(permission.updatedAt).toLocaleString()
											: "N/A"}
									</dd>
								</div>
							</dl>
						</div>
					</div>

					{/* Roles with this Permission */}
					{roles.length > 0 && (
						<div className="mt-8">
							<div className="bg-card shadow overflow-hidden sm:rounded-lg">
								<div className="px-4 py-5 sm:px-6">
									<h3 className="text-lg leading-6 font-medium text-card-foreground">
										Roles with this Permission
									</h3>
									<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
										All roles that have been assigned this permission.
									</p>
								</div>
								<div
									className="border-t"
									style={{ borderColor: "var(--color-border)" }}>
									<ul className="divide-y divide-border">
										{roles.map((role) => (
											<li key={role.id} className="px-4 py-4 sm:px-6">
												<div className="flex items-center">
													<div className="flex-shrink-0">
														<div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
															<svg
																className="h-5 w-5 text-secondary-foreground"
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
														</div>
													</div>
													<div className="ml-4">
														<div className="text-sm font-medium text-card-foreground">
															{role.name}
														</div>
														<div className="text-sm text-muted-foreground">
															{role.description || "No description"}
														</div>
													</div>
												</div>
											</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					)}

					{/* Back Button */}
					<div className="mt-6">
						<button
							onClick={() => navigate("/access-permissions")}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
							<svg
								className="w-4 h-4 mr-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							Back to Permissions List
						</button>
					</div>
				</div>
			</main>
		</div>
	);
};

export default AccessPermissionDetail;
