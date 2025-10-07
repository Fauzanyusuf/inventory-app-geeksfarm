import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { productListQuerySchema } from "@/validation/product-validation";
import { productsApi, categoriesApi } from "@/services/api";
import { getErrorMessage } from "@/utils/errorUtils";
import ProductCard from "@/components/shared/ProductCard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SelectField } from "@/components/ui/select-field";
import Pagination from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Utility to build API query params from validated data
const buildQueryParams = (validated) => ({
	page: validated.page,
	limit: validated.limit,
	...(validated.search && { search: validated.search }),
	...(validated.category && { category: validated.category }),
	...(validated.minPrice !== undefined && { minPrice: validated.minPrice }),
	...(validated.maxPrice !== undefined && { maxPrice: validated.maxPrice }),
	sortBy: validated.sortBy,
	sortOrder: validated.sortOrder,
});

export default function ProductList() {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const [products, setProducts] = useState([]);
	const [meta, setMeta] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [formError, setFormError] = useState("");
	const [categories, setCategories] = useState([]);
	const [validated, setValidated] = useState(null);

	// Load categories for filter select
	useEffect(() => {
		const controller = new AbortController();
		(async () => {
			try {
				const res = await categoriesApi.getCategories(
					{ limit: 100 },
					{ signal: controller.signal }
				);
				setCategories(res?.data || []);
			} catch (err) {
				if (err.name !== "AbortError") {
					console.error("Failed to load categories:", err.message);
					setError(getErrorMessage(err, "categories", "load"));
				}
			}
		})();
		return () => controller.abort();
	}, []);

	// Validate query params and fetch products
	const fetchProducts = useCallback(async (params, signal) => {
		setLoading(true);
		try {
			const res = await productsApi.getProducts(params, { signal });
			setProducts(res?.data || []);
			setMeta(res?.meta || null);
			setError("");
		} catch (err) {
			if (err.name !== "AbortError") {
				setError(getErrorMessage(err, "products", "load"));
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const raw = Object.fromEntries(searchParams.entries());
		const parsed = productListQuerySchema.safeParse(raw);
		if (!parsed.success) {
			setValidated(null);
			setError("Invalid query parameters");
			return;
		}

		setValidated(parsed.data);
		const params = buildQueryParams(parsed.data);
		const controller = new AbortController();
		fetchProducts(params, controller.signal);
		return () => controller.abort();
	}, [searchParams, fetchProducts]);

	const totalPages =
		meta && validated?.limit
			? Math.max(
					1,
					Math.ceil((meta.total || meta.totalItems || 0) / validated.limit)
			  )
			: 1;

	const handleProductClick = useCallback(
		(id) => {
			navigate(`/products/${id}`);
		},
		[navigate]
	);

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
			setSearchParams({ ...parsed.data, page: 1 }, { replace: false });
		},
		[setSearchParams]
	);

	return (
		<div className="form-container">
			<div className="form-card mb-6">
				<form
					onSubmit={handleFilterSubmit}
					className="grid grid-cols-1 md:grid-cols-6 gap-4">
					{formError && (
						<div className="md:col-span-6 mb-2 text-sm text-destructive-foreground">
							{formError}
						</div>
					)}
					<div className="col-span-2">
						<Label
							htmlFor="search"
							className="block text-sm font-medium text-muted-foreground">
							Search
						</Label>
						<Input
							id="search"
							name="search"
							defaultValue={searchParams.get("search") || ""}
						/>
					</div>

					<div>
						<SelectField
							name="category"
							label="Category"
							value={searchParams.get("category") || ""}
							onChange={(value) => {
								const newParams = new URLSearchParams(searchParams);
								if (value) {
									newParams.set("category", value);
								} else {
									newParams.delete("category");
								}
								navigate(`?${newParams.toString()}`);
							}}
							placeholder="All Categories"
							options={categories.map((c) => ({
								value: c.name,
								label: c.name,
							}))}
						/>
					</div>

					<div>
						<Label className="block text-sm font-medium text-muted-foreground">
							Min Price
						</Label>
						<div className="mt-1 flex rounded-md">
							<span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-popover text-sm text-popover-foreground">
								Rp
							</span>
							<Input
								name="minPrice"
								label="Min Price"
								defaultValue={searchParams.get("minPrice") || ""}
								type="number"
								min="0"
								step="1"
								placeholder="Min"
								className="flex-1 block w-full rounded-r-md rounded-l-none"
							/>
						</div>
					</div>

					<div>
						<Label className="block text-sm font-medium text-muted-foreground">
							Max Price
						</Label>
						<div className="mt-1 flex rounded-md ">
							<span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-popover text-sm text-popover-foreground">
								Rp
							</span>
							<Input
								name="maxPrice"
								defaultValue={searchParams.get("maxPrice") || ""}
								type="number"
								min="0"
								step="1"
								placeholder="Max"
								className="flex-1 block w-full rounded-r-md rounded-l-none"
							/>
						</div>
					</div>

					<div>
						<SelectField
							name="sortBy"
							label="Sort By"
							value={searchParams.get("sortBy") || "name"}
							onChange={(value) => {
								const newParams = new URLSearchParams(searchParams);
								newParams.set("sortBy", value);
								navigate(`?${newParams.toString()}`);
							}}
							placeholder="Select sorting"
							options={[
								{ value: "name", label: "Name" },
								{ value: "sellingPrice", label: "Price" },
							]}
						/>
					</div>

					<div>
						<Label className="block text-sm font-medium text-muted-foreground">
							Order
						</Label>
						<div className="mt-1 flex items-center space-x-2">
							<Select
								value={searchParams.get("sortOrder") || "asc"}
								onValueChange={(value) => {
									const next = Object.fromEntries(searchParams.entries());
									next.sortOrder = value;
									setSearchParams(next, { replace: false });
								}}>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="asc">Ascending</SelectItem>
									<SelectItem value="desc">Descending</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="md:col-span-6 text-right">
						<Button type="submit">Apply</Button>
					</div>
				</form>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{loading ? (
					<div className="col-span-3">
						<LoadingSpinner size="lg" text="Loading products..." />
					</div>
				) : error ? (
					<div className="col-span-3">
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					</div>
				) : products.length === 0 ? (
					<div className="col-span-3 text-muted-foreground">
						No products found
					</div>
				) : (
					products.map((p) => (
						<ProductCard key={p.id} product={p} onClick={handleProductClick} />
					))
				)}
			</div>

			{meta && validated && (
				<div className="mt-6">
					<Pagination
						currentPage={validated.page}
						totalPages={totalPages}
						totalItems={meta.total || meta.totalItems || products.length}
						pageSize={validated.limit}
						onPageChange={(p) => {
							const next = Object.fromEntries(searchParams.entries());
							if (p === 1) delete next.page;
							else next.page = String(p);
							setSearchParams(next, { replace: false });
						}}
						onPageSizeChange={(ps) => {
							const next = Object.fromEntries(searchParams.entries());
							if (ps === 10) delete next.limit;
							else next.limit = String(ps);
							next.page = "1";
							setSearchParams(next, { replace: false });
						}}
					/>
				</div>
			)}
		</div>
	);
}
