import { memo, useCallback } from "react";
import { useNavigate } from "react-router";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPrice } from "@/utils/format";
import { Eye, Edit } from "lucide-react";
import {
	TABLE_COLUMNS,
	ACTION_BUTTONS,
	NO_CATEGORY_TEXT,
	NO_PRICE_TEXT,
	DEFAULT_UNIT,
	NO_BARCODE_TEXT,
} from "../constants/product-list-constants";

/**
 * ProductTable component for displaying products in table format
 * Memoized for performance optimization
 */
const ProductTable = memo(({ products, loading, error }) => {
	const navigate = useNavigate();

	const handleProductClick = useCallback(
		(id) => {
			navigate(`/products/${id}`);
		},
		[navigate]
	);

	const handleEditProduct = useCallback(
		(id, e) => {
			e.preventDefault();
			e.stopPropagation();
			navigate(`/products/${id}/edit`);
		},
		[navigate]
	);

	if (loading) {
		return (
			<div className="p-8">
				<LoadingSpinner size="lg" text="Loading products..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (products.length === 0) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				No products found
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className={TABLE_COLUMNS.PRODUCT_NAME.width}>
						{TABLE_COLUMNS.PRODUCT_NAME.label}
					</TableHead>
					<TableHead className={TABLE_COLUMNS.BARCODE.width}>
						{TABLE_COLUMNS.BARCODE.label}
					</TableHead>
					<TableHead className={TABLE_COLUMNS.CATEGORY.width}>
						{TABLE_COLUMNS.CATEGORY.label}
					</TableHead>
					<TableHead className={TABLE_COLUMNS.PRICE.width}>
						{TABLE_COLUMNS.PRICE.label}
					</TableHead>
					<TableHead
						className={`${TABLE_COLUMNS.STOCK.width} ${TABLE_COLUMNS.STOCK.align}`}>
						{TABLE_COLUMNS.STOCK.label}
					</TableHead>
					<TableHead
						className={`${TABLE_COLUMNS.ACTIONS.width} ${TABLE_COLUMNS.ACTIONS.align}`}>
						{TABLE_COLUMNS.ACTIONS.label}
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{products.map((product) => (
					<ProductRow
						key={product.id}
						product={product}
						onProductClick={handleProductClick}
						onEditProduct={handleEditProduct}
					/>
				))}
			</TableBody>
		</Table>
	);
});

/**
 * Individual product row component
 * Memoized for performance optimization
 */
const ProductRow = memo(({ product, onProductClick, onEditProduct }) => {
	return (
		<TableRow
			className="cursor-pointer hover:bg-muted/50"
			onClick={() => onProductClick(product.id)}>
			<TableCell className="font-semibold text-card-foreground">
				{product.name}
			</TableCell>
			<TableCell>{product.barcode || NO_BARCODE_TEXT}</TableCell>
			<TableCell>{product.category?.name || NO_CATEGORY_TEXT}</TableCell>
			<TableCell className="font-semibold text-primary">
				{product.sellingPrice
					? formatPrice(product.sellingPrice)
					: NO_PRICE_TEXT}
			</TableCell>
			<TableCell className={`${TABLE_COLUMNS.STOCK.align}`}>
				{product.totalQuantity || 0}
				<span className="text-muted-foreground font-light ml-2">
					{product.unit || DEFAULT_UNIT}
				</span>
			</TableCell>
			<TableCell className="text-right">
				<div className="flex items-center justify-end gap-2">
					<Button
						variant={ACTION_BUTTONS.VIEW.variant}
						size="sm"
						onClick={() => onProductClick(product.id)}
						title={ACTION_BUTTONS.VIEW.title}>
						<Eye className="h-4 w-4" />
					</Button>
					<Button
						variant={ACTION_BUTTONS.EDIT.variant}
						size="sm"
						onClick={(e) => onEditProduct(product.id, e)}
						title={ACTION_BUTTONS.EDIT.title}>
						<Edit className="h-4 w-4" />
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
});

ProductTable.displayName = "ProductTable";
ProductRow.displayName = "ProductRow";

export default ProductTable;
