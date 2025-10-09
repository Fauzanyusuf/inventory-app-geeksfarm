import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { getErrorFromRHF } from "@/utils/formUtils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const SelectField = ({
	name,
	label,
	value,
	onChange,
	onBlur,
	placeholder = "Pilih opsi",
	disabled = false,
	errors = null,
	required = false,
	className = "",
	description = "",
	options = [],
	...props
}) => {
	const errorMessage = errors ? getErrorFromRHF(errors, name) : null;

	return (
		<div className="space-y-2">
			{label && (
				<Label
					htmlFor={name}
					className={cn(
						"block text-sm font-medium text-muted-foreground mb-2",
						errorMessage && "text-destructive"
					)}>
					{label}
					{required && <span className="text-destructive ml-1">*</span>}
				</Label>
			)}

			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}

			<Select
				value={
					value === "" || value === null || value === undefined
						? undefined
						: value
				}
				onValueChange={onChange}
				disabled={disabled}
				{...props}>
				<SelectTrigger
					className={cn(
						"w-full",
						errorMessage && "border-destructive focus-visible:ring-destructive",
						className
					)}
					onBlur={onBlur}>
					<SelectValue placeholder={placeholder}>
						{options.find((option) => option.value === value)?.label}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{errorMessage && (
				<p className="text-sm text-destructive">{errorMessage}</p>
			)}
		</div>
	);
};

export { SelectField };
