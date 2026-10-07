import casesMock from "../mocks/responses/patient-cases.json";
import type {
  PatientCaseFilter,
  PatientCaseItem,
  PatientCasesQuery,
  PatientCasesResponse,
} from "../types/patientCases";

const mockResponse = casesMock as PatientCasesResponse;

function matchesStatus(item: PatientCaseItem, status: PatientCaseFilter): boolean {
  switch (status) {
    case "PENDING":
      return item.creationStage !== null;
    case "IN_PROGRESS":
      return ["FILES_RECEIVED", "ENABLED_FOR_PROCESSING", "RESULT_UPLOADED"].includes(item.status);
    case "RESULT_AVAILABLE":
      return item.status === "RESULT_AVAILABLE" && item.availableResultId !== null;
    case "COMPLETED":
      // The contract has no domain status or mapping for this filter yet.
      return false;
  }
}

// Future endpoint: GET /api/v1/cases?q=&status=&sort=&page=&size=
export async function getPatientCases(query: PatientCasesQuery = {}): Promise<PatientCasesResponse> {
  const q = query.q?.trim() ?? "";
  const normalizeSearch = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const normalizedQuery = normalizeSearch(q);
  const status = query.status ?? null;
  const sort = query.sort ?? "createdAt,desc";
  const page = query.page ?? 0;
  const size = Math.min(query.size ?? 10, 10);

  // Simulate server-side query behavior using the single documented response fixture.
  const searched = mockResponse.items.filter((item) =>
    normalizeSearch(`${item.referenceCode} ${item.studyName}`).includes(normalizedQuery),
  );
  const statusCounts: PatientCasesResponse["statusCounts"] = {
    ALL: searched.length,
    PENDING: searched.filter((item) => matchesStatus(item, "PENDING")).length,
    IN_PROGRESS: searched.filter((item) => matchesStatus(item, "IN_PROGRESS")).length,
    RESULT_AVAILABLE: searched.filter((item) => matchesStatus(item, "RESULT_AVAILABLE")).length,
    COMPLETED: searched.filter((item) => matchesStatus(item, "COMPLETED")).length,
  };
  const filtered = status ? searched.filter((item) => matchesStatus(item, status)) : searched;
  const ordered = [...filtered].sort((a, b) =>
    sort === "createdAt,asc"
      ? a.createdAt.localeCompare(b.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
  );

  return {
    items: ordered.slice(page * size, (page + 1) * size),
    page,
    size,
    totalItems: ordered.length,
    totalPages: Math.ceil(ordered.length / size),
    statusCounts,
    appliedFilters: { q, status, sort },
  };
}
