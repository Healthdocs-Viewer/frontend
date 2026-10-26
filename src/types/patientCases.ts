import type { CaseStatus } from "./api";

export type PatientCaseFilter = "PENDING" | "IN_PROGRESS" | "RESULT_AVAILABLE";
export type PatientCaseSort = "createdAt:desc" | "createdAt:asc";
export type PatientCaseCreationStage =
  | "INFORMATION_PENDING"
  | "CONSENT_PENDING"
  | "FILE_PENDING"
  | "CONFIRMATION_PENDING";

export interface PatientCaseItem {
  id: string;
  referenceCode: string;
  studyName: string;
  status: CaseStatus;
  creationStage: PatientCaseCreationStage | null;
  createdAt: string;
  updatedAt: string;
  availableResultId: string | null;
}

export interface PatientCasesResponse {
  items: PatientCaseItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  statusCounts: Record<"ALL" | PatientCaseFilter, number>;
  appliedFilters: {
    q: string;
    status: PatientCaseFilter | "ALL" | null;
    sort: PatientCaseSort;
  };
}

export interface PatientCasesQuery {
  q?: string;
  status?: PatientCaseFilter;
  sort?: PatientCaseSort;
  page?: number;
  size?: number;
}
