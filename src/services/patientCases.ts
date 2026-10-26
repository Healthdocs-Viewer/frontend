import { apiClient } from "./apiClient";
import type {
  PatientCasesQuery,
  PatientCasesResponse,
} from "../types/patientCases";

export async function getPatientCases(
  query: PatientCasesQuery = {},
): Promise<PatientCasesResponse> {
  return apiClient.patient.getCases(query);
}
