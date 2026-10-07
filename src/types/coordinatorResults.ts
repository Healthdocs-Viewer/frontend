export type CoordinatorResultStatus =
  | "UPLOADED"
  | "CORRECTION_REQUIRED"
  | "AVAILABLE"
  | "DELETED";

export type CoordinatorResultSortField =
  | "name"
  | "referenceCode"
  | "studentName"
  | "uploadedAt"
  | "version"
  | "status"
  | "updatedAt";

export type CoordinatorResultSort =
  | `${CoordinatorResultSortField},asc`
  | `${CoordinatorResultSortField},desc`;

export interface CoordinatorResultItem {
  id: string;
  name: string;
  file: {
    id: string;
    originalFilename: string;
    contentType: string;
    sizeBytes: number;
    extension?: string;
  };
  case: {
    id: string;
    referenceCode: string;
    studyName: string;
  };
  uploadedBy: {
    userId: string;
    studentCode: string;
    fullName: string;
  };
  uploadedAt: string;
  updatedAt: string;
  version: number;
  status: CoordinatorResultStatus;
  correctionRequest: unknown;
  availableAt: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  deletionReason: string | null;
}

export interface CoordinatorResultsResponse {
  items: CoordinatorResultItem[];
  summary: {
    total: number;
    uploaded: number;
    correctionRequired: number;
    available: number;
    deleted: number;
  };
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  appliedFilters: {
    q: string;
    status: CoordinatorResultStatus | null;
    sort: CoordinatorResultSort;
  };
}
