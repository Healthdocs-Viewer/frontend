import { apiClient } from "./apiClient";
import type { PatientDashboardResponse } from "../types/patientDashboard";

export async function getPatientDashboard(): Promise<PatientDashboardResponse> {
  // Dashboard and recentActivity come from the authenticated backend endpoint.
  return apiClient.patient.getDashboard();
}
