import { memo } from "react";
import { formatPrice } from "@/utils/format";

const ProductCard = memo(function ProductCard({ product, onClick }) {
	return (
		<div
			onClick={() => onClick(product.id)}
			className="bg-card overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200">
			<div className="p-6">
				<h3 className="text-lg font-medium text-card-foreground mb-2 hover:text-primary transition-colors">
					{product.name}
				</h3>
				<p className="text-sm text-muted-foreground mb-4">
					{product.description
						? product.description.length < 110
							? product.description
							: product.description.slice(0, 100) + "..."
						: "No description available."}
				</p>
				<div className="flex justify-between items-center">
					<span className="text-lg font-semibold text-primary">
						{product.sellingPrice ? formatPrice(product.sellingPrice) : ""}
					</span>
				</div>
				{product.totalQuantity ? (
					<div className="mt-2 text-sm text-muted-foreground">
						Stock: {product.totalQuantity} {product.unit}
					</div>
				) : null}
			</div>
		</div>
	);
});

export default ProductCard;
