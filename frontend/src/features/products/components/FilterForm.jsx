import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router";
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
import PriceInput from "./PriceInput";
import BarcodeScanner from "./BarcodeScanner";
import { ScanBarcodeIcon } from "lucide-react";
import { useProductListParams } from "../hooks/useProductListParams";
import { productListQuerySchema } from "@/validation/product-validation";
import {
	SORT_OPTIONS,
	SORT_ORDER_OPTIONS,
	DEFAULT_SORT_BY,
	DEFAULT_SORT_ORDER,
	DEFAULT_CATEGORY_VALUE,
	NO_CATEGORY_VALUE,
	NO_CATEGORIES_TEXT,
	FORM_GRID_CLASSES,
	FORM_ERROR_CLASSES,
	SUBMIT_BUTTON_CLASSES,
} from "../constants/product-list-constants";

const FilterForm = memo(({ categories, formError, setFormError }) => {
	const navigate = useNavigate();
	const { getParam, updateParam } = useProductListParams();
	const [showScanner, setShowScanner] = useState(false);

	const handleFilterSubmit = useCallback(
		(e) => {
			e.preventDefault();
			const fd = new FormData(e.target);
			const next = Object.fromEntries(
				Array.from(fd.entries()).filter(([_, v]) => v !== "" && v !== null)
			);

			const min = next.minPrice ? Number(next.minPrice) : undefined;
			const max = next.maxPrice ? Number(next.maxPrice) : undefined;
			if (min !== undefined && max !== undefined && min > max) {
				setFormError("Min Price cannot be greater than Max Price");
				return;
			}

			// Validate with schema
			const parsed = productListQuerySchema.safeParse({ ...next, page: 1 });
			if (!parsed.success) {
				setFormError("Invalid filter inputs");
				return;
			}

			setFormError("");
			const newParams = new URLSearchParams();
			Object.entries(parsed.data).forEach(([key, value]) => {
				if (
					value !== undefined &&
					value !== null &&
					value !== "" &&
					value !== "all"
				) {
					newParams.set(key, String(value));
				}
			});
			newParams.set("page", "1");
			navigate(`?${newParams.toString()}`);
		},
		[setFormError, navigate]
	);

	const handleCategoryChange = useCallback(
		(value) => {
			if (value === DEFAULT_CATEGORY_VALUE) {
				updateParam("category", undefined);
			} else if (value === NO_CATEGORY_VALUE) {
				updateParam("category", "no-category");
			} else {
				updateParam("category", value);
			}
		},
		[updateParam]
	);

	const handleSortByChange = useCallback(
		(value) => {
			updateParam("sortBy", value || DEFAULT_SORT_BY);
		},
		[updateParam]
	);

	const handleSortOrderChange = useCallback(
		(value) => {
			updateParam("sortOrder", value || DEFAULT_SORT_ORDER);
		},
		[updateParam]
	);

	const handleScanSuccess = useCallback(
		(decodedText) => {
			// Set the scanned barcode as search parameter
			updateParam("search", decodedText);
			setShowScanner(false);
		},
		[updateParam]
	);

	return (
		<div className="form-card mb-6">
			<form onSubmit={handleFilterSubmit} className={FORM_GRID_CLASSES}>
				{formError && <div className={FORM_ERROR_CLASSES}>{formError}</div>}

				<div className="col-span-2">
					<Label
						htmlFor="search"
						className="block text-sm font-medium text-muted-foreground">
						Search
					</Label>
					<div className="mt-1 flex rounded-md">
						<Input
							id="search"
							name="search"
							placeholder="Product Name / Barcode"
							defaultValue={getParam("search")}
							className="flex-1 rounded-l-md rounded-r-none"
						/>
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowScanner(true)}
							className="rounded-l-none rounded-r-md border-l-0 ">
							<ScanBarcodeIcon className="w-4 h-4 mr-2" />
							Scan
						</Button>
					</div>
				</div>

				<div>
					<Label className="block text-sm font-medium text-muted-foreground">
						Category
					</Label>
					<div className="mt-1">
						<Select
							value={getParam("category", DEFAULT_CATEGORY_VALUE) || ""}
							onValueChange={handleCategoryChange}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="All Categories" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={DEFAULT_CATEGORY_VALUE}>
									All Categories
								</SelectItem>
								<SelectItem value={NO_CATEGORY_VALUE}>
									{NO_CATEGORIES_TEXT}
								</SelectItem>
								{categories.map((c) => (
									<SelectItem key={c.name} value={c.name}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<PriceInput
					name="minPrice"
					label="Min Price"
					defaultValue={getParam("minPrice")}
					placeholder="Min"
				/>

				<PriceInput
					name="maxPrice"
					label="Max Price"
					defaultValue={getParam("maxPrice")}
					placeholder="Max"
				/>

				<div>
					<Label className="block text-sm font-medium text-muted-foreground">
						Sort By
					</Label>
					<div className="mt-1 flex items-center space-x-2">
						<Select
							value={getParam("sortBy", DEFAULT_SORT_BY) || ""}
							onValueChange={handleSortByChange}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select sorting" />
							</SelectTrigger>
							<SelectContent>
								{SORT_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div>
					<Label className="block text-sm font-medium text-muted-foreground">
						Order
					</Label>
					<div className="mt-1 flex items-center space-x-2">
						<Select
							value={getParam("sortOrder", DEFAULT_SORT_ORDER) || ""}
							onValueChange={handleSortOrderChange}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SORT_ORDER_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className={SUBMIT_BUTTON_CLASSES}>
					<Button type="submit">Apply</Button>
				</div>
			</form>

			{showScanner && (
				<BarcodeScanner
					onScanSuccess={handleScanSuccess}
					onClose={() => setShowScanner(false)}
				/>
			)}
		</div>
	);
});

FilterForm.displayName = "FilterForm";

export default FilterForm;
