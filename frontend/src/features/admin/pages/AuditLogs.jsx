import { useCallback, useEffect, useState } from "react";
import { auditLogsApi } from "@/services/api";
import { formatDate } from "@/utils/format";
import { getErrorMessage } from "@/utils/errorUtils";
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

const AuditLogs = () => {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [dataFetched, setDataFetched] = useState(false);
	const [filters, setFilters] = useState({
		userId: "",
		action: "all",
		startDate: "",
		endDate: "",
	});
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		pageSize: 10,
	});

	const fetchLogs = useCallback(async () => {
		if (dataFetched) return;

		try {
			setLoading(true);
			const params = {
				page: pagination.currentPage,
				limit: pagination.pageSize,
				...filters,
			};

			Object.keys(params).forEach((key) => {
				if (!params[key] || params[key] === "all") delete params[key];
			});

			const response = await auditLogsApi.getAuditLogs(params);
			const items = Array.isArray(response) ? response : response.data || [];
			setLogs(items);

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
			console.error("Failed to fetch audit logs:", err);
			setError(getErrorMessage(err, "audit-logs", "load"));
			setDataFetched(true);
		} finally {
			setLoading(false);
		}
	}, [pagination.currentPage, pagination.pageSize, dataFetched, filters]);

	useEffect(() => {
		if (!dataFetched) {
			fetchLogs();
		}
	}, [dataFetched, fetchLogs]);

	useEffect(() => {
		setDataFetched(false);
	}, [pagination.currentPage, pagination.pageSize, filters]);

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

	const handleFilterChange = (filterName, value) => {
		setFilters((prev) => ({
			...prev,
			[filterName]: value,
		}));
		setPagination((prev) => ({
			...prev,
			currentPage: 1, // Reset to first page when filtering
		}));
	};

	const getActionColor = (action) => {
		switch (action) {
			case "CREATE":
				return "bg-success text-success-foreground";
			case "UPDATE":
				return "bg-info text-info-foreground";
			case "DELETE":
				return "bg-danger text-danger-foreground";
			case "LOGIN":
				return "bg-primary text-primary-foreground";
			case "LOGOUT":
				return "bg-muted text-muted-foreground";
			default:
				return "bg-warning text-warning-foreground";
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
					<p className="mt-4 text-muted-foreground">Loading audit logs...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="form-container">
			{/* Main Content */}
			<div className="page-content">
				{/* Audit Logs */}
				<div className="page-content-header">
					<h3 className="page-title">Audit Logs ({pagination.totalItems})</h3>
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
															<span
																className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
																	log.action
																)}`}>
																{log.action}
															</span>
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
									d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
								/>
							</svg>
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
