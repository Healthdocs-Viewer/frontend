import coordinatorResultsMock from "../mocks/responses/coordinator-results.json";
import type { CoordinatorResultsResponse } from "../types/coordinatorResults";
import { apiClient, isMockMode } from "./apiClient";

const mockResponse = coordinatorResultsMock as CoordinatorResultsResponse;

export async function getCoordinatorResultsMock(): Promise<CoordinatorResultsResponse> {
  return mockResponse;
}

export async function getCoordinatorResults(): Promise<CoordinatorResultsResponse> {
  if (isMockMode()) return mockResponse;

  const firstPage = await apiClient.operations.listCoordinatorResults(0, 100);
  if (firstPage.totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      apiClient.operations.listCoordinatorResults(index + 1, 100),
    ),
  );
  return {
    ...firstPage,
    items: [...firstPage.items, ...remainingPages.flatMap((page) => page.items)],
  };
}
