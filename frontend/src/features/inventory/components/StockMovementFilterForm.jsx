import { memo, useCallback, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import BarcodeScanner from "@/features/products/components/BarcodeScanner";
import { QrCode } from "lucide-react";
import { usePaginationParams } from "@/hooks/usePaginationParams";
import { useDebounce } from "@/hooks/useDebounce";

const StockMovementFilterForm = memo(() => {
	const { getParam, updateParam, updateParams } = usePaginationParams();
	const [showScanner, setShowScanner] = useState(false);
	const [searchValue, setSearchValue] = useState(getParam("search") || "");
	const debouncedSearchValue = useDebounce(searchValue, 500);

	useEffect(() => {
		updateParam("search", debouncedSearchValue);
	}, [debouncedSearchValue, updateParam]);

	const handleFilterSubmit = useCallback(
		(e) => {
			e.preventDefault();
			const fd = new FormData(e.target);
			const next = Object.fromEntries(
				Array.from(fd.entries()).filter(([_, v]) => v !== "" && v !== null)
			);

			const startDate = next.startDate;
			const endDate = next.endDate;
			if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
				console.warn("Start date cannot be greater than end date");
				return;
			}

			updateParams(next);
		},
		[updateParams]
	);

	const handleSearchChange = useCallback((e) => {
		setSearchValue(e.target.value);
	}, []);

	const handleScanSuccess = useCallback((decodedText) => {
		setSearchValue(decodedText);
		setShowScanner(false);
	}, []);

	const handleCategoryChange = useCallback(
		(value) => {
			updateParam("movementType", value);
		},
		[updateParam]
	);

	const handleStartDateChange = useCallback(
		(value) => {
			updateParam("startDate", value);
		},
		[updateParam]
	);

	const handleEndDateChange = useCallback(
		(value) => {
			updateParam("endDate", value);
		},
		[updateParam]
	);

	return (
		<div className="space-y-6">
			<h4 className="text-md font-medium text-card-foreground mb-4">Filters</h4>

			<form onSubmit={handleFilterSubmit} className="space-y-4">
				{/* Search Row */}
				<div className="grid grid-cols-1 gap-4">
					<div>
						<Label
							htmlFor="search"
							className="block text-sm font-medium text-muted-foreground mb-2">
							Search
						</Label>
						<div className="flex gap-2">
							<Input
								name="search"
								type="text"
								id="search"
								value={searchValue}
								onChange={handleSearchChange}
								placeholder="Search by product name or barcode..."
								className="flex-1"
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => setShowScanner(true)}
								title="Scan barcode">
								<QrCode className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				{/* Movement Type and Date Range Row */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<Label
							htmlFor="movementType"
							className="block text-sm font-medium text-muted-foreground mb-2">
							Movement Type
						</Label>
						<Select
							value={getParam("movementType", "all")}
							onValueChange={handleCategoryChange}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="All Types" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="IN">Stock In</SelectItem>
								<SelectItem value="OUT">Stock Out</SelectItem>
								<SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<DatePicker
							name="startDate"
							label="Start Date"
							value={getParam("startDate")}
							onChange={handleStartDateChange}
							placeholder="Select start date"
							errors={null}
						/>
					</div>
					<div>
						<DatePicker
							name="endDate"
							label="End Date"
							value={getParam("endDate")}
							onChange={handleEndDateChange}
							placeholder="Select end date"
							errors={null}
						/>
					</div>
				</div>

				{/* Submit Button */}
				<div className="flex justify-end">
					<Button type="submit" className="px-6">
						Apply Filters
					</Button>
				</div>
			</form>

			{/* Barcode Scanner Modal */}
			{showScanner && (
				<BarcodeScanner
					onScanSuccess={handleScanSuccess}
					onClose={() => setShowScanner(false)}
				/>
			)}
		</div>
	);
});

StockMovementFilterForm.displayName = "StockMovementFilterForm";

export default StockMovementFilterForm;
