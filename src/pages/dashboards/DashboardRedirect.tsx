import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {CoordinatorDashboardPage} from "../coordinator/CoordinatorDashboardPage";
import { ResearcherDashboardPage } from "../researcher/ResearcherDashboardPage";
import { PatientDashboardPage } from "../patient/PatientDashboardPage";
import { AdminDashboardPage } from "../admin/AdminDashboardPage";

export const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "coordinator":
      return <CoordinatorDashboardPage />;

    case "researcher":
      return <ResearcherDashboardPage />;

    case "patient":
      return <PatientDashboardPage />;

    case "admin":
      return <AdminDashboardPage />;

    default:
      return <Navigate to="/login" replace />;
  }
};
