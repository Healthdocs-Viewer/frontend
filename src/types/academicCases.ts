export type AcademicCaseStatus =
  | "FILES_RECEIVED"
  | "INPUT_CHANGE_DRAFT"
  | "INPUT_CHANGE_REVIEW"
  | "ENABLED_FOR_PROCESSING"
  | "RESULT_UPLOADED"
  | "RESULT_AVAILABLE";

export type CoordinatorAcademicCaseStatus =
  | "FILES_RECEIVED"
  | "ENABLED_FOR_PROCESSING"
  | "INPUT_CHANGE_DRAFT"
  | "INPUT_CHANGE_REVIEW"
  | "RESULT_UPLOADED"
  | "RESULT_AVAILABLE";

export type CoordinatorCaseSort = "receivedAt,desc" | "receivedAt,asc" | "referenceCode,asc" | "referenceCode,desc" | "status,asc" | "status,desc";

export interface CoordinatorAcademicCase {
  id: string;
  referenceCode: string;
  studyName: string;
  status: CoordinatorAcademicCaseStatus;
  receivedAt: string | null;
  updatedAt: string | null;
}

export interface CoordinatorAcademicCasesResponse {
  items: CoordinatorAcademicCase[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  appliedFilters: { q: string; sort: CoordinatorCaseSort };
}

export interface CoordinatorAcademicCasesQuery {
  q?: string;
  status?: CoordinatorAcademicCaseStatus;
  sort?: CoordinatorCaseSort;
  page?: number;
  size?: number;
}

export interface CoordinatorInputChangeRequestSummary {
  id: string;
  caseId: string;
  requestedBy: string;
  caseReferenceCode: string;
  studyName: string;
  reason: string | null;
  fileCount: number;
  createdAt: string | null;
  submittedAt: string | null;
}

export type CoordinatorResultStatus = "UPLOADED" | "AVAILABLE" | "CORRECTION_REQUIRED" | "DELETED";

export interface CoordinatorAcademicCaseDetail {
  case: {
    id: string;
    referenceCode: string;
    status: CoordinatorAcademicCaseStatus;
    studyName: string;
    additionalReference: string | null;
    originInstitution: string | null;
    studyDate: string | null;
    notes: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    availableResultId: string | null;
    receivedAt: string | null;
  };
  inputFiles: Array<{
    id: string;
    originalFilename: string;
    contentType: string | null;
    sizeBytes: number;
    uploadedAt: string | null;
  }>;
  researchers: Array<{
    userId: string;
    fullName: string | null;
    email: string;
    authorizationStatus: "AUTHORIZED" | "RESTRICTED";
    assignedAt: string | null;
  }>;
  results: Array<{
    id: string;
    file: { id: string; originalFilename: string; contentType: string | null; sizeBytes: number; extension: string | null };
    case: { id: string; referenceCode: string; studyName: string };
    uploadedBy: { userId: string; studentCode: string; fullName: string } | null;
    uploadedAt: string | null;
    updatedAt: string | null;
    version: number;
    status: CoordinatorResultStatus;
    correctionRequest: string | null;
    publicationType: string | null;
    availableAt: string | null;
    deletedAt: string | null;
    deletionReason: string | null;
  }>;
  history: Array<{
    type: string;
    occurredAt: string | null;
    description: string;
    relatedId: string | null;
    actorUserId: string | null;
  }>;
  canReviewResults: boolean;
}

export interface AcademicCaseFile {
  id: string;
  originalFilename: string;
  contentType: string | null;
  sizeBytes: number;
  fileKind: "INPUT" | "RESULT";
}

export interface AcademicCaseResult {
  id: string;
  originalFilename: string;
  status: "UPLOADED" | "AVAILABLE" | "CORRECTION_REQUIRED" | "DELETED";
  uploadedBy?: string;
  uploadedAt?: string;
  availableAt: string | null;
}

export interface AcademicCaseItem {
  id: string;
  referenceCode: string;
  studyName: string;
  status: AcademicCaseStatus;
  createdAt: string;
  updatedAt: string | null;
  files: AcademicCaseFile[];
  result: AcademicCaseResult | null;
}

export interface ResearcherAcademicCaseDetail {
  case: {
    id: string;
    referenceCode: string;
    status: AcademicCaseStatus;
    studyName: string;
    additionalReference: string | null;
    originInstitution: string | null;
    studyDate: string | null;
    notes: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    receivedAt: string | null;
    availableResultId: string | null;
  };
  inputFiles: Array<{
    id: string;
    originalFilename: string;
    contentType: string | null;
    sizeBytes: number | null;
    uploadedAt: string | null;
  }>;
  researchers?: Array<{
    userId: string;
    fullName: string | null;
    researcherCode: string | null;
    authorizationStatus: "AUTHORIZED" | "RESTRICTED" | null;
    assignedAt: string | null;
  }>;
  results: Array<{
    id: string;
    originalFilename: string;
    contentType: string | null;
    sizeBytes: number | null;
    uploadedAt: string | null;
    updatedAt: string | null;
    version: number | null;
    status: "UPLOADED" | "AVAILABLE" | "CORRECTION_REQUIRED";
    correctionRequest: string | null;
    publicationType: string | null;
    availableAt: string | null;
  }>;
}

export type AcademicCasesResponse = AcademicCaseItem[];
