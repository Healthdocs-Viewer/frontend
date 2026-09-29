import { Navigate, Routes, Route } from "react-router-dom";

import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardRedirect } from "../pages/dashboards/DashboardRedirect";
import { CasesPage } from "../pages/cases/CasesPage";
import { CreateCasePage } from "../pages/cases/CreateCasePage";
import { CaseDetailPage } from "../pages/cases/CaseDetailPage";
import { ResultsPage } from "../pages/results/ResultsPage";
import { ResultDetailPage } from "../pages/results/ResultDetailPage";
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { RoleRoute } from "./RoleRoute";
import { CoordinatorDashboardPage } from "../pages/dashboards/CoordinatorDashboardPage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/mis-casos" element={<CasesPage />} />
          <Route path="/mis-casos/nuevo" element={<CreateCasePage />} />
          <Route path="/mis-casos/:caseId" element={<CaseDetailPage />} />
          <Route path="/resultados" element={<ResultsPage />} />
          <Route path="/resultados/:caseId" element={<ResultDetailPage />} />
          <Route path="/notificaciones" element={<NotificationsPage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route element={<RoleRoute allowedRoles={["profesor"]} />}>
            <Route path="/profesor/revision" element={<CoordinatorDashboardPage />} />
          </Route>
          <Route path="/ayuda" element={<NotFoundPage />} />
        </Route>
      </Route>

      {/* Compatibilidad con enlaces antiguos durante la migración. */}
      <Route path="/dashboard/resultados" element={<Navigate to="/resultados" replace />} />
      <Route path="/dashboard/mis-casos" element={<Navigate to="/mis-casos" replace />} />
      <Route path="/dashboard/configuracion" element={<Navigate to="/configuracion" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
