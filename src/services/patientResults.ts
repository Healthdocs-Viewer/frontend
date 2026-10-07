import resultsMock from "../mocks/responses/patient-results.json";
import type { PatientResultsQuery, PatientResultsResponse } from "../types/patientResults";

const mockResponse = resultsMock as PatientResultsResponse;

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

// Future endpoint: GET /api/v1/patient/results?q=&sort=
export async function getPatientResults(query: PatientResultsQuery = {}): Promise<PatientResultsResponse> {
  const q = normalize(query.q?.trim() ?? "");
  const items = mockResponse.items
    .filter((item) => normalize(`${item.caseReferenceCode} ${item.studyName} ${item.fileName}`).includes(q))
    .sort((a, b) => query.sort === "availableAt,asc"
      ? a.availableAt.localeCompare(b.availableAt)
      : b.availableAt.localeCompare(a.availableAt));

  return {
    summary: mockResponse.summary,
    items,
    totalItems: items.length,
  };
}
