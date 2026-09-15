/**
 * Tipos basados estrictamente en el contrato OpenAPI 0.2.1 (openapi.yaml)
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
  status: CaseStatus;
  createdAt: string;
}

export interface FileSummary {
  id: string;
  originalFilename: string;
  contentType?: string;
  sizeBytes?: number;
  fileKind: 'INPUT' | 'RESULT';
}

export interface InternalCaseSummary extends CaseSummary {
  files: FileSummary[];
}

export interface CreateUploadIntentRequest {
  originalFilename: string;
  contentType: string;
  sizeBytes?: number;
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
