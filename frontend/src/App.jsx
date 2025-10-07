import { Outlet } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function App() {
	const { loading } = useAuth();

	if (loading) {
		return <LoadingSpinner size="2xl" text="Loading..." fullScreen />;
	}

	return <Outlet />;
}

export default App;
