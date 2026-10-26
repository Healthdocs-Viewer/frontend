export type CoordinatorResultStatus =
  | "UPLOADED"
  | "CORRECTION_REQUIRED"
  | "AVAILABLE";

export type CoordinatorResultSortField =
  | "originalFilename"
  | "referenceCode"
  | "researcherName"
  | "uploadedAt"
  | "version"
  | "status"
  | "updatedAt";

export type CoordinatorResultSort =
  | `${CoordinatorResultSortField},asc`
  | `${CoordinatorResultSortField},desc`;

export interface CoordinatorResultItem {
  id: string;
  file: {
    id: string;
    originalFilename: string;
    contentType: string | null;
    sizeBytes: number | null;
    extension: string | null;
  };
  case: {
    id: string;
    referenceCode: string;
    studyName: string;
  };
  uploadedBy: {
    userId: string;
    studentCode: string | null;
    fullName: string | null;
  } | null;
  uploadedAt: string | null;
  updatedAt: string | null;
  version: number;
  status: CoordinatorResultStatus;
  correctionRequest: string | null;
  publicationType: "INITIAL" | "CORRECTED" | null;
  availableAt: string | null;
}

export interface CoordinatorResultsResponse {
  items: CoordinatorResultItem[];
  summary: {
    total: number;
    uploaded: number;
    correctionRequired: number;
    available: number;
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
