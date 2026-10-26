import researcherResultsMock from "../mocks/responses/researcher-results.json";
import type { ResearcherResultsResponse } from "../types/researcherResults";
import { apiClient, isMockMode } from "./apiClient";

const mockResponse = researcherResultsMock as ResearcherResultsResponse;

export async function getResearcherResults(): Promise<ResearcherResultsResponse> {
  if (isMockMode()) return mockResponse;

  const firstPage = await apiClient.internal.listResults(0, 100);
  if (firstPage.totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      apiClient.internal.listResults(index + 1, 100),
    ),
  );
  return { ...firstPage, items: [...firstPage.items, ...remainingPages.flatMap((page) => page.items)] };
}
