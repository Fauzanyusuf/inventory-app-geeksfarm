import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { hasPermission } from "@/utils/permissions";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useImageUpload } from "@/hooks/useImageUpload";
import {
	LayoutDashboard,
	Package,
	FolderOpen,
	Users,
	Settings,
	BarChart3,
	FileText,
	Shield,
	ShoppingCart,
	LogOut,
	User,
} from "lucide-react";
import { ModeToggle } from "@/components/shared/mode-toggle";

const Layout = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const { imageUrl } = useImageUpload(user);

	const initials =
		user && user.name
			? user.name
					.split(" ")
					.map((s) => s[0])
					.slice(0, 2)
					.join("")
					.toUpperCase()
			: "U";

	const roleName =
		user && (user.role?.name || (user.roles && user.roles[0]?.name))
			? user.role?.name || user.roles[0].name
			: null;

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const goTo = (path) => {
		navigate(path);
	};

	const isActive = (path) => {
		return (
			location.pathname === path || location.pathname.startsWith(path + "/")
		);
	};

	return (
		<SidebarProvider>
			<div className="flex h-full w-full">
				<Sidebar>
					<SidebarHeader>
						<div className="flex items-center gap-2 px-2 py-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								<Package className="h-4 w-4" />
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-semibold">Inventory</span>
								<span className="text-xs text-muted-foreground">
									Management
								</span>
							</div>
						</div>
					</SidebarHeader>

					<SidebarContent>
						{/* Main Navigation */}
						<SidebarGroup>
							<SidebarGroupLabel>Navigation</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton
											onClick={() => goTo("/dashboard")}
											isActive={isActive("/dashboard")}>
											<LayoutDashboard className="h-4 w-4" />
											<span>Dashboard</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						{/* Products Section */}
						{user && (
							<SidebarGroup>
								<SidebarGroupLabel>Products</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										<SidebarMenuItem>
											<SidebarMenuButton
												onClick={() => goTo("/products")}
												isActive={isActive("/products")}>
												<Package className="h-4 w-4" />
												<span>Products</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
										{hasPermission(user, "product:manage") && (
											<SidebarMenuItem>
												<SidebarMenuButton
													onClick={() => goTo("/products/add")}
													isActive={isActive("/products/add")}>
													<Package className="h-4 w-4" />
													<span>Add Product</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										)}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						)}

						{/* Categories Section */}
						{user && (
							<SidebarGroup>
								<SidebarGroupLabel>Categories</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										<SidebarMenuItem>
											<SidebarMenuButton
												onClick={() => goTo("/categories")}
												isActive={isActive("/categories")}>
												<FolderOpen className="h-4 w-4" />
												<span>Categories</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
										{hasPermission(user, "product:manage") && (
											<SidebarMenuItem>
												<SidebarMenuButton
													onClick={() => goTo("/categories/add")}
													isActive={isActive("/categories/add")}>
													<FolderOpen className="h-4 w-4" />
													<span>Add Category</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										)}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						)}

						{/* Users Section */}
						{user && (
							<SidebarGroup>
								<SidebarGroupLabel>Users</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{hasPermission(user, "user:read") && (
											<SidebarMenuItem>
												<SidebarMenuButton
													onClick={() => goTo("/users")}
													isActive={isActive("/users")}>
													<Users className="h-4 w-4" />
													<span>Users</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										)}
										<SidebarMenuItem>
											<SidebarMenuButton
												onClick={() => goTo("/users/me")}
												isActive={isActive("/users/me")}>
												<User className="h-4 w-4" />
												<span>My Profile</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						)}

						{/* Admin Section */}
						{user && (
							<SidebarGroup>
								<SidebarGroupLabel>Administration</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{hasPermission(user, "inventory:read") && (
											<SidebarMenuItem>
												<SidebarMenuButton
													onClick={() => goTo("/stock-movements")}
													isActive={isActive("/stock-movements")}>
													<BarChart3 className="h-4 w-4" />
													<span>Stock Movements</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										)}
										{hasPermission(user, "user:manage") && (
											<SidebarMenuItem>
												<SidebarMenuButton
													onClick={() => goTo("/audit-logs")}
													isActive={isActive("/audit-logs")}>
													<FileText className="h-4 w-4" />
													<span>Audit Logs</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										)}
										{hasPermission(user, "user:manage") && (
											<SidebarMenuItem>
												<SidebarMenuButton
													onClick={() => goTo("/roles")}
													isActive={isActive("/roles")}>
													<Shield className="h-4 w-4" />
													<span>Roles</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										)}
										{hasPermission(user, "user:manage") && (
											<SidebarMenuItem>
												<SidebarMenuButton
													onClick={() => goTo("/permissions")}
													isActive={isActive("/permissions")}>
													<Settings className="h-4 w-4" />
													<span>Permissions</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										)}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						)}

						{/* Sales Section */}
						{hasPermission(user, "inventory:manage") && (
							<SidebarGroup>
								<SidebarGroupContent>
									<SidebarMenu>
										<SidebarMenuItem>
											<SidebarMenuButton
												onClick={() => goTo("/sales")}
												isActive={isActive("/sales")}
												className="bg-primary text-primary-foreground hover:bg-primary/90">
												<ShoppingCart className="h-4 w-4" />
												<span>Sales</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						)}
					</SidebarContent>

					<SidebarFooter>
						<SidebarMenu>
							<SidebarMenuItem>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<SidebarMenuButton className="w-full">
											<Avatar className="h-6 w-6">
												{imageUrl ? (
													<AvatarImage src={imageUrl} alt="Profile" />
												) : (
													<AvatarFallback className="text-xs">
														{initials}
													</AvatarFallback>
												)}
											</Avatar>
											<div className="flex flex-col items-start">
												<span className="text-sm font-medium">
													{user?.name}
												</span>
												{roleName && (
													<span className="text-xs text-muted-foreground">
														{roleName}
													</span>
												)}
											</div>
										</SidebarMenuButton>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56">
										<DropdownMenuItem onClick={() => goTo("/users/me")}>
											<User className="mr-2 h-4 w-4" />
											My Profile
										</DropdownMenuItem>
										<Separator />
										<DropdownMenuItem
											onClick={handleLogout}
											className="text-destructive focus:text-destructive">
											<LogOut className="mr-2 h-4 w-4" />
											Logout
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarFooter>
				</Sidebar>

				<div className="flex flex-1 flex-col">
					{/* Header */}
					<header className="flex h-14 items-center justify-between border-b bg-background px-4">
						<div className="flex items-center gap-4">
							<SidebarTrigger />
							<Separator orientation="vertical" className="mr-2 h-4" />
							<h1 className="text-lg font-semibold">
								{location.pathname === "/" || location.pathname === "/dashboard"
									? "Inventory Management System"
									: location.pathname === "/products"
									? "Products"
									: location.pathname === "/products/add"
									? "Add Product"
									: location.pathname.startsWith("/products/") &&
									  location.pathname.includes("/edit")
									? "Edit Product"
									: location.pathname.startsWith("/products/") &&
									  !location.pathname.includes("/batches")
									? "Product Detail"
									: location.pathname.startsWith("/products/") &&
									  location.pathname.includes("/batches")
									? "Product Batches"
									: location.pathname.startsWith("/products/") &&
									  location.pathname.includes("/batches/")
									? "Batch Detail"
									: location.pathname === "/categories"
									? "Categories"
									: location.pathname === "/categories/add"
									? "Add Category"
									: location.pathname.startsWith("/categories/") &&
									  location.pathname.includes("/edit")
									? "Edit Category"
									: location.pathname.startsWith("/categories/")
									? "Category Detail"
									: location.pathname === "/users"
									? "User Management"
									: location.pathname === "/users/me"
									? "Edit Profile"
									: location.pathname.startsWith("/users/")
									? "User Detail"
									: location.pathname === "/sales"
									? "Sales Transaction"
									: location.pathname === "/stock-movements"
									? "Stock Movements"
									: location.pathname === "/audit-logs"
									? "Audit Logs"
									: location.pathname === "/roles"
									? "Role Management"
									: location.pathname === "/permissions"
									? "Access Permissions"
									: location.pathname.startsWith("/permissions/")
									? "Permission Detail"
									: "Dashboard"}
							</h1>
						</div>
						<div className="flex items-center gap-2">
							<ModeToggle />
						</div>
					</header>

					{/* Main Content */}
					<main className="flex-1 p-4 overflow-auto">
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
};

export default Layout;
