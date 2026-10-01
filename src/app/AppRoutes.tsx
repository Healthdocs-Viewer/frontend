import { Navigate, Routes, Route, useParams } from "react-router-dom";

import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardRedirect } from "../pages/dashboards/DashboardRedirect";
import { PersonalCasesPage } from "../pages/cases/PersonalCasesPage";
import { CreateCasePage } from "../pages/cases/CreateCasePage";
import { AcademicCasesPage } from "../pages/cases/AcademicCasesPage";
import { CaseDetailPage } from "../pages/cases/CaseDetailPage";
import { AcademicCaseDetailPage } from "../pages/cases/AcademicCaseDetailPage";
import { AcademicStudentsPage } from "../pages/teaching/AcademicStudentsPage";
import { AcademicResultsPage } from "../pages/teaching/AcademicResultsPage";
import { ResultsPage } from "../pages/results/ResultsPage";
import { ResultDetailPage } from "../pages/results/ResultDetailPage";
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { RoleRoute } from "./RoleRoute";
import { CoordinatorDashboardPage } from "../pages/dashboards/CoordinatorDashboardPage";

const LegacyResultDetailRedirect = () => {
  const { caseId } = useParams<{ caseId: string }>();
  return (
    <Navigate
      to={caseId ? `/mis-resultados/${caseId}` : "/mis-resultados"}
      replace
    />
  );
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/crear-caso" element={<CreateCasePage />} />
          <Route path="/mis-casos" element={<PersonalCasesPage />} />
          <Route path="/mis-casos/nuevo" element={<CreateCasePage />} />
          <Route path="/mis-casos/:caseId" element={<CaseDetailPage />} />

          <Route path="/mis-resultados" element={<ResultsPage />} />
          <Route
            path="/mis-resultados/:caseId"
            element={<ResultDetailPage />}
          />
          <Route path="/notificaciones" element={<NotificationsPage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route element={<RoleRoute allowedRoles={["profesor"]} />}>
            <Route
              path="/profesor/revision"
              element={<CoordinatorDashboardPage />}
            />
          </Route>
          <Route path="casos-academicos" element={<AcademicCasesPage />} />
          <Route
            path="/casos-academicos/:caseId"
            element={<AcademicCaseDetailPage />}
          />
          <Route path="/estudiantes" element={<AcademicStudentsPage />} />
          <Route path="/resultados" element={<AcademicResultsPage />} />

          <Route path="/ayuda" element={<NotFoundPage />} />
        </Route>
      </Route>

      {/* Compatibilidad con enlaces antiguos durante la migración. */}
      <Route
        path="/dashboard/resultados"
        element={<Navigate to="/mis-resultados" replace />}
      />
      <Route
        path="/resultados/:caseId"
        element={<LegacyResultDetailRedirect />}
      />
      <Route
        path="/dashboard/mis-casos"
        element={<Navigate to="/mis-casos" replace />}
      />
      <Route
        path="/dashboard/configuracion"
        element={<Navigate to="/configuracion" replace />}
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
