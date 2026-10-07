import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/api";

type RoleRouteProps = {
  allowedRoles: UserRole[];
};

export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
};
