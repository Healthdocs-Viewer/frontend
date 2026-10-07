import researcherResultsMock from "../mocks/responses/researcher-results.json";
import type { ResearcherResultsResponse } from "../types/researcherResults";

const mockResponse = researcherResultsMock as ResearcherResultsResponse;

// Future endpoint: GET /api/v1/internal/results?q=&status=&sort=uploadedAt,desc&page=0&size=8
export async function getResearcherResults(): Promise<ResearcherResultsResponse> {
  return mockResponse;
}
