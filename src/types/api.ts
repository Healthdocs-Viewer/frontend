/**
 * Tipos basados estrictamente en el contrato OpenAPI 0.3.0 (openapi.yaml)
 */

export type UserRole = 'paciente' | 'estudiante' | 'profesor';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  enabled: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export type CaseStatus =
  | 'CREATED'
  | 'FILES_RECEIVED'
  | 'ENABLED_FOR_PROCESSING'
  | 'RESULT_UPLOADED'
  | 'RESULT_AVAILABLE';

export interface CaseSummary {
  id: string;
  referenceCode: string;
  status: CaseStatus;
  studyType: string;
  createdAt: string;
}

export interface CreateCaseRequest {
  studyType: string;
}

export interface AcceptConsentRequest {
  termsVersion: string;
  acceptedAt?: string;
}

export interface ConsentRecord {
  id: string;
  caseId: string;
  termsVersion: string;
  acceptedAt: string;
}

export interface FileSummary {
  id: string;
  originalFilename: string;
  contentType?: string;
  sizeBytes: number;
  fileKind: 'INPUT' | 'RESULT';
}

export interface InternalCaseSummary extends CaseSummary {
  files: FileSummary[];
  result?: ResultSummary;
}

export interface ResultSummary {
  id: string;
  originalFilename: string;
  status: 'UPLOADED' | 'AVAILABLE';
  uploadedBy?: string;
  uploadedAt?: string;
  availableAt?: string;
}

export interface CreateUploadIntentRequest {
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
}

export interface UploadIntent {
  file: FileSummary;
  uploadUrl: string;
  expiresAt: string;
}

export interface DownloadIntent {
  downloadUrl: string;
  expiresAt: string;
}

export interface CompleteUploadResponse {
  file: FileSummary;
  result?: {
    id: string;
    caseId: string;
    status: 'UPLOADED' | 'AVAILABLE';
    uploadedBy: string;
    uploadedAt: string;
  };
  caseStatus: CaseStatus;
}

export interface PatientResult {
  id: string;
  caseId: string;
  availableAt: string;
  download: DownloadIntent;
}

export interface ErrorResponse {
  code: string;
  message: string;
  traceId: string;
}

export interface AssignCaseRequest {
  userId: string;
}
