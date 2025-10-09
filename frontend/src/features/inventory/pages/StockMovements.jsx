import { useState } from "react";
import { useStockMovementParams } from "../hooks/useStockMovementParams";
import { useStockMovementsData } from "../hooks/useStockMovementsData";
import Pagination from "@/components/shared/Pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StockMovementTable from "../components/StockMovementTable";
import StockMovementFilterForm from "../components/StockMovementFilterForm";

const StockMovements = () => {
	const { searchParams, handlePageChange, handlePageSizeChange } =
		useStockMovementParams();
	const { movements, meta, loading, error } =
		useStockMovementsData(searchParams);
	const [formError, setFormError] = useState("");

	return (
		<div className="form-container">
			{/* Main Content */}
			<div className="page-content">
				{/* Stock Movements */}
				<div className="page-content-header">
					<h3 className="page-title">Stock Movements ({meta?.total || 0})</h3>
					<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
						Track inventory movements and stock changes with advanced filtering.
					</p>
				</div>

				{/* Filters */}
				<div className="page-content-body">
					<StockMovementFilterForm
						formError={formError}
						setFormError={setFormError}
					/>

					{formError && (
						<Alert variant="destructive" className="mt-4">
							<AlertDescription>{formError}</AlertDescription>
						</Alert>
					)}
				</div>

				<div className="border-t border-border flex-1 flex flex-col">
					{error && (
						<Alert variant="destructive" className="m-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="flex-1 overflow-auto">
						<StockMovementTable movements={movements} loading={loading} />
					</div>

					{/* Pagination */}
					{!loading && movements && movements.length > 0 && (
						<div className="bg-card px-4 py-3 border-t border-border sm:px-6 flex-shrink-0">
							<Pagination
								currentPage={meta?.page || 1}
								totalPages={meta?.totalPages || 1}
								onPageChange={handlePageChange}
								onPageSizeChange={handlePageSizeChange}
								pageSize={meta?.limit || 10}
								totalItems={meta?.total || 0}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default StockMovements;
