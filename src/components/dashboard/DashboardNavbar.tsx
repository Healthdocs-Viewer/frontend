import React from "react";
import { Menu } from "lucide-react";

type DashboardNavbarProps = {
  title: string;
  onMobileMenuClick?: () => void;
};

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  title,
  onMobileMenuClick,
}) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menú de navegación"
          onClick={onMobileMenuClick}
          className="rounded-lg p-1 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-sm text-slate-400">Healthdocs /</span>
        <span className="font-medium">{title}</span>
      </div>
      <div
        role="img"
        aria-label="Avatar del usuario"
        className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500"
      />
    </header>
  );
};
