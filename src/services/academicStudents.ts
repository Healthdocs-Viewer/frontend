import studentsMock from "../mocks/responses/academic-students.json";
import studentCasesMock from "../mocks/responses/academic-student-cases.json";
import academicCasesMock from "../mocks/responses/academic-cases.json";
import caseStudentAssignmentsMock from "../mocks/responses/case-student-assignments.json";
import type {
  AcademicStudent,
  AcademicStudentCasesResponse,
  AcademicStudentsResponse,
  CaseStudentAssignmentsResponse,
  SaveCaseStudentAssignmentsRequest,
  SaveStudentAssignmentsRequest,
} from "../types/academicStudents";
import type { AcademicCasesResponse } from "../types/academicCases";
import { apiClient, isMockMode } from "./apiClient";

const studentResponse = studentsMock as AcademicStudentsResponse;
const caseResponse = studentCasesMock as AcademicStudentCasesResponse;
const academicCases = academicCasesMock as AcademicCasesResponse;
const caseAssignmentsSeed = caseStudentAssignmentsMock as CaseStudentAssignmentsResponse;
let students = studentResponse.items.map((student) => ({ ...student }));
let assignmentIdsByStudent = Object.fromEntries(
  students.map((student) => [
    student.userId,
    caseResponse.items.slice(0, student.assignedCaseCount).map((item) => item.id),
  ]),
) as Record<string, string[]>;

function getAcademicCaseForStudentCase(studentCaseId: string) {
  const studentCase = caseResponse.items.find((item) => item.id === studentCaseId);
  return studentCase && academicCases.find((item) => item.referenceCode === studentCase.referenceCode);
}

function getStudentCaseForAcademicCase(caseId: string) {
  const academicCase = academicCases.find((item) => item.id === caseId);
  return academicCase && caseResponse.items.find((item) => item.referenceCode === academicCase.referenceCode);
}

const researcherIdsByCase = Object.fromEntries(academicCases.map((item) => [item.id, [] as string[]])) as Record<string, string[]>;
for (const student of students) {
  for (const studentCaseId of assignmentIdsByStudent[student.userId] ?? []) {
    const academicCase = getAcademicCaseForStudentCase(studentCaseId);
    if (academicCase) researcherIdsByCase[academicCase.id].push(student.userId);
  }
}

const seededCaseIds = new Set(caseAssignmentsSeed.researcherIds);
const seededPreviousIds = new Set(researcherIdsByCase[caseAssignmentsSeed.caseId] ?? []);
const seededCase = getStudentCaseForAcademicCase(caseAssignmentsSeed.caseId);
for (const student of students) {
  const wasAssigned = seededPreviousIds.has(student.userId);
  const willBeAssigned = seededCaseIds.has(student.userId);
  if (wasAssigned === willBeAssigned) continue;
  student.assignedCaseCount += willBeAssigned ? 1 : -1;
  if (seededCase) {
    const existing = assignmentIdsByStudent[student.userId] ?? [];
    assignmentIdsByStudent[student.userId] = willBeAssigned
      ? [...new Set([...existing, seededCase.id])]
      : existing.filter((id) => id !== seededCase.id);
  }
}
researcherIdsByCase[caseAssignmentsSeed.caseId] = [...caseAssignmentsSeed.researcherIds];
studentResponse.summary.totalAssignedCases += caseAssignmentsSeed.researcherIds.length - seededPreviousIds.size;

function assignedStudentsForCase(caseId: string): string[] {
  return [...(researcherIdsByCase[caseId] ?? [])];
}

