import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = () => {
  console.log("owo");

  const { user, token, isLoading } = useAuth();

  // if (isLoading) {
  //   return <div>Cargando...</div>;
  // }

  // if (!token || !user) {
  //   return <Navigate to="/login" replace />;
  // }

  return <Outlet />;
};
