import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function AuthRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Optionally wait for loading
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading authentication state...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the home page or register
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
