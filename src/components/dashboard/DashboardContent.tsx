import React from "react";
import { DashboardCasesContent } from "./DashboardCasesContent";
import { DashboardResultsContent } from "./DashboardResultsContent";
import { DashboardNotificationsContent } from "./DashboardNotificationsContent";
import { DashboardSettingsContent } from "./DashboardSettingsContent";

type DashboardContentProps = {
  home: React.ReactNode;
  path: string;
};

export const DashboardContent: React.FC<DashboardContentProps> = ({
  home,
  path,
}) => {
  const renderContent = () => {
    switch (path) {
      case "/mis-casos":
      case "/dashboard/mis-casos":
        return <DashboardCasesContent />;
      case "/resultados":
      case "/dashboard/resultados":
        return <DashboardResultsContent />;
      case "/notificaciones":
        return <DashboardNotificationsContent />;
      case "/configuracion":
      case "/dashboard/configuracion":
        return <DashboardSettingsContent />;
      case "/dashboard/crea-caso":
        return <DashboardSettingsContent />;
      default:
        return home;
    }
  };

  return <div className="space-y-6 p-5 lg:p-8">{renderContent()}</div>;
};
