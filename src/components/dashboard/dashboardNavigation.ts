export const dashboardRoutes = [
  "/",
  "/mis-casos",
  "/resultados",
  "/notificaciones",
  "/configuracion",
] as const;

export const isDashboardRoute = (path: string): boolean =>
  dashboardRoutes.includes(path as (typeof dashboardRoutes)[number]);

export const navigateDashboard = (href: string): void => {
  if (window.location.pathname === href) return;
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
};