import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { hasPermission } from "@/utils/permissions";
import { useState, useEffect } from "react";
import {
	productsApi,
	categoriesApi,
	usersApi,
	auditLogsApi,
} from "@/services/api";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
	Package,
	Tags,
	Users,
	Warehouse,
	Shield,
	ShoppingCart,
	FileText,
	Key,
} from "lucide-react";

const Dashboard = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	// Statistics state
	const [stats, setStats] = useState({
		totalProducts: 0,
		totalCategories: 0,
		totalUsers: 0,
		totalAuditLogs: 0,
		loading: true,
		error: null,
	});

	// Fetch dashboard statistics
	useEffect(() => {
		const controller = new AbortController();

		const fetchStats = async () => {
			try {
				setStats((prev) => ({ ...prev, loading: true, error: null }));

				const [productsRes, categoriesRes, usersRes, auditRes] =
					await Promise.allSettled([
						productsApi.getProducts({ limit: 0 }),
						categoriesApi.getCategories({ limit: 0 }),
						usersApi.getUsers({ limit: 0 }),
						auditLogsApi.getAuditLogs({ limit: 0 }),
					]);

				// Check if component is still mounted
				if (controller.signal.aborted) return;

				setStats({
					totalProducts:
						productsRes.status === "fulfilled"
							? productsRes.value.meta?.total
							: 0,
					totalCategories:
						categoriesRes.status === "fulfilled"
							? categoriesRes.value.meta?.total
							: 0,
					totalUsers:
						usersRes.status === "fulfilled" ? usersRes.value.meta?.total : 0,
					totalAuditLogs:
						auditRes.status === "fulfilled" ? auditRes.value.meta?.total : 0,
					loading: false,
					error: null,
				});
			} catch (error) {
				// Only update state if component is still mounted
				if (!controller.signal.aborted) {
					console.error("Failed to fetch dashboard stats:", error);
					setStats((prev) => ({
						...prev,
						loading: false,
						error: "Failed to load statistics",
					}));
				}
			}
		};

		fetchStats();

		return () => controller.abort();
	}, []);

	const dashboardCards = [
		{
			id: "products",
			title: "Products",
			description:
				"Manage your product catalog, add new products, and track inventory",
			icon: Package,
			path: "/products",
			permission: "product:read",
			color: "bg-blue-500",
			hoverColor: "hover:bg-blue-600",
			stat: stats.totalProducts,
			statLabel: "Total Products",
		},
		{
			id: "categories",
			title: "Categories",
			description: "Organize products into categories for better management",
			icon: Tags,
			path: "/categories",
			permission: "category:read",
			color: "bg-green-500",
			hoverColor: "hover:bg-green-600",
			stat: stats.totalCategories,
			statLabel: "Total Categories",
		},
		{
			id: "users",
			title: "Users",
			description: "Manage user accounts and their access permissions",
			icon: Users,
			path: "/users",
			permission: "user:read",
			color: "bg-purple-500",
			hoverColor: "hover:bg-purple-600",
			stat: stats.totalUsers,
			statLabel: "Total Users",
		},
		{
			id: "inventory",
			title: "Inventory",
			description: "Track stock movements and monitor inventory levels",
			icon: Warehouse,
			path: "/stock-movements",
			permission: "inventory:read",
			color: "bg-orange-500",
			hoverColor: "hover:bg-orange-600",
			stat: null,
			statLabel: "Stock Movements",
		},
		{
			id: "sales",
			title: "Sales",
			description: "Process sales transactions and manage customer orders",
			icon: ShoppingCart,
			path: "/sales",
			permission: "sales:read",
			color: "bg-emerald-500",
			hoverColor: "hover:bg-emerald-600",
			stat: null,
			statLabel: "Sales Transactions",
		},
		{
			id: "audit-logs",
			title: "Audit Logs",
			description: "View system activity logs and track user actions",
			icon: FileText,
			path: "/audit-logs",
			permission: "audit:read",
			color: "bg-indigo-500",
			hoverColor: "hover:bg-indigo-600",
			stat: stats.totalAuditLogs,
			statLabel: "Total Logs",
		},
		{
			id: "roles",
			title: "Roles",
			description: "Manage user roles and their permissions",
			icon: Shield,
			path: "/roles",
			permission: "admin:read",
			color: "bg-red-500",
			hoverColor: "hover:bg-red-600",
			stat: null,
			statLabel: "User Roles",
		},
		{
			id: "permissions",
			title: "Permissions",
			description: "Configure access permissions and security settings",
			icon: Key,
			path: "/permissions",
			permission: "admin:read",
			color: "bg-gray-500",
			hoverColor: "hover:bg-gray-600",
			stat: null,
			statLabel: "Access Control",
		},
	];

	const handleCardClick = (path) => {
		navigate(path);
	};

	// Filter cards based on user permissions
	const accessibleCards = dashboardCards.filter((card) =>
		hasPermission(user, card.permission)
	);

	// Show loading state
	if (stats.loading) {
		return (
			<div className="form-container">
				<div className="flex items-center justify-center min-h-[400px]">
					<LoadingSpinner size="2xl" text="Loading dashboard..." />
				</div>
			</div>
		);
	}

	return (
		<div className="form-container">
			{/* Header */}
			<div className="page-header">
				<div className="page-header-content">
					<h1 className="page-title">Dashboard</h1>
					<p className="text-muted-foreground">
						Welcome to your inventory management system
					</p>
				</div>
			</div>

			{/* Statistics Overview */}
			{stats.error ? (
				<div className="mb-6 p-4 bg-destructive/15 border border-destructive text-destructive rounded-lg">
					<p className="text-sm">{stats.error}</p>
				</div>
			) : (
				// Only show System Overview if user has at least one permission to view statistics
				(hasPermission(user, "product:read") ||
					hasPermission(user, "user:read") ||
					hasPermission(user, "user:manage")) && (
					<div className="mb-8">
						<h2 className="text-xl font-semibold text-card-foreground mb-4">
							System Overview
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							{hasPermission(user, "product:read") && (
								<Card
									className="border-0 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
									onClick={() => handleCardClick("/products")}>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm text-muted-foreground">
													Total Products
												</p>
												<p className="text-2xl font-bold text-blue-600">
													{stats.totalProducts}
												</p>
											</div>
											<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
												<Package className="w-5 h-5 text-blue-600" />
											</div>
										</div>
									</CardContent>
								</Card>
							)}

							{hasPermission(user, "product:read") && (
								<Card
									className="border-0 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
									onClick={() => handleCardClick("/categories")}>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm text-muted-foreground">
													Total Categories
												</p>
												<p className="text-2xl font-bold text-green-600">
													{stats.totalCategories}
												</p>
											</div>
											<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
												<Tags className="w-5 h-5 text-green-600" />
											</div>
										</div>
									</CardContent>
								</Card>
							)}

							{hasPermission(user, "user:read") && (
								<Card
									className="border-0 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
									onClick={() => handleCardClick("/users")}>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm text-muted-foreground">
													Total Users
												</p>
												<p className="text-2xl font-bold text-purple-600">
													{stats.totalUsers}
												</p>
											</div>
											<div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
												<Users className="w-5 h-5 text-purple-600" />
											</div>
										</div>
									</CardContent>
								</Card>
							)}

							{hasPermission(user, "user:manage") && (
								<Card
									className="border-0 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
									onClick={() => handleCardClick("/audit-logs")}>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm text-muted-foreground">
													Audit Logs
												</p>
												<p className="text-2xl font-bold text-indigo-600">
													{stats.totalAuditLogs}
												</p>
											</div>
											<div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
												<FileText className="w-5 h-5 text-indigo-600" />
											</div>
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				)
			)}

			{/* Dashboard Cards Grid */}
			<h2 className="text-xl font-semibold text-card-foreground mb-6">
				Quick Access
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{accessibleCards.map((card) => {
					const IconComponent = card.icon;
					return (
						<Card
							key={card.id}
							className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-0 shadow-md"
							onClick={() => handleCardClick(card.path)}>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between mb-3">
									<div
										className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
										<IconComponent className="w-6 h-6 text-white" />
									</div>
									{card.stat !== null && (
										<div className="text-right">
											<p className="text-2xl font-bold text-card-foreground">
												{card.stat}
											</p>
											<p className="text-xs text-muted-foreground">
												{card.statLabel}
											</p>
										</div>
									)}
								</div>
								<CardTitle className="text-lg font-semibold text-card-foreground">
									{card.title}
								</CardTitle>
								<CardDescription className="text-sm text-muted-foreground leading-relaxed">
									{card.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-0">
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-start text-muted-foreground hover:text-foreground"
									onClick={(e) => {
										e.stopPropagation();
										handleCardClick(card.path);
									}}>
									Open →
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Empty State */}
			{accessibleCards.length === 0 && (
				<div className="text-center py-12">
					<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
						<Shield className="w-8 h-8 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-semibold text-card-foreground mb-2">
						No Access Available
					</h3>
					<p className="text-muted-foreground">
						You don&apos;t have permission to access any dashboard features.
						Please contact your administrator.
					</p>
				</div>
			)}
		</div>
	);
};

export default Dashboard;
