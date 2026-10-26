import academicCasesMock from "../mocks/responses/academic-cases.json";
import coordinatorResultsMock from "../mocks/responses/coordinator-results.json";
import caseAssignmentsMock from "../mocks/responses/case-student-assignments.json";
import type {
  AcademicCaseItem,
  CoordinatorAcademicCaseDetail,
  CoordinatorAcademicCase,
  CoordinatorAcademicCaseStatus,
  CoordinatorAcademicCasesQuery,
  CoordinatorAcademicCasesResponse,
  ResearcherAcademicCaseDetail,
} from "../types/academicCases";
import type { PatientInputChangeRequest } from "../types/patientCaseDetail";
import { apiClient } from "./apiClient";

const mockItems = academicCasesMock as AcademicCaseItem[];
const mockResults = coordinatorResultsMock as unknown as { items: Array<CoordinatorAcademicCaseDetail["results"][number]> };
const mockAssignments = caseAssignmentsMock as {
  caseId: string;
  students: Array<{ userId: string; fullName: string; email: string; authorizationStatus: "AUTHORIZED" | "RESTRICTED" }>;
};

export async function getAcademicCases(): Promise<AcademicCaseItem[]> {
  const items = await apiClient.internal.listAssignedCases();
  return items.map((item) => ({
    ...item,
    status: item.status as AcademicCaseItem["status"],
    updatedAt: item.updatedAt ?? null,
    files: item.files.map((file) => ({ ...file, contentType: file.contentType ?? null })),
    result: item.result ? { ...item.result, availableAt: item.result.availableAt ?? null } : null,
  }));
}

export async function getResearcherAcademicCaseDetail(caseKey: string): Promise<ResearcherAcademicCaseDetail> {
  const key = caseKey.trim().toLocaleLowerCase();
  const cases = await apiClient.internal.listAssignedCases();
  const assignedCase = cases.find((item) =>
    item.id.toLocaleLowerCase() === key || item.referenceCode.toLocaleLowerCase() === key,
  );
  if (!assignedCase) throw new Error("No se encontró el caso entre tus casos asignados.");
  return apiClient.internal.getAssignedCaseDetail(assignedCase.id);
}

export async function getCoordinatorAcademicCases(
  query: CoordinatorAcademicCasesQuery = {},
): Promise<CoordinatorAcademicCasesResponse> {
  return apiClient.operations.getAcademicCases(query);
}

export async function getCoordinatorAcademicCaseDetail(routeCaseKey: string): Promise<CoordinatorAcademicCaseDetail> {
  const key = routeCaseKey.trim();
  let caseId = key;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(key)) {
    const response = await apiClient.operations.getAcademicCases({ q: key, page: 0, size: 100 });
    const match = response.items.find((item) => item.referenceCode.toLocaleLowerCase() === key.toLocaleLowerCase());
    if (!match) throw new Error("No se encontró el caso académico solicitado.");
    caseId = match.id;
  }
  return apiClient.operations.getAcademicCaseDetail(caseId);
}

export async function getCoordinatorInputChangeReviewForCase(
  caseId: string,
): Promise<PatientInputChangeRequest | null> {
  const pending = await apiClient.operations.listPendingInputChangeRequests();
  const request = pending.find((item) => item.caseId === caseId);
  if (!request) return null;
  return apiClient.operations.getInputChangeRequestForReview(request.id);
}