// Future endpoint: GET /api/v1/operations/students?q=&status=&sort=&page=&size=
export async function getAcademicStudents(query = "", page = 0, requestedSize = 100): Promise<AcademicStudentsResponse> {
  if (!isMockMode()) {
    const response = await apiClient.operations.searchResearchers(query, "AUTHORIZED", page, requestedSize);
    return {
      summary: {
        totalStudents: response.summary.totalResearchers,
        authorizedStudents: response.summary.authorizedResearchers,
        totalAssignedCases: response.summary.totalAssignedCases,
      },
      items: response.items.map((researcher) => ({
        userId: researcher.userId,
        studentCode: researcher.researcherCode,
        fullName: researcher.fullName,
        email: researcher.email,
        authorizationStatus: researcher.authorizationStatus,
        assignedCaseCount: researcher.assignedCaseCount,
      })),
      page: response.page,
      size: response.size,
      totalItems: response.totalItems,
      totalPages: response.totalPages,
      appliedFilters: { q: response.appliedFilters.q, status: "AUTHORIZED", sort: "name,asc" },
    };
  }
  const normalizedQuery = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const orderedStudents = students.filter((student) =>
    `${student.fullName} ${student.email} ${student.studentCode}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").includes(normalizedQuery),
  ).sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" }),
  );
  const size = Math.min(100, Math.max(1, requestedSize));
  return {
    ...studentResponse,
    summary: { ...studentResponse.summary },
    items: orderedStudents.slice(page * size, (page + 1) * size).map((student) => ({ ...student })),
    page,
    size,
    totalItems: orderedStudents.length,
    totalPages: Math.max(1, Math.ceil(orderedStudents.length / size)),
    appliedFilters: { ...studentResponse.appliedFilters, q: query },
  };
}

// Future endpoint: GET /api/v1/operations/cases/{caseId}/assignments
export async function getStudentAssignmentsForCase(caseId: string): Promise<CaseStudentAssignmentsResponse> {
  if (!isMockMode()) {
    const assignment = await apiClient.operations.getCaseAssignments(caseId);
    return {
      caseId: assignment.caseId,
      researcherIds: assignment.researcherIds,
      students: assignment.researchers.map((researcher) => ({
        userId: researcher.userId,
        studentCode: researcher.researcherCode,
        fullName: researcher.fullName,
        email: researcher.email,
        authorizationStatus: researcher.authorizationStatus,
        assignedCaseCount: researcher.assignedCaseCount,
      })),
    };
  }
  if (!academicCases.some((item) => item.id === caseId)) throw new Error("El caso no existe.");
  return {
    caseId,
    researcherIds: assignedStudentsForCase(caseId),
    students: students.filter((student) => assignedStudentsForCase(caseId).includes(student.userId)).map((student) => ({ ...student })),
  };
}

// Future endpoint: PUT /api/v1/operations/cases/{caseId}/assignments
export async function saveStudentAssignmentsForCase(
  caseId: string,
  request: SaveCaseStudentAssignmentsRequest,
): Promise<CaseStudentAssignmentsResponse> {
  if (!isMockMode()) {
    const assignment = await apiClient.operations.replaceCaseAssignments(caseId, request.researcherIds);
    return {
      caseId: assignment.caseId,
      researcherIds: assignment.researcherIds,
      students: assignment.researchers.map((researcher) => ({
        userId: researcher.userId,
        studentCode: researcher.researcherCode,
        fullName: researcher.fullName,
        email: researcher.email,
        authorizationStatus: researcher.authorizationStatus,
        assignedCaseCount: researcher.assignedCaseCount,
      })),
    };
  }
  const current = await getStudentAssignmentsForCase(caseId);
  const requestedIds = [...new Set(request.researcherIds)];
  const validStudents = new Set(students.map((student) => student.userId));
  if (requestedIds.some((id) => !validStudents.has(id))) throw new Error("La selección contiene investigadores no válidos.");
  const currentIds = new Set(current.researcherIds);
  const newUnauthorized = requestedIds.some((id) => !currentIds.has(id) && students.find((student) => student.userId === id)?.authorizationStatus !== "AUTHORIZED");
  if (newUnauthorized) throw new Error("Solo se puede dar acceso a investigadores autorizados.");

  const requestedSet = new Set(requestedIds);
  researcherIdsByCase[caseId] = requestedIds;
  for (const student of students) {
    const wasAssigned = currentIds.has(student.userId);
    const willBeAssigned = requestedSet.has(student.userId);
    if (wasAssigned === willBeAssigned) continue;
    student.assignedCaseCount += willBeAssigned ? 1 : -1;
    const existing = assignmentIdsByStudent[student.userId] ?? [];
    const studentCase = getStudentCaseForAcademicCase(caseId);
    if (studentCase) {
      assignmentIdsByStudent[student.userId] = willBeAssigned
        ? [...new Set([...existing, studentCase.id])]
        : existing.filter((id) => id !== studentCase.id);
    }
  }

  studentResponse.summary.totalAssignedCases += requestedIds.length - current.researcherIds.length;
  const academicCase = academicCases.find((item) => item.id === caseId);
  if (academicCase?.status === "FILES_RECEIVED" && requestedIds.length > 0) {
    academicCase.status = "ENABLED_FOR_PROCESSING";
  } else if (academicCase?.status === "ENABLED_FOR_PROCESSING" && requestedIds.length === 0) {
    academicCase.status = "FILES_RECEIVED";
  }
  return {
    caseId,
    researcherIds: requestedIds,
    students: students.filter((student) => requestedSet.has(student.userId)).map((student) => ({ ...student })),
  };
}

// Future endpoint: GET /api/v1/operations/students/{studentId}/cases?q=&sort=&page=&size=
export async function getCasesForStudent(
  studentId: string,
): Promise<AcademicStudentCasesResponse> {
  const assignedIds = new Set(assignmentIdsByStudent[studentId] ?? []);
  const items = caseResponse.items.map((item) => ({
    ...item,
    isAssigned: assignedIds.has(item.id),
  }));
  return {
    ...caseResponse,
    items,
    appliedFilters: { ...caseResponse.appliedFilters },
  };
}

// Future endpoint: PUT /api/v1/operations/students/{studentId}/case-assignments
export async function saveCasesForStudent(
  studentId: string,
  request: SaveStudentAssignmentsRequest,
): Promise<void> {
  const validCaseIds = new Set(caseResponse.items.map((item) => item.id));
  const nextIds = [...new Set(request.caseIds)].filter((id) => validCaseIds.has(id));
  const nextIdSet = new Set(nextIds);
  const previousIds = new Set(assignmentIdsByStudent[studentId] ?? []);
  for (const academicCase of academicCases) {
    const studentCase = getStudentCaseForAcademicCase(academicCase.id);
    if (!studentCase) continue;
    const wasAssigned = previousIds.has(studentCase.id);
    const willBeAssigned = nextIdSet.has(studentCase.id);
    if (wasAssigned === willBeAssigned) continue;
    const currentStudents = new Set(researcherIdsByCase[academicCase.id] ?? []);
    if (willBeAssigned) currentStudents.add(studentId);
    else currentStudents.delete(studentId);
    researcherIdsByCase[academicCase.id] = [...currentStudents];
  }
  assignmentIdsByStudent = { ...assignmentIdsByStudent, [studentId]: nextIds };
  students = students.map((student): AcademicStudent =>
    student.userId === studentId
      ? { ...student, assignedCaseCount: nextIds.length }
      : student,
  );
  studentResponse.summary.totalAssignedCases = students.reduce(
    (total, student) => total + student.assignedCaseCount,
    0,
  );
}
