import React from "react";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardSidebar } from "./DashboardSidebar";

type DashboardLayoutProps = {
  path: string;
  title: string;
  children: React.ReactNode;
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  path,
  title,
  children,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        activePath={path}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <main className={`${collapsed ? "lg:pl-20" : "lg:pl-72"} transition-all`}>
        <DashboardNavbar title={title} />
        {children}
      </main>
    </div>
  );
};
