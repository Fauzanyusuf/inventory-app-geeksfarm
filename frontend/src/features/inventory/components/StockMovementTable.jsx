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
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from "@/utils/format";
import { ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

const StockMovementTable = memo(({ movements, loading }) => {
	const navigate = useNavigate();

	const handleProductClick = useCallback(
		(productId, productBatchId) => {
			if (productId && productBatchId) {
				navigate(`/products/${productId}/batches/${productBatchId}`);
			}
		},
		[navigate]
	);

	const getMovementTypeIcon = (type) => {
		switch (type) {
			case "IN":
				return <ArrowUp className="h-3 w-3" />;
			case "OUT":
				return <ArrowDown className="h-3 w-3" />;
			case "ADJUSTMENT":
				return <RotateCcw className="h-3 w-3" />;
			default:
				return null;
		}
	};

	const getMovementTypeBadge = (type, quantity = 0) => {
		switch (type) {
			case "IN":
				return (
					<Badge
						variant="default"
						className="bg-green-100 text-green-800 hover:bg-green-200">
						{getMovementTypeIcon(type)}
						<span className="ml-1">IN</span>
					</Badge>
				);
			case "OUT":
				return (
					<Badge
						variant="destructive"
						className="bg-red-100 text-red-800 dark:text-red-100 hover:bg-red-200">
						{getMovementTypeIcon(type)}
						<span className="ml-1">OUT</span>
					</Badge>
				);
			case "ADJUSTMENT":
				return (
					<Badge
						variant="secondary"
						className={`${
							quantity >= 0
								? "bg-green-100 text-green-800 hover:bg-green-200"
								: "bg-red-100 text-red-800 hover:bg-red-200"
						}`}>
						{getMovementTypeIcon(type)}
						<span className="ml-1">ADJUST {quantity >= 0 ? "+" : "-"}</span>
					</Badge>
				);
			default:
				return <Badge variant="outline">{type}</Badge>;
		}
	};

	const getBatchStatusBadge = (status) => {
		switch (status) {
			case "AVAILABLE":
				return (
					<Badge
						variant="default"
						className="bg-green-100 text-green-800 hover:bg-green-200">
						Available
					</Badge>
				);
			case "EXPIRED":
				return (
					<Badge
						variant="destructive"
						className="text-red-800 dark:text-red-100 hover:bg-red-200">
						Expired
					</Badge>
				);
			case "SOLD_OUT":
				return (
					<Badge
						variant="secondary"
						className="bg-gray-100 text-gray-800 hover:bg-gray-200">
						Sold Out
					</Badge>
				);
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const formatQuantity = (quantity, type) => {
		if (type === "IN") {
			return `+${Math.abs(quantity)}`;
		} else if (type === "OUT") {
			return `-${Math.abs(quantity)}`;
		} else if (type === "ADJUSTMENT") {
			return quantity >= 0 ? `+${quantity}` : `${quantity}`;
		}
		return `${quantity}`;
	};

	const formatExpiryDate = (expiredAt) => {
		if (!expiredAt) return "No expiry";

		const expiryDate = new Date(expiredAt);
		const now = new Date();
		const diffTime = expiryDate - now;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			return "Expired";
		} else if (diffDays === 0) {
			return "Expires today";
		} else if (diffDays <= 7) {
			return `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
		} else {
			return formatDate(expiredAt);
		}
	};

	if (loading) {
		return <LoadingSpinner size="default" text="Loading stock movements..." />;
	}

	if (!movements || movements.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6"
						/>
					</svg>
				</div>
				<h3 className="text-sm font-medium text-card-foreground mb-1">
					No stock movements found
				</h3>
				<p className="text-sm text-muted-foreground">
					Stock movements will appear here as inventory changes occur.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[200px]">Product</TableHead>
						<TableHead className="w-[120px]">Movement</TableHead>
						<TableHead className="w-[100px] text-right">Quantity</TableHead>
						<TableHead className="w-[150px]">Batch Status</TableHead>
						<TableHead className="w-[120px]">Expiry</TableHead>
						<TableHead className="w-[200px]">Note</TableHead>
						<TableHead className="w-[140px]">Date</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{movements.map((movement) => (
						<TableRow
							key={movement.id}
							className="hover:bg-muted/50 cursor-pointer"
							onClick={() =>
								handleProductClick(
									movement.product?.id,
									movement.productBatch?.id
								)
							}>
							<TableCell>
								<div className="space-y-1">
									<div className="font-medium text-sm">
										{movement.product?.name || "Unknown Product"}
									</div>
									{movement.product?.barcode && (
										<div className="text-xs text-muted-foreground font-mono">
											{movement.product.barcode}
										</div>
									)}
								</div>
							</TableCell>
							<TableCell>
								{getMovementTypeBadge(movement.movementType, movement.quantity)}
							</TableCell>
							<TableCell className="text-right">
								<span
									className={`font-medium ${
										movement.movementType === "IN"
											? "text-green-600"
											: movement.movementType === "OUT"
											? "text-red-600"
											: movement.movementType === "ADJUSTMENT"
											? movement.quantity >= 0
												? "text-green-600"
												: "text-red-600"
											: "text-yellow-600"
									}`}>
									{formatQuantity(movement.quantity, movement.movementType)}
								</span>
							</TableCell>
							<TableCell>
								{movement.productBatch ? (
									getBatchStatusBadge(movement.productBatch.status)
								) : (
									<span className="text-xs text-muted-foreground">
										No batch
									</span>
								)}
							</TableCell>
							<TableCell>
								{movement.productBatch?.expiredAt ? (
									<span
										className={`text-xs ${
											new Date(movement.productBatch.expiredAt) <= new Date()
												? "text-red-600 font-medium"
												: new Date(movement.productBatch.expiredAt) <=
												  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
												? "text-yellow-600 font-medium"
												: "text-muted-foreground"
										}`}>
										{formatExpiryDate(movement.productBatch.expiredAt)}
									</span>
								) : (
									<span className="text-xs text-muted-foreground">
										No expiry
									</span>
								)}
							</TableCell>
							<TableCell>
								{movement.note ? (
									<div
										className="text-xs text-muted-foreground max-w-[180px] truncate"
										title={movement.note}>
										{movement.note}
									</div>
								) : (
									<span className="text-xs text-muted-foreground">-</span>
								)}
							</TableCell>
							<TableCell>
								<div className="text-xs text-muted-foreground">
									{formatDate(movement.createdAt)}
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
});

StockMovementTable.displayName = "StockMovementTable";

export default StockMovementTable;
