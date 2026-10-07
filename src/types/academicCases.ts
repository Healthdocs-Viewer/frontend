export type AcademicCaseStatus =
  | "ENABLED_FOR_PROCESSING"
  | "RESULT_UPLOADED"
  | "RESULT_AVAILABLE";

export interface AcademicCaseFile {
  id: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  fileKind: "INPUT" | "RESULT";
}

export interface AcademicCaseResult {
  id: string;
  originalFilename: string;
  status: "UPLOADED" | "AVAILABLE";
  uploadedBy: string;
  uploadedAt: string;
  availableAt: string | null;
}

export interface AcademicCaseItem {
  id: string;
  referenceCode: string;
  studyName: string;
  status: AcademicCaseStatus;
  createdAt: string;
  files: AcademicCaseFile[];
  result: AcademicCaseResult | null;
}

export type AcademicCasesResponse = AcademicCaseItem[];
