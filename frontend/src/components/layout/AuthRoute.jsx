import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function AuthRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Optionally wait for loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading authentication state...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to their specific dashboard instead of a generic one
    let target = "/dashboard";
    if (user?.role === "admin" || user?.role === "verifier" || user?.role === "registrar") {
      target = "/admin";
    } else if (user?.role === "bank") {
      target = "/bank";
    } else if (user?.role === "super_admin") {
      target = "/super-admin";
    }
    return <Navigate to={target} replace />;
  }

  return children;
}
