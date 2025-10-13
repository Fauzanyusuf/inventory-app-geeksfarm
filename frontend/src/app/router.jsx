import { createBrowserRouter, Navigate } from "react-router";
import { lazy, Suspense } from "react";
import App from "@/App";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import Layout from "@/layouts/Layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

// Lazy load feature pages untuk code splitting
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const ProductDetail = lazy(() =>
	import("@/features/products/pages/ProductDetail")
);
const ProductList = lazy(() => import("@/features/products/pages/ProductList"));
const ProductBatches = lazy(() =>
	import("@/features/products/pages/ProductBatches")
);
const ProductBatchDetail = lazy(() =>
	import("@/features/products/pages/ProductBatchDetail")
);
const ProductForm = lazy(() => import("@/features/products/pages/ProductForm"));
const CategoriesList = lazy(() =>
	import("@/features/categories/pages/CategoriesList")
);
const CategoryDetail = lazy(() =>
	import("@/features/categories/pages/CategoryDetail")
);
const CategoryForm = lazy(() =>
	import("@/features/categories/pages/CategoryForm")
);
const UsersList = lazy(() => import("@/features/users/pages/UsersList"));
const UserDetail = lazy(() => import("@/features/users/pages/UserDetail"));
const UserForm = lazy(() => import("@/features/users/pages/UserForm"));
const StockMovements = lazy(() =>
	import("@/features/inventory/pages/StockMovements")
);
const AuditLogs = lazy(() => import("@/features/admin/pages/AuditLogs"));
const RolesList = lazy(() => import("@/features/admin/pages/RolesList"));
const AccessPermissions = lazy(() =>
	import("@/features/admin/pages/AccessPermissions")
);
const AccessPermissionDetail = lazy(() =>
	import("@/features/admin/pages/AccessPermissionDetail")
);
const SalesCommit = lazy(() => import("@/features/sales/pages/SalesCommit"));

// Loading fallback component
const PageLoader = () => (
	<LoadingSpinner size="2xl" text="Loading page..." fullScreen />
);

// Wrapper untuk lazy loaded components
const LazyWrapper = ({ children }) => (
	<Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const router = createBrowserRouter([
	{
		element: <App />,
		children: [
			{ path: "/login", element: <Login /> },
			{ path: "/register", element: <Register /> },
			{
				path: "/",
				element: (
					<ProtectedRoute>
						<Layout />
					</ProtectedRoute>
				),
				children: [
					{
						index: true,
						element: (
							<LazyWrapper>
								<Dashboard />
							</LazyWrapper>
						),
					}, // Default route untuk "/"
					{
						path: "dashboard",
						element: (
							<LazyWrapper>
								<Dashboard />
							</LazyWrapper>
						),
					},
					{
						path: "products",
						element: (
							<LazyWrapper>
								<ProductList />
							</LazyWrapper>
						),
					},
					{
						path: "products/:id",
						element: (
							<LazyWrapper>
								<ProductDetail />
							</LazyWrapper>
						),
					},
					{
						path: "products/:id/batches",
						element: (
							<LazyWrapper>
								<ProductBatches />
							</LazyWrapper>
						),
					},
					{
						path: "products/:productId/batches/:batchId",
						element: (
							<LazyWrapper>
								<ProductBatchDetail />
							</LazyWrapper>
						),
					},
					{
						path: "products/add",
						element: (
							<LazyWrapper>
								<ProductForm />
							</LazyWrapper>
						),
					},
					{
						path: "products/:id/edit",
						element: (
							<LazyWrapper>
								<ProductForm />
							</LazyWrapper>
						),
					},
					{
						path: "categories",
						element: (
							<LazyWrapper>
								<CategoriesList />
							</LazyWrapper>
						),
					},
					{
						path: "categories/:id",
						element: (
							<LazyWrapper>
								<CategoryDetail />
							</LazyWrapper>
						),
					},
					{
						path: "categories/add",
						element: (
							<LazyWrapper>
								<CategoryForm />
							</LazyWrapper>
						),
					},
					{
						path: "categories/:id/edit",
						element: (
							<LazyWrapper>
								<CategoryForm />
							</LazyWrapper>
						),
					},
					{
						path: "users",
						element: (
							<LazyWrapper>
								<UsersList />
							</LazyWrapper>
						),
					},
					{
						path: "users/:id",
						element: (
							<LazyWrapper>
								<UserDetail />
							</LazyWrapper>
						),
					},
					{
						path: "users/me",
						element: (
							<LazyWrapper>
								<UserForm />
							</LazyWrapper>
						),
					},
					{
						path: "stock-movements",
						element: (
							<LazyWrapper>
								<StockMovements />
							</LazyWrapper>
						),
					},
					{
						path: "audit-logs",
						element: (
							<LazyWrapper>
								<AuditLogs />
							</LazyWrapper>
						),
					},
					{
						path: "roles",
						element: (
							<LazyWrapper>
								<RolesList />
							</LazyWrapper>
						),
					},
					{
						path: "permissions",
						element: (
							<LazyWrapper>
								<AccessPermissions />
							</LazyWrapper>
						),
					},
					{
						path: "permissions/:id",
						element: (
							<LazyWrapper>
								<AccessPermissionDetail />
							</LazyWrapper>
						),
					},
					{
						path: "sales",
						element: (
							<LazyWrapper>
								<SalesCommit />
							</LazyWrapper>
						),
					},
				],
			},
			{ path: "*", element: <Navigate to="/" replace /> }, // Redirect semua route yang tidak ditemukan ke "/"
		],
	},
]);

export default router;
