import dashboardMock from "../mocks/responses/patient-dashboard.json";
import type { PatientDashboardResponse } from "../types/patientDashboard";

// Future source: GET /api/v1/patient/dashboard (pending backend contract).
export async function getPatientDashboard(): Promise<PatientDashboardResponse> {
  return dashboardMock as PatientDashboardResponse;
}
