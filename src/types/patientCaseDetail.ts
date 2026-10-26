export type PatientCaseFileKind = "archive" | "dicom" | "pdf" | "image" | "file";
export type PatientCaseTimelineState = "done" | "active" | "pending";
export type PatientCaseStatus =
  | "CONSENT_PENDING"
  | "FILE_PENDING"
  | "CONFIRMATION_PENDING"
  | "FILES_RECEIVED"
  | "INPUT_CHANGE_DRAFT"
  | "INPUT_CHANGE_REVIEW"
  | "ENABLED_FOR_PROCESSING"
  | "RESULT_UPLOADED"
  | "RESULT_AVAILABLE";

export type PatientInputChangeRequestStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface PatientCaseDetailFile {
  id: string;
  name: string;
  date: string;
  sortDate: number;
  size: string;
  kind: PatientCaseFileKind;
}

export interface PatientCaseResultFile {
  id: string;
  name: string;
  label: string;
  date: string;
  size: string;
}

export interface PatientInputChangeRequestFile {
  id: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number | null;
  fileKind: "INPUT" | "RESULT";
}

/** Mirrors the backend RequestView returned by the input-change request endpoints. */
export interface PatientInputChangeRequest {
  id: string;
  caseId: string;
  requestedBy: string;
  status: PatientInputChangeRequestStatus;
  reason: string | null;
  resumeCaseStatus: "FILES_RECEIVED" | "ENABLED_FOR_PROCESSING";
  originalFiles: PatientInputChangeRequestFile[];
  proposedFiles: PatientInputChangeRequestFile[];
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionReason: string | null;
}

export interface PatientCaseDetailResponse {
  case: {
    id: string;
    referenceCode: string;
    studyName: string;
    status: PatientCaseStatus;
    createdAt: string;
    updatedAt: string;
  };
  steps: Array<{ title: string; detail: string; state: PatientCaseTimelineState }>;
  history: Array<{
    title: string;
    detail: string;
    date: string;
    state: PatientCaseTimelineState;
  }>;
  files: PatientCaseDetailFile[];
  /** Owner-visible request history; at most one request can be active per case. */
  inputChangeRequests: PatientInputChangeRequest[];
  consent: {
    status: string;
    termsVersion: string;
    acceptedAt: string;
    description: string;
  };
  result: {
    status: string;
    description: string;
    files: PatientCaseResultFile[];
  };
}