export async function getCoordinatorAcademicCaseDetailMock(caseId: string): Promise<CoordinatorAcademicCaseDetail> {
  const item = mockItems.find((candidate) => candidate.id === caseId || candidate.referenceCode === caseId);
  if (!item) throw new Error("No se encontró el caso académico solicitado.");
  const assigned = mockAssignments.caseId === item.id ? mockAssignments.students : [];
  const timestamp = item.result?.uploadedAt ?? item.createdAt;
  return {
    case: {
      id: item.id,
      referenceCode: item.referenceCode,
      status: item.status as CoordinatorAcademicCaseStatus,
      studyName: item.studyName,
      additionalReference: null,
      originInstitution: null,
      studyDate: null,
      notes: null,
      createdAt: item.createdAt,
      updatedAt: timestamp,
      availableResultId: item.result?.status === "AVAILABLE" ? item.result.id : null,
      receivedAt: item.createdAt,
    },
    inputFiles: item.files.filter((file) => file.fileKind === "INPUT").map((file) => ({
      id: file.id, originalFilename: file.originalFilename, contentType: file.contentType,
      sizeBytes: file.sizeBytes, uploadedAt: item.createdAt,
    })),
    researchers: assigned.map((student) => ({
      userId: student.userId, fullName: student.fullName, email: student.email,
      authorizationStatus: student.authorizationStatus, assignedAt: item.createdAt,
    })),
    results: mockResults.items.filter((result) => result.case.referenceCode === item.referenceCode),
    history: [
      { type: "CASE_RECEIVED", occurredAt: item.createdAt, description: "Caso recibido", relatedId: item.id, actorUserId: null },
      ...(assigned.length ? [{ type: "RESEARCHERS_ASSIGNED", occurredAt: item.createdAt, description: "Investigadores asignados", relatedId: item.id, actorUserId: null }] : []),
    ],
    canReviewResults: true,
  };
}

export async function publishCoordinatorResultMock(resultId: string): Promise<void> {
  const result = mockResults.items.find((candidate) => candidate.id === resultId);
  if (!result) throw new Error("No se encontró el resultado.");
  result.status = "AVAILABLE";
  result.publicationType = result.publicationType ?? (result.version === 1 ? "INITIAL" : "CORRECTED");
  result.availableAt = new Date().toISOString();
  const item = mockItems.find((candidate) => candidate.referenceCode === result.case.referenceCode);
  if (item) item.status = "RESULT_AVAILABLE";
}

export async function requestCoordinatorResultCorrectionMock(resultId: string, reason: string): Promise<void> {
  const result = mockResults.items.find((candidate) => candidate.id === resultId);
  if (!result) throw new Error("No se encontró el resultado.");
  if (result.status !== "AVAILABLE" && result.status !== "UPLOADED") throw new Error("El resultado no se puede devolver para corrección.");
  result.status = "CORRECTION_REQUIRED";
  result.correctionRequest = reason.trim();
  const item = mockItems.find((candidate) => candidate.referenceCode === result.case.referenceCode);
  if (item) item.status = "ENABLED_FOR_PROCESSING";
}

// Mock adapter matching GET /api/v1/operations/cases/academic.
export async function getAcademicCasesMock(
  query: CoordinatorAcademicCasesQuery = {},
): Promise<CoordinatorAcademicCasesResponse> {
  const normalize = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const sort = query.sort ?? "receivedAt,desc";
  const search = normalize(query.q ?? "");
  const matched: CoordinatorAcademicCase[] = mockItems
    .filter((item) => !query.status || item.status === query.status)
    .filter((item) => normalize(`${item.referenceCode} ${item.studyName}`).includes(search))
    .map((item) => ({
      id: item.id,
      referenceCode: item.referenceCode,
      studyName: item.studyName,
      status: item.status as CoordinatorAcademicCaseStatus,
      receivedAt: item.createdAt,
      updatedAt: item.result?.uploadedAt ?? item.createdAt,
    }))
    .sort((a, b) => {
      if (sort.startsWith("referenceCode")) return a.referenceCode.localeCompare(b.referenceCode) * (sort.endsWith("desc") ? -1 : 1);
      if (sort.startsWith("status")) return a.status.localeCompare(b.status) * (sort.endsWith("desc") ? -1 : 1);
      const order = (a.receivedAt ?? "").localeCompare(b.receivedAt ?? "");
      return order * (sort.endsWith("asc") ? 1 : -1);
    });
  const page = query.page ?? 0;
  const size = query.size ?? 8;
  return {
    items: matched.slice(page * size, (page + 1) * size),
    page,
    size,
    totalItems: matched.length,
    totalPages: Math.ceil(matched.length / size),
    appliedFilters: { q: query.q ?? "", sort },
  };
}
