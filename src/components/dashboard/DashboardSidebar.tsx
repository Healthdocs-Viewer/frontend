import React from "react";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CircleHelp,
  FileText,
  Home,
  Menu,
  Plus,
  Settings,
} from "lucide-react";

type DashboardSidebarProps = {
  activePath: string;
};

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ activePath }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const items = [
    ["Inicio", Home, "/dashboard"],
    ["Mis casos", BriefcaseBusiness, "/mis-casos"],
    ["Resultados", FileText, "/dashboard/resultados"],
    ["Notificaciones", Bell, "/notificaciones"],
  ] as const;

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-72"} fixed inset-y-0 left-0 z-10 hidden border-r border-slate-200 bg-white transition-all lg:block`}
    >
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-900">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </div>
          {!collapsed && <span className="text-base font-semibold">Healthdocs</span>}
        </div>

        <a
          href="/mis-casos"
          className="mt-7 flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {!collapsed && "Crear nuevo"}
        </a>

        <nav aria-label="Navegación principal" className="mt-5 space-y-1 text-sm text-slate-600">
          {items.map(([label, Icon, href]) => {
            const active = activePath === href;
            return (
              <a
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${active ? "bg-slate-100 font-medium text-slate-900" : "hover:bg-slate-100"}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {!collapsed && label}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto">
          {!collapsed && <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Sistema</p>}
          <a href="/dashboard/ayuda" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Ayuda"}
          </a>
          <a href="/dashboard/configuracion" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
            <Settings className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Configuración"}
          </a>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Contraer menú"}
          </button>
        </div>
      </div>
    </aside>
  );
};
