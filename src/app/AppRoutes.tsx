import { Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { AppLayout } from "./layouts/AppLayout";

import { LoginPage } from "../pages/auth/LoginPage";
import { SignupPage } from "../pages/auth/SignupPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { CreateCasePage } from "../pages/cases/CreateCasePage";
import { AcademicCaseDetailPage } from "../pages/cases/AcademicCaseDetailPage";
import { CoordinatorCasesPage } from "../pages/coordinator/CoordinatorCasesPage";
import { CoordinatorResultsPage } from "../pages/coordinator/CoordinatorResultsPage";
import { ResearcherAssignmentsPage } from "../pages/coordinator/ResearcherAssignmentsPage";
import { HelpPage } from "../pages/HelpPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { PatientCaseDetailPage } from "../pages/patient/PatientCaseDetailPage";
import { PatientCasesPage } from "../pages/patient/PatientCasesPage";
import { ResearcherCasesPage } from "../pages/researcher/ResearcherCasesPage";
import { ResearcherResultsPage } from "../pages/researcher/ResearcherResultsPage";
import { ResultDetailPage } from "../pages/results/ResultDetailPage";
import { ResultsPage } from "../pages/results/ResultsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { DashboardRedirect } from "../pages/dashboards/DashboardRedirect";

const PERSONAL_WORKSPACE_ROLES = [
  "patient",
  "researcher",
  "coordinator",
  "admin",
] as const;

export const AppRoutes = () => (
  <Routes>
    {/* Public access */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />

    {/* Authenticated application */}
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardRedirect />} />
        <Route path="notificaciones" element={<NotificationsPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="ayuda" element={<HelpPage />} />

        {/* Personal cases and results */}
        <Route element={<RoleRoute allowedRoles={[...PERSONAL_WORKSPACE_ROLES]} />}>
          <Route path="crear_caso" element={<CreateCasePage />} />
          <Route path="mis_casos" element={<PatientCasesPage />} />
          <Route path="mis_casos/nuevo" element={<CreateCasePage />} />
          <Route path="mis_casos/:caseId" element={<PatientCaseDetailPage />} />
          <Route path="mis_casos/:caseId/edit" element={<CreateCasePage />} />
          <Route path="mis_resultados" element={<ResultsPage />} />
          <Route path="mis_resultados/:caseId" element={<ResultDetailPage />} />
        </Route>

        {/* Coordinator workspace */}
        <Route element={<RoleRoute allowedRoles={["coordinator"]} />}>
          <Route path="casos_academicos" element={<CoordinatorCasesPage />} />
          <Route
            path="casos_academicos/:caseId"
            element={<AcademicCaseDetailPage />}
          />
          <Route path="investigadores" element={<ResearcherAssignmentsPage />} />
          <Route path="resultados" element={<CoordinatorResultsPage />} />
        </Route>

        {/* Researcher workspace */}
        <Route element={<RoleRoute allowedRoles={["researcher"]} />}>
          <Route path="casos_asignados" element={<ResearcherCasesPage />} />
          <Route path="resultados_cargados" element={<ResearcherResultsPage />} />
        </Route>

        {/* Administration */}
        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
          <Route path="admin" element={<AdminDashboardPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
