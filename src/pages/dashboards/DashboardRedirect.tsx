import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import { CoordinatorDashboardPage } from "./CoordinatorDashboardPage";
import { StudentDashboardPage } from "./StudentDashboardPage";
import { PatientDashboardPage } from "./PatientDashboardPage";

export const DashboardRedirect: React.FC = () => {
  // const { user } = useAuth();

  // if (!user) return <Navigate to="/login" replace />;

  const user = { role: "paciente" }; // Simulación de usuario para pruebas
  switch (user.role) {
    case "profesor":
      return <CoordinatorDashboardPage />;

    case "estudiante":
      return <StudentDashboardPage />;

    case "paciente":
      return <PatientDashboardPage />;

    default:
      return <Navigate to="/login" replace />;
  }
};
