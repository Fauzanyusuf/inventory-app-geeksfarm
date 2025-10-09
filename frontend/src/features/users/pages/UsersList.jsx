import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usersApi } from "@/services/api";
import { hasPermission } from "@/utils/permissions";
import { useResourceData } from "@/hooks/useResourceData";
import { usePaginationParams } from "@/hooks/usePaginationParams";
import ApproveUserModal from "@/features/users/components/ApproveUserModal";
import Pagination from "@/components/shared/Pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, ChevronRight, Users } from "lucide-react";

const UsersList = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { user: authUser, loading: authLoading } = useAuth();
	const { handlePageChange, handlePageSizeChange } = usePaginationParams();

	// Build query params function
	const buildQueryParams = useCallback(
		(validated) => ({
			page: validated.page,
			limit: validated.limit,
		}),
		[]
	);

	// Use generic resource data hook
	const {
		data: users,
		meta,
		loading,
		error,
		validated,
		totalPages,
		refetch,
	} = useResourceData({
		api: usersApi.getUsers,
		schema: null, // Basic validation handled in hook
		searchParams,
		buildParams: buildQueryParams,
		resourceName: "users",
		options: {
			onError: (err, _errorMessage) => {
				console.error("Failed to fetch users:", err);
			},
		},
	});

	// Modal state
	const [approvingUser, setApprovingUser] = useState(null);
	const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

	// Permission check
	useEffect(() => {
		if (authLoading) return;
		if (!hasPermission(authUser, "user:read")) {
			navigate("/dashboard");
		}
	}, [authLoading, authUser, navigate]);

	if (loading) {
		return <LoadingSpinner size="lg" text="Loading users..." />;
	}

	return (
		<div className="space-y-6">
			{/* Main Content */}
			<main className="max-w-7xl mx-auto">
				<div>
					{/* Users List */}
					<div className="bg-card shadow overflow-hidden sm:rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg leading-6 font-medium text-card-foreground">
								Users ({meta?.total || 0})
							</h3>
							<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
								Manage system users and their roles.
							</p>
						</div>

						{error && (
							<div className="px-4 py-4 sm:px-6">
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							</div>
						)}

						<div className="border-t-2 border-border">
							{users.length > 0 ? (
								<>
									<ul className="divide-y divide-border">
										{users.map((u) => (
											<li key={u.id}>
												<div
													className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-muted/50 transition-colors"
													onClick={() => navigate(`/users/${u.id}`)}>
													<div className="flex items-center justify-between">
														<div className="flex items-center">
															<div className="flex-shrink-0 h-10 w-10">
																{u.image ? (
																	<img
																		className="rounded-full h-full w-full object-cover"
																		src={u.image.url}
																		alt={u.image.altText || u.name}
																	/>
																) : (
																	<div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
																		<User className="h-6 w-6 text-primary-foreground" />
																	</div>
																)}
															</div>
															<div className="ml-4">
																<div className="text-sm font-medium text-card-foreground">
																	{u.name}
																</div>
																<div className="text-sm text-muted-foreground">
																	{u.email}
																</div>
															</div>
														</div>
														<div className="text-right flex items-center space-x-2">
															<div className="text-sm font-medium text-card-foreground">
																{u.role?.name || "No Role"}
															</div>
															<div className="text-sm text-muted-foreground flex items-center space-x-2">
																{u.isVerified ? (
																	<Badge
																		variant="secondary"
																		className="bg-green-100 text-green-800 hover:bg-green-100">
																		Verified
																	</Badge>
																) : (
																	<>
																		<Badge
																			variant="secondary"
																			className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
																			Unverified
																		</Badge>
																		{hasPermission(authUser, "user:manage") && (
																			<Button
																				size="sm"
																				variant="default"
																				onClick={(e) => {
																					e.stopPropagation(); // Prevent navigation to user detail
																					setApprovingUser(u);
																					setIsApproveModalOpen(true);
																				}}
																				className="h-6 px-2 text-xs">
																				Approve
																			</Button>
																		)}
																	</>
																)}
															</div>
															<ChevronRight className="w-4 h-4 text-muted-foreground" />
														</div>
													</div>
												</div>
											</li>
										))}
									</ul>

									{/* Pagination */}
									<div className="bg-card px-4 py-3 border-t">
										<Pagination
											currentPage={validated?.page || 1}
											totalPages={totalPages}
											onPageChange={handlePageChange}
											onPageSizeChange={handlePageSizeChange}
											pageSize={validated?.limit || 10}
											totalItems={meta?.total || 0}
										/>
									</div>
								</>
							) : (
								<div className="text-center py-12">
									<Users className="mx-auto h-12 w-12 text-muted-foreground" />
									<h3 className="mt-2 text-sm font-medium text-card-foreground">
										No users found
									</h3>
									<p className="mt-1 text-sm text-muted-foreground">
										Users will appear here once they register.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
			{approvingUser && (
				<ApproveUserModal
					user={approvingUser}
					open={isApproveModalOpen}
					onClose={() => {
						setIsApproveModalOpen(false);
						setApprovingUser(null);
					}}
					onSuccess={() => {
						// refetch users after approve
						refetch();
					}}
				/>
			)}
		</div>
	);
};

export default UsersList;
