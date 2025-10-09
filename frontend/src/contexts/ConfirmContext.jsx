import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
	const resolveRef = useRef(null);
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("Confirm");
	const [message, setMessage] = useState("");

	const confirm = useCallback(
		({ title: t = "Confirm", message: m = "" } = {}) => {
			setTitle(t);
			setMessage(m);
			setOpen(true);
			return new Promise((resolve) => {
				resolveRef.current = resolve;
			});
		},
		[]
	);

	const handleConfirm = useCallback(() => {
		if (resolveRef.current) resolveRef.current(true);
		resolveRef.current = null;
		setOpen(false);
	}, []);

	const handleCancel = useCallback(() => {
		if (resolveRef.current) resolveRef.current(false);
		resolveRef.current = null;
		setOpen(false);
	}, []);

	return (
		<ConfirmContext.Provider value={{ confirm }}>
			{children}
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{title}</AlertDialogTitle>
						<AlertDialogDescription>{message}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirm}>
							Confirm
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</ConfirmContext.Provider>
	);
};

export const useConfirm = () => {
	const ctx = useContext(ConfirmContext);
	if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
	return ctx.confirm;
};

export default ConfirmContext;
