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
  UsersRound,
} from "lucide-react";
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
  role = "patient",
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  const toggleCollapsed = () => {
    const nextCollapsed = !collapsed;
    setInternalCollapsed(nextCollapsed);
    onCollapsedChange?.(nextCollapsed);
  };

  const commonItems = [
    ["Inicio", Home, "/"],
    ["Notificaciones", Bell, "/notificaciones"],
  ] as const;

  const patientItems = [
    ["Mis casos", BriefcaseBusiness, "/mis_casos"],
    ["Mis resultados", FileText, "/mis_resultados"],
  ] as const;

  // Researchers also have a personal patient-style workspace. Keep those links
  // separate from the academic case/result views below.
  const items = role === "patient" || role === "researcher" || role === "coordinator" || role === "admin"
    ? [...commonItems, ...patientItems]
    : commonItems;

  const teachingItems = [
    ["Casos disponibles", FolderSearch, "/casos_academicos"],
    ["Investigadores", UsersRound, "/investigadores"],
    ["Resultados de docencia", Send, "/resultados"],
  ] as const;

  const researcherItems = [
    ["Casos asignados", ClipboardList, "/casos_asignados"],
    ["Resultados cargados", FileText, "/resultados_cargados"],
  ] as const;

  const isActivePath = (href: string) =>
    activePath === href || activePath.startsWith(`${href}/`);
  const subnavItemClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg py-2 text-sm ${collapsed ? "justify-center px-0" : "px-3"} ${active ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`;

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-72"} fixed inset-y-0 left-0 z-10 hidden border-r border-slate-200 bg-white transition-all dark:border-slate-700 dark:bg-slate-900 lg:block`}
    >
      <div className="flex h-full flex-col p-4">
        <div className={`flex items-center gap-3 py-2 ${collapsed ? "justify-center px-0" : "px-3"}`}>
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-slate-900">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </div>
          {!collapsed && (
            <span className="text-base font-semibold">Healthdocs</span>
          )}
        </div>

        {role === "patient" && (
          <NavLink
            to="/crear_caso"
            className={`mt-7 flex items-center gap-3 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 ${collapsed ? "justify-center px-0" : "px-3"}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Crear nuevo"}
          </NavLink>
        )}

        <nav
          aria-label="Navegación principal"
          className="mt-5 space-y-1 text-sm text-slate-600"
        >
          {items.map(([label, Icon, href]) => {
            return (
              <NavLink
                key={label}
                to={href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg py-2.5 ${collapsed ? "justify-center px-0" : "px-3"} ${isActive ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {!collapsed && label}
              </NavLink>
            );
          })}

          {role === "coordinator" && (
            <div className={collapsed ? "mt-5 border-t border-slate-200 pt-3 dark:border-slate-700" : "pt-5"}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Coordinador
                </p>
              )}
              <div className={`space-y-1 ${collapsed ? "" : "border-l border-slate-200 pl-2 dark:border-slate-700"}`}>
                {teachingItems.map(([label, Icon, href]) => {
                  const active = isActivePath(href);
                  return (
                    <NavLink
                      key={label}
                      to={href}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? label : undefined}
                      className={subnavItemClass(active)}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {!collapsed && label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}

          {role === "researcher" && (
            <div className={collapsed ? "mt-5 border-t border-slate-200 pt-3 dark:border-slate-700" : "pt-5"}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Investigador
                </p>
              )}
              <div className={`space-y-1 ${collapsed ? "" : "border-l border-slate-200 pl-2 dark:border-slate-700"}`}>
                {researcherItems.map(([label, Icon, href]) => {
                  const active = isActivePath(href);
                  return (
                    <NavLink
                      key={label}
                      to={href}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? label : undefined}
                      className={subnavItemClass(active)}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {!collapsed && label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        <div className="mt-auto">
          {!collapsed && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sistema
            </p>
          )}
          <NavLink
            to="/ayuda"
            className={`flex items-center gap-3 rounded-lg py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${collapsed ? "justify-center px-0" : "px-3"}`}
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Ayuda"}
          </NavLink>
          <NavLink
            to="/configuracion"
            className={`flex items-center gap-3 rounded-lg py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${collapsed ? "justify-center px-0" : "px-3"}`}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Configuración"}
          </NavLink>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`mt-2 flex w-full items-center gap-3 rounded-lg py-2.5 text-sm text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 ${collapsed ? "justify-center px-0" : "px-3"}`}
          >
            <Menu className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && "Contraer menú"}
          </button>
        </div>
      </div>
    </aside>
  );
};
