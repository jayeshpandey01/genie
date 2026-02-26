import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, redirectTo = "/" }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to specified route with current location state
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;