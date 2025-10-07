import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { accessPermissionsApi, rolesApi } from "@/services/api";

const AccessPermissions = () => {
	const [permissions, setPermissions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [dataFetched, setDataFetched] = useState(false);
	const navigate = useNavigate();

	const fetchPermissions = useCallback(async () => {
		if (dataFetched) return;

		try {
			setLoading(true);
			const response = await accessPermissionsApi.getAccessPermissions();
			const items = Array.isArray(response) ? response : response.data || [];

			const needRoleEnrichment = items.some((p) => !Array.isArray(p.roles));
			if (needRoleEnrichment) {
				try {
					const rolesRes = await rolesApi.getRoles();
					const rolesList = Array.isArray(rolesRes)
						? rolesRes
						: rolesRes.data || [];
					const map = new Map();
					for (const role of rolesList) {
						const perms = role.permissions || [];
						for (const perm of perms) {
							const key = typeof perm === "string" ? perm : perm.accessKey;
							if (!key) continue;
							if (!map.has(key)) map.set(key, []);
							map.get(key).push({ id: role.id, name: role.name });
						}
					}

					const enriched = items.map((p) => {
						const key = p.accessKey || (p.key && p.key.accessKey) || null;
						if (!Array.isArray(p.roles) && key) {
							return { ...p, roles: map.get(key) || [] };
						}
						return p;
					});
					setPermissions(enriched);
				} catch (e) {
					console.debug("Role enrichment failed", e);
					setPermissions(items);
				}
			} else {
				setPermissions(items);
			}
			setDataFetched(true);
		} catch (err) {
			console.error("Failed to fetch permissions:", err);
			setError("Failed to load permissions");
			setDataFetched(true);
		} finally {
			setLoading(false);
		}
	}, [dataFetched]);

	useEffect(() => {
		if (!dataFetched) {
			fetchPermissions();
		}
	}, [dataFetched, fetchPermissions]);

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div
						className="animate-spin rounded-full h-12 w-12 border-b-2"
						style={{ borderColor: "var(--color-primary)" }}></div>
					<p className="mt-4 text-muted-foreground">Loading permissions...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Main Content */}
			<main className="max-w-7xl mx-auto">
				<div>
					{/* Permissions List */}
					<div className="bg-card shadow overflow-hidden sm:rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg leading-6 font-medium text-card-foreground">
								System Permissions ({permissions.length})
							</h3>
							<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
								View all access permissions and their associated roles.
							</p>
						</div>

						{error && (
							<div className="px-4 py-4 sm:px-6">
								<div className="bg-warning border border-warning text-warning-foreground px-4 py-3 rounded-md">
									{error}
								</div>
							</div>
						)}

						<div
							className="border-t"
							style={{ borderColor: "var(--color-border)" }}>
							{permissions.length > 0 ? (
								<ul
									className="divide-y"
									style={{ borderColor: "var(--color-border)" }}>
									{permissions.map((permission) => (
										<li key={permission.id}>
											<div
												className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-muted/50 transition-colors"
												onClick={() =>
													navigate(`/permissions/${permission.id}`)
												}>
												<div className="flex items-center justify-between">
													<div className="flex-1">
														<div className="flex items-center">
															<div className="flex-shrink-0">
																<div className="h-10 w-10 rounded-full bg-popover flex items-center justify-center">
																	<svg
																		className="h-6 w-6 text-popover-foreground"
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
																<div className="text-sm font-medium text-card-foreground">
																	{permission.accessKey}
																</div>
																<div className="text-sm text-muted-foreground">
																	{permission.roles?.length || 0} roles assigned
																</div>
															</div>
														</div>
													</div>
													<div className="flex items-center space-x-2">
														{permission.roles &&
															permission.roles.length > 0 && (
																<div className="flex flex-wrap gap-1 justify-end">
																	{permission.roles.slice(0, 2).map((role) => (
																		<span
																			key={role.id}
																			className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-popover text-popover-foreground">
																			{role.name}
																		</span>
																	))}
																	{permission.roles.length > 2 && (
																		<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-popover text-popover-foreground">
																			+{permission.roles.length - 2} more
																		</span>
																	)}
																</div>
															)}
														<svg
															className="w-4 h-4 text-muted-foreground"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24">
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M9 5l7 7-7 7"
															/>
														</svg>
													</div>
												</div>
											</div>
										</li>
									))}
								</ul>
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
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<h3 className="mt-2 text-sm font-medium text-card-foreground">
										No permissions found
									</h3>
									<p className="mt-1 text-sm text-muted-foreground">
										System permissions will appear here.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default AccessPermissions;
