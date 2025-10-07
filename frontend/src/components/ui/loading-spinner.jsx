import { cn } from "@/lib/utils";

const LoadingSpinner = ({
	size = "default",
	text = "Loading...",
	className = "",
	fullScreen = false,
}) => {
	const sizeClasses = {
		sm: "h-4 w-4",
		default: "h-8 w-8",
		lg: "h-12 w-12",
		xl: "h-16 w-16",
		"2xl": "h-32 w-32",
	};

	const spinnerClasses = cn(
		"animate-spin rounded-full border-2 border-transparent border-b-primary",
		sizeClasses[size],
		className
	);

	const content = (
		<div className="text-center">
			<div className={spinnerClasses}></div>
			{text && <p className="mt-4 text-muted-foreground">{text}</p>}
		</div>
	);

	if (fullScreen) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				{content}
			</div>
		);
	}

	return content;
};

export { LoadingSpinner };
