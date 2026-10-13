import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../Components/Ui/LoadingSpinner";

export default function ProtectedRoute() {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;

  return <Outlet />;
}
