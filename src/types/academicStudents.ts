import type { CaseStatus } from "./api";

export type StudentAuthorizationStatus = "AUTHORIZED" | "PENDING" | "RESTRICTED";
export type StudentSortField = "name" | "studentCode" | "email" | "authorizationStatus" | "assignedCaseCount";
export type StudentSort = `${StudentSortField},asc` | `${StudentSortField},desc`;

export interface AcademicStudent {
  userId: string;
  studentCode: string;
  fullName: string;
  email: string;
  authorizationStatus: StudentAuthorizationStatus;
  assignedCaseCount: number;
}

export interface AcademicStudentsResponse {
  summary: {
    totalStudents: number;
    authorizedStudents: number;
    totalAssignedCases: number;
  };
  items: AcademicStudent[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  appliedFilters: {
    q: string;
    status: StudentAuthorizationStatus | null;
    sort: StudentSort;
  };
}

export interface AcademicStudentCase {
  id: string;
  referenceCode: string;
  studyName: string;
  status: CaseStatus;
  receivedAt: string;
  isAssigned: boolean;
}

export interface AcademicStudentCasesResponse {
  items: AcademicStudentCase[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  appliedFilters: {
    q: string;
    sort: "receivedAt,desc" | "receivedAt,asc";
  };
}

export interface SaveStudentAssignmentsRequest {
  caseIds: string[];
}

export interface CaseStudentAssignmentsResponse {
  caseId: string;
  students: AcademicStudent[];
  studentIds: string[];
  assignmentVersion: number;
}

export interface SaveCaseStudentAssignmentsRequest {
  studentIds: string[];
  expectedVersion: number;
}
