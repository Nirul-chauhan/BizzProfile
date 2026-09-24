import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * ProtectedRoute — guards routes by authentication and optional role.
 *
 * Props:
 *   allowedRoles — array of role names allowed (e.g. ["ADMIN", "CUSTOMER"]).
 *                  If omitted, any authenticated user can access.
 *   children     — the route content to render.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role?.name)) {
    // Redirect to the appropriate dashboard based on role
    const roleRedirect = {
      ADMIN: "/admin/dashboard",
      BUYER: "/buyer/dashboard",
      SELLER: "/seller/dashboard",
      CUSTOMER: "/customer/dashboard",
      ENDUSER: "/enduser",
    };
    const fallback = roleRedirect[user?.role?.name] || "/";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
