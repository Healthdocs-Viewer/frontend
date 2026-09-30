import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type RoleRouteProps = {
  allowedRoles: string[];
};

export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};
