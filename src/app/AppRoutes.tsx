import { Routes, Route } from "react-router-dom";

import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardRedirect } from "../pages/dashboards/DashboardRedirect";
import { CasesPage } from "../pages/cases/CasesPage";
import { ResultsPage } from "../pages/results/ResultsPage";
import { ResultDetailPage } from "../pages/results/ResultDetailPage";
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardRedirect />} />
          <Route path="/mis-casos" element={<CasesPage />} />
          <Route path="/resultados" element={<ResultsPage />} />
          <Route path="/resultados/:caseId" element={<ResultDetailPage />} />
          <Route path="/notificaciones" element={<NotificationsPage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
