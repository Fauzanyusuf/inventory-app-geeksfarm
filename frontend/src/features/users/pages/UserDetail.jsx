import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usersApi } from "@/services/api";
import { hasPermission } from "@/utils/permissions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BackButton } from "@/components/shared";

const UserDetail = () => {
	const { id } = useParams();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const { user: authUser } = useAuth();

	// Require user:read permission to access this page
	useEffect(() => {
		if (!hasPermission(authUser, "user:read")) {
			navigate("/dashboard");
			return;
		}
	}, [authUser, navigate]);

	const fetchUserDetail = useCallback(async () => {
		try {
			setLoading(true);
			const response = await usersApi.getUser(id);
			const userData =
				response && response.data !== undefined ? response.data : response;
			if (!userData) {
				// invalid id or not found -> redirect to dashboard
				navigate("/dashboard");
				return;
			}
			setUser(userData || null);
		} catch (err) {
			console.error("Failed to fetch user:", err);
			// redirect to dashboard on fetch error
			navigate("/dashboard");
			return;
		} finally {
			setLoading(false);
		}
	}, [id, navigate]);

	useEffect(() => {
		if (id && hasPermission(authUser, "user:read")) {
			fetchUserDetail();
		}
	}, [id, authUser, fetchUserDetail]);

	if (!hasPermission(authUser, "user:read")) {
		return null; // Will redirect in useEffect
	}

	if (loading) {
		return (
			<LoadingSpinner size="lg" text="Loading user details..." fullScreen />
		);
	}

	if (!user) {
		// If user is missing after loading, the fetch should have redirected.
		return null;
	}

	return (
		<div className="form-container">
			<div className="page-content">
				<div className="page-content-header">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							{user.image ? (
								<img
									className="h-16 w-16 rounded-full object-cover"
									src={user.image.url}
									alt={user.image.altText || user.name}
								/>
							) : (
								<div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
									<svg
										className="h-8 w-8 text-primary-foreground"
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
							<h3 className="page-title">{user.name}</h3>
							<p className="text-sm text-muted-foreground">{user.email}</p>
						</div>
					</div>
					<div className="border-t border-border">
						<dl className="striped sm:grid">
							<div className="px-4 py-5 sm:px-6">
								<dt>Full Name</dt>
								<dd>{user.name}</dd>
							</div>
							<div className="px-4 py-5 sm:px-6">
								<dt>Email</dt>
								<dd>{user.email}</dd>
							</div>
							<div className="px-4 py-5 sm:px-6">
								<dt>Phone</dt>
								<dd>{user.phone || "Not provided"}</dd>
							</div>
							<div className="px-4 py-5 sm:px-6">
								<dt>Gender</dt>
								<dd>
									{user.sex
										? user.sex === "MALE"
											? "Male"
											: "Female"
										: "Not specified"}
								</dd>
							</div>
							<div className="px-4 py-5 sm:px-6">
								<dt>Role</dt>
								<dd>{user.role?.name || "No role assigned"}</dd>
							</div>
							<div className="px-4 py-5 sm:px-6">
								<dt>Status</dt>
								<dd>
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											user.isVerified
												? "bg-green-100 text-green-800"
												: "bg-yellow-100 text-yellow-800"
										}`}>
										{user.isVerified ? "Verified" : "Unverified"}
									</span>
								</dd>
							</div>
						</dl>
					</div>
				</div>

				{/* Back Button */}
				<div className="mt-6">
					<BackButton to="/users">Back to Users List</BackButton>
				</div>
			</div>
		</div>
	);
};

export default UserDetail;
