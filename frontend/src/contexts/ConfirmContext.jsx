import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";
import { ConfirmModal } from "@/components/ui/modal";

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
			<ConfirmModal
				open={open}
				title={title}
				message={message}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		</ConfirmContext.Provider>
	);
};

export const useConfirm = () => {
	const ctx = useContext(ConfirmContext);
	if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
	return ctx.confirm;
};

export default ConfirmContext;
