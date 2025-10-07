import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usersApi } from "@/services/api";
import { hasPermission } from "@/utils/permissions";
import { getErrorMessage } from "@/utils/errorUtils";
import ApproveUserModal from "@/features/users/components/ApproveUserModal";
import Pagination from "@/components/shared/Pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";

const UsersList = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [dataFetched, setDataFetched] = useState(false);
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		pageSize: 10,
	});
	const { user: authUser, loading: authLoading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (authLoading) return;
		if (!hasPermission(authUser, "user:read")) {
			navigate("/dashboard");
		}
	}, [authLoading, authUser, navigate]);
	const [approvingUser, setApprovingUser] = useState(null);
	const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
	const inFlightRef = useRef(false);

	const fetchUsers = useCallback(
		async (opts = { force: false }) => {
			if (inFlightRef.current) return;
			if (dataFetched && !opts.force) return;

			try {
				setLoading(true);
				inFlightRef.current = true;
				const params = {
					page: pagination.currentPage,
					limit: pagination.pageSize,
				};
				const response = await usersApi.getUsers(params);
				const items = Array.isArray(response) ? response : response.data || [];
				setUsers(items);

				// Update pagination info from API response
				const meta = Array.isArray(response) ? null : response.meta;
				if (meta) {
					setPagination((prev) => ({
						...prev,
						currentPage: meta.page || 1,
						totalPages: meta.totalPages || 1,
						totalItems: meta.total || 0,
						pageSize: meta.limit || 10,
					}));
				}
				setDataFetched(true);
			} catch (err) {
				console.error("Failed to fetch users:", err);
				setError(getErrorMessage(err, "users", "load"));
				setDataFetched(true);
			} finally {
				inFlightRef.current = false;
				setLoading(false);
			}
		},
		// only depend on pagination values — object identity changes are handled at call sites
		[pagination.currentPage, pagination.pageSize, dataFetched]
	);

	useEffect(() => {
		if (!dataFetched) {
			fetchUsers();
		}
	}, [dataFetched, fetchUsers]);

	// roles are loaded inside the ApproveUserModal when needed

	// Reset dataFetched when pagination changes
	useEffect(() => {
		setDataFetched(false);
	}, [pagination.currentPage, pagination.pageSize]);

	const handlePageChange = (page) => {
		setPagination((prev) => ({
			...prev,
			currentPage: page,
		}));
	};

	const handlePageSizeChange = (pageSize) => {
		setPagination((prev) => ({
			...prev,
			pageSize,
			currentPage: 1, // Reset to first page when changing page size
		}));
	};

	// use shared formatDate

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
					<p className="mt-4 text-muted-foreground">Loading users...</p>
				</div>
			</div>
		);
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
								Users ({pagination.totalItems})
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
																		<svg
																			className="h-6 w-6 text-primary-foreground"
																			fill="none"
																			stroke="currentColor"
																			viewBox="0 0 24 24">
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
																			/>
																		</svg>
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
																	<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
																		Verified
																	</span>
																) : (
																	<>
																		<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
																			Unverified
																		</span>
																		{hasPermission(authUser, "user:manage") && (
																			<button
																				type="button"
																				onClick={(e) => {
																					e.stopPropagation(); // Prevent navigation to user detail
																					setApprovingUser(u);
																					setIsApproveModalOpen(true);
																				}}
																				className="inline-flex items-center px-3 py-1 rounded-md text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors">
																				Approve
																			</button>
																		)}
																	</>
																)}
															</div>
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

									{/* Pagination */}
									<div className="bg-card px-4 py-3 border-t">
										<Pagination
											currentPage={pagination.currentPage}
											totalPages={pagination.totalPages}
											onPageChange={handlePageChange}
											onPageSizeChange={handlePageSizeChange}
											pageSize={pagination.pageSize}
											totalItems={pagination.totalItems}
										/>
									</div>
								</>
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
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
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
						// force a refetch of users after approve
						fetchUsers({ force: true });
					}}
				/>
			)}
		</div>
	);
};

export default UsersList;
