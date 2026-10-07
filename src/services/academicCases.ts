import academicCasesMock from "../mocks/responses/academic-cases.json";
import type { AcademicCasesResponse } from "../types/academicCases";

const mockResponse = academicCasesMock as AcademicCasesResponse;

// Current documented endpoint for assigned internal cases:
// GET /api/v1/internal/cases
// Replace the mock source here when the academic-coordinator listing contract is defined.
export async function getAcademicCases(): Promise<AcademicCasesResponse> {
  return mockResponse;
}
