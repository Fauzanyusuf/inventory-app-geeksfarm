import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import Pagination from "@/components/shared/Pagination";
import FilterForm from "../components/FilterForm";
import ProductTable from "../components/ProductTable";
import { useProductsData } from "../hooks/useProductsData";
import { useCategoriesData } from "@/features/categories/hooks/useCategoriesData";
import { usePaginationParams } from "@/hooks/usePaginationParams";

export default function ProductList() {
	const [searchParams] = useSearchParams();
	const [formError, setFormError] = useState("");

	// Custom hooks for data management
	const { products, meta, loading, error, validated, totalPages } =
		useProductsData(searchParams);
	const { categories, categoriesError } = useCategoriesData();
	const { handlePageChange, handlePageSizeChange } = usePaginationParams();

	// Memoized error state to prevent unnecessary re-renders
	const displayError = useMemo(() => {
		return error || categoriesError;
	}, [error, categoriesError]);

	// Memoized pagination props to prevent unnecessary re-renders
	const paginationProps = useMemo(
		() => ({
			currentPage: validated?.page || 1,
			totalPages,
			totalItems: meta?.total || meta?.totalItems || products.length,
			pageSize: validated?.limit || 10,
			onPageChange: handlePageChange,
			onPageSizeChange: handlePageSizeChange,
		}),
		[
			validated,
			totalPages,
			meta,
			products.length,
			handlePageChange,
			handlePageSizeChange,
		]
	);

	return (
		<div className="form-container">
			<FilterForm
				categories={categories}
				formError={formError}
				setFormError={setFormError}
			/>

			<div className="bg-card shadow rounded-lg overflow-hidden">
				<ProductTable
					products={products}
					loading={loading}
					error={displayError}
				/>
			</div>

			{meta && validated && (
				<div className="mt-6">
					<Pagination {...paginationProps} />
				</div>
			)}
		</div>
	);
}
