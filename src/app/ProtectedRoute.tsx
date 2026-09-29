import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = () => {
  // const { user, token, isLoading } = useAuth();

  // if (isLoading) {
  //   return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  // }

  // if (!token || !user) {
  //   return <Navigate to="/login" replace />;
  // }

  return <Outlet />;
};
