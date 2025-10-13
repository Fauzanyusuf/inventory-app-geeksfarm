import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";

const BackButton = ({
	to,
	children,
	className = "",
	variant = "outline",
	size = "default",
	...props
}) => {
	const navigate = useNavigate();

	const handleBack = () => {
		if (to) {
			navigate(to);
		} else {
			// Fallback to browser back if no specific route provided
			window.history.back();
		}
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
