import { useCallback, useEffect, useState } from "react";
import { rolesApi } from "@/services/api";
import { formatDate } from "@/utils/format";

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

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div
						className="animate-spin rounded-full h-12 w-12 border-b-2"
						style={{ borderColor: "var(--color-primary)" }}></div>
					<p className="mt-4 text-muted-foreground">Loading roles...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Main Content */}
			<main className="max-w-7xl mx-auto">
				<div>
					{/* Roles List */}
					<div className="bg-card shadow overflow-hidden sm:rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg leading-6 font-medium text-card-foreground">
								System Roles ({roles.length})
							</h3>
							<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
								Manage system roles and their associated permissions.
							</p>
						</div>

						{error && (
							<div className="px-4 py-4 sm:px-6">
								<div className="bg-yellow-50 border-yellow-200 border rounded-md p-4">
									<div className="flex">
										<div className="flex-shrink-0">
											<svg
												className="h-5 w-5 text-yellow-400"
												viewBox="0 0 20 20"
												fill="currentColor">
												<path
													fillRule="evenodd"
													d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
													clipRule="evenodd"
												/>
											</svg>
										</div>
										<div className="ml-3">
											<p className="text-sm text-yellow-800">{error}</p>
										</div>
									</div>
								</div>
							</div>
						)}

						<div
							className="border-t"
							style={{ borderColor: "var(--color-border)" }}>
							{roles.length > 0 ? (
								<ul
									className="divide-y"
									style={{ borderColor: "var(--color-border)" }}>
									{roles.map((role) => (
										<li key={role.id}>
											<div className="px-4 py-4 sm:px-6">
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
																	{role.permissions?.length || 0} permissions
																	assigned
																</div>
															</div>
														</div>
													</div>
													<div className="flex flex-col items-end">
														{role.permissions &&
															role.permissions.length > 0 && (
																<div className="flex flex-wrap gap-1 mb-2">
																	{role.permissions
																		.slice(0, 3)
																		.map((permission) => (
																			<span
																				key={permission.id}
																				className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-popover text-popover-foreground">
																				{permission.accessKey}
																			</span>
																		))}
																	{role.permissions.length > 3 && (
																		<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-popover text-popover-foreground">
																			+{role.permissions.length - 3} more
																		</span>
																	)}
																</div>
															)}
														<div className="text-xs text-muted-foreground">
															Created: {formatDate(role.createdAt)}
														</div>
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
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default RolesList;
