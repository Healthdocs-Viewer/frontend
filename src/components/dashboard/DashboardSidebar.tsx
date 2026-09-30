import React from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CircleHelp,
  FolderSearch,
  FileText,
  Home,
  Menu,
  Plus,
  Settings,
  Send,
  ClipboardList,
  GraduationCap,
  UserPlus,
} from "lucide-react";
import { navigateDashboard } from "./dashboardNavigation";
import type { UserRole } from "../../types/api";

type DashboardSidebarProps = {
  activePath: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  role?: UserRole;
};

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activePath,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  role = "paciente",
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  const toggleCollapsed = () => {
    const nextCollapsed = !collapsed;
    setInternalCollapsed(nextCollapsed);
    onCollapsedChange?.(nextCollapsed);
  };

  const handleNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigateDashboard(href);
  };
  
  const items = [
    ["Inicio", Home, "/"],
    ["Mis casos", BriefcaseBusiness, "/mis-casos"],
    ["Resultados", FileText, "/resultados"],
    ["Notificaciones", Bell, "/notificaciones"],
  ] as const;

  const teachingItems = [
    ["Casos disponibles", FolderSearch, "/docencia/casos"],
    ["Asignaciones", UserPlus, "/docencia/asignaciones"],
    ["Resultados por publicar", Send, "/docencia/resultados"],
  ] as const;

  const studentItems = [
    ["Casos asignados", ClipboardList, "/estudiante/casos"],
    ["Mis evaluaciones", GraduationCap, "/estudiante/evaluaciones"],
    ["Resultados recibidos", FileText, "/estudiante/resultados"],
  ] as const;

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-72"} fixed inset-y-0 left-0 z-10 hidden border-r border-slate-200 bg-white transition-all dark:border-slate-700 dark:bg-slate-900 lg:block`}
    >
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-900">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </div>
          {!collapsed && (
            <span className="text-base font-semibold">Healthdocs</span>
          )}
        </div>

        <NavLink
          to="/crear-caso"
          className="mt-7 flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {!collapsed && "Crear nuevo"}
        </NavLink>

        <nav
          aria-label="Navegación principal"
          className="mt-5 space-y-1 text-sm text-slate-600"
        >
          {items.map(([label, Icon, href]) => {
            return (
              <NavLink
                key={label}
                to={href === "/" ? "/dashboard" : href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 ${isActive ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {!collapsed && label}
              </NavLink>
            );
          })}

          <div className="pt-5">
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Docencia
              </p>
            )}
            <div className="space-y-1 border-l border-slate-200 pl-2">
              {teachingItems.map(([label, Icon, href]) => {
                const active = activePath === href;
                return (
                  <a
                    key={label}
                    href={href}
                    onClick={(event) => handleNavigation(event, href)}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!collapsed && label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="pt-5">
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Estudiantes
              </p>
            )}
            <div className="space-y-1 border-l border-slate-200 pl-2">
              {studentItems.map(([label, Icon, href]) => {
                const active = activePath === href;
                return (
                  <a
                    key={label}
                    href={href}
                    onClick={(event) => handleNavigation(event, href)}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!collapsed && label}
                  </a>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="mt-auto">
          {!collapsed && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sistema
            </p>
          )}
          <NavLink
            to="/ayuda"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Ayuda"}
          </NavLink>
          <NavLink
            to="/configuracion"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Configuración"}
          </NavLink>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Contraer menú"}
          </button>
        </div>
      </div>
    </aside>
  );
};
