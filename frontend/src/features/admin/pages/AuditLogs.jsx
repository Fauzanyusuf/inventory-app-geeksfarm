import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";
import { auditLogsApi } from "@/services/api";
import { formatDate } from "@/utils/format";
import { useResourceData } from "@/hooks/useResourceData";
import { usePaginationParams } from "@/hooks/usePaginationParams";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/shared/Pagination";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

const AuditLogs = () => {
	const [searchParams] = useSearchParams();
	const { handlePageChange, handlePageSizeChange } = usePaginationParams();

	// Local filter state for UI controls
	const [filters, setFilters] = useState({
		userId: "",
		action: "all",
		startDate: "",
		endDate: "",
	});

	// Build query params function with filter handling
	const buildQueryParams = useCallback(
		(validated) => {
			const params = {
				page: validated.page,
				limit: validated.limit,
				...filters,
			};

			// Clean up empty values
			Object.keys(params).forEach((key) => {
				if (!params[key] || params[key] === "all") delete params[key];
			});

			return params;
		},
		[filters]
	);

	// Use generic resource data hook
	const {
		data: logs,
		meta,
		loading,
		error,
		validated,
		totalPages,
	} = useResourceData({
		api: auditLogsApi.getAuditLogs,
		schema: null, // Basic validation handled in hook
		searchParams,
		buildParams: buildQueryParams,
		resourceName: "audit logs",
		options: {
			onError: (err, _errorMessage) => {
				console.error("Failed to fetch audit logs:", err);
			},
		},
	});

	const handleFilterChange = (filterName, value) => {
		setFilters((prev) => ({
			...prev,
			[filterName]: value,
		}));
	};

	const getActionBadgeVariant = (action) => {
		switch (action) {
			case "CREATE":
				return "default";
			case "UPDATE":
				return "secondary";
			case "DELETE":
				return "destructive";
			case "LOGIN":
				return "default";
			case "LOGOUT":
				return "outline";
			default:
				return "secondary";
		}
	};

	if (loading) {
		return <LoadingSpinner size="lg" text="Loading audit logs..." />;
	}

	return (
		<div className="form-container">
			{/* Main Content */}
			<div className="page-content">
				{/* Audit Logs */}
				<div className="page-content-header">
					<h3 className="page-title">Audit Logs ({meta?.total || 0})</h3>
					<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
						Track system activities and user actions.
					</p>
				</div>

				{/* Filters */}
				<div className="page-content-body">
					<h4 className="text-md font-medium text-card-foreground mb-4">
						Filters
					</h4>
					<div className="form-grid lg:grid-cols-3">
						<div>
							<Label
								htmlFor="action"
								className="block text-sm font-medium text-muted-foreground mb-2">
								Action
							</Label>
							<Select
								value={filters.action}
								onValueChange={(value) => handleFilterChange("action", value)}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All Actions" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Actions</SelectItem>
									<SelectItem value="CREATE">Create</SelectItem>
									<SelectItem value="UPDATE">Update</SelectItem>
									<SelectItem value="DELETE">Delete</SelectItem>
									<SelectItem value="LOGIN">Login</SelectItem>
									<SelectItem value="LOGOUT">Logout</SelectItem>
									<SelectItem value="OTHER">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<DatePicker
								name="startDate"
								label="Start Date"
								value={filters.startDate}
								onChange={(value) => handleFilterChange("startDate", value)}
								placeholder="Select start date"
								errors={null}
							/>
						</div>
						<div>
							<DatePicker
								name="endDate"
								label="End Date"
								value={filters.endDate}
								onChange={(value) => handleFilterChange("endDate", value)}
								placeholder="Select end date"
								errors={null}
							/>
						</div>
					</div>
				</div>

				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className="border-t border-border flex-1 flex flex-col">
					{loading ? (
						<LoadingSpinner size="lg" text="Loading..." />
					) : logs.length > 0 ? (
						<>
							<div className="flex-1 overflow-auto">
								<ul className="divide-y divide-border">
									{logs.map((log) => (
										<li key={log.id}>
											<div className="px-4 py-4 sm:px-6">
												<div className="flex items-center justify-between">
													<div className="flex items-center">
														<div className="flex-shrink-0">
															<Badge
																variant={getActionBadgeVariant(log.action)}>
																{log.action}
															</Badge>
														</div>
														<div className="ml-4">
															<div className="text-sm font-medium text-card-foreground">
																{log.user?.name || "System"}
															</div>
															<div className="text-sm text-muted-foreground">
																{log.entity}: {log.entityId}
															</div>
														</div>
													</div>
													<div className="text-right">
														<div className="text-sm text-card-foreground">
															{formatDate(log.createdAt)}
														</div>
														{log.oldValues && log.newValues && (
															<div className="text-xs text-muted-foreground mt-1">
																Changes recorded
															</div>
														)}
													</div>
												</div>
											</div>
										</li>
									))}
								</ul>
							</div>

							{/* Pagination */}
							<div className="bg-card px-4 py-3 border-t border-border sm:px-6 flex-shrink-0">
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
							<FileText className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-2 text-sm font-medium text-card-foreground">
								No audit logs found
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Audit logs will appear here as system activities occur.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AuditLogs;
