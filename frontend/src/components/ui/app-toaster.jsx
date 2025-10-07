import { Toaster } from "@/components/ui/sonner";

const AppToaster = () => {
	return (
		<Toaster
			position="top-right"
			expand={true}
			richColors={true}
			closeButton={true}
			visibleToasts={5}
		/>
	);
};

export default AppToaster;
