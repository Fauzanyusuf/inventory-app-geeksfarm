import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";

const BackButton = ({
	children,
	className = "",
	variant = "outline",
	size = "default",
	...props
}) => {
	const handleBack = () => {
		window.history.back();
	};

	return (
		<Button
			onClick={handleBack}
			variant={variant}
			size={size}
			className={`${className}`}
			{...props}>
			<ChevronLeftIcon className="w-4 h-4 mr-2" />
			{children || "Back"}
		</Button>
	);
};

export default BackButton;
