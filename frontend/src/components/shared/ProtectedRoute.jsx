import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const ProtectedRoute = ({ children }) => {
	const location = useLocation();
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return <LoadingSpinner size="2xl" text="Loading..." fullScreen />;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return children;
};

export default ProtectedRoute;
