import coordinatorResultsMock from "../mocks/responses/coordinator-results.json";
import type { CoordinatorResultsResponse } from "../types/coordinatorResults";

const mockResponse = coordinatorResultsMock as CoordinatorResultsResponse;

// Future endpoint: GET /api/v1/operations/results?q=&status=&sort=uploadedAt,desc&page=0&size=8
export async function getCoordinatorResults(): Promise<CoordinatorResultsResponse> {
  return mockResponse;
}
