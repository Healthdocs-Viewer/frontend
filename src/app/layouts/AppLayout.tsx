import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { DashboardNavbar } from "../../components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "../../components/dashboard/DashboardSidebar";
import { useAuth } from "../../context/AuthContext";

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        activePath={location.pathname}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        role={user?.role}
      />

      <main className={`${collapsed ? "lg:pl-20" : "lg:pl-72"} transition-all`}>
        <DashboardNavbar title="Healthdocs" />
        <div className="space-y-6 p-5 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
