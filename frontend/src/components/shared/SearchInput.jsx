import { forwardRef } from "react";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

const SearchInput = forwardRef(
	(
		{
			id = "search",
			value,
			onChange,
			placeholder = "Search...",
			showClear = true,
			onClear,
			children,
		},
		ref
	) => {
		return (
			<div className="relative">
				<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg
						className="h-5 w-5 text-muted-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>

				<FormField
					ref={ref}
					id={id}
					name={id}
					type="text"
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-popover placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground focus:ring-1 focus:ring-ring focus:border-ring text-popover-foreground sm:text-sm"
					errors={null}
				/>

				{showClear && value && (
					<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
						<Button variant="ghost" size="icon" onClick={onClear}>
							<svg
								className="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</Button>
					</div>
				)}

				{children}
			</div>
		);
	}
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
