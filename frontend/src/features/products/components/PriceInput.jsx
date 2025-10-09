import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CURRENCY_PREFIX } from "../constants/product-list-constants";

const PriceInput = ({
	name,
	label,
	defaultValue = "",
	placeholder,
	className = "",
}) => {
	return (
		<div>
			<Label className="block text-sm font-medium text-muted-foreground">
				{label}
			</Label>
			<div className="mt-1 flex rounded-md">
				<span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-popover text-sm text-popover-foreground">
					{CURRENCY_PREFIX}
				</span>
				<Input
					name={name}
					defaultValue={defaultValue}
					type="number"
					min="0"
					step="1"
					placeholder={placeholder}
					className={`flex-1 block w-full rounded-r-md rounded-l-none ${className}`}
				/>
			</div>
		</div>
	);
};

export default PriceInput;
