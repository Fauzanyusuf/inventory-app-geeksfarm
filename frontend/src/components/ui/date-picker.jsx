import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { getErrorFromRHF } from "@/utils/formUtils";

/**
 * DatePicker component menggunakan shadcn/ui Calendar
 * Implementasi sesuai dokumentasi resmi shadcn/ui
 */
const DatePicker = ({
	value,
	onChange,
	placeholder = "Pilih tanggal",
	disabled = false,
	errors = null,
	label,
	required = false,
	className = "",
	name = "",
	description = "",
}) => {
	const [open, setOpen] = React.useState(false);
	const [selectedDate, setSelectedDate] = React.useState(
		value ? new Date(value) : undefined
	);

	// Update selectedDate when value prop changes
	React.useEffect(() => {
		if (value) {
			setSelectedDate(new Date(value));
		} else {
			setSelectedDate(undefined);
		}
	}, [value]);

	const handleSelect = (date) => {
		if (date) {
			setSelectedDate(date);
			onChange(format(date, "yyyy-MM-dd"));
			setOpen(false);
		}
	};

	const errorMessage = errors ? getErrorFromRHF(errors, name) : null;

	return (
		<div className="space-y-2">
			{label && (
				<Label
					htmlFor={name}
					className={cn(
						"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
						errorMessage && "text-destructive"
					)}>
					{label}
					{required && <span className="text-destructive ml-1">*</span>}
				</Label>
			)}

			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal",
							!selectedDate && "text-muted-foreground",
							errorMessage &&
								"border-destructive focus-visible:ring-destructive",
							className
						)}
						disabled={disabled}
						id={name}>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{selectedDate ? format(selectedDate, "dd/MM/yyyy") : placeholder}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={selectedDate}
						onSelect={handleSelect}
						initialFocus
						className="rounded-md border shadow-sm"
					/>
				</PopoverContent>
			</Popover>

			{errorMessage && (
				<p className="text-sm text-destructive">{errorMessage}</p>
			)}
		</div>
	);
};

export { DatePicker };
