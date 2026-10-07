export type ResearcherResultStatus =
  | "UPLOADED"
  | "AVAILABLE"
  | "CORRECTION_REQUIRED"
  | "DELETED";

export type ResearcherResultSortField =
  | "originalFilename"
  | "referenceCode"
  | "uploadedAt"
  | "status"
  | "updatedAt";

export type ResearcherResultSort =
  | `${ResearcherResultSortField},asc`
  | `${ResearcherResultSortField},desc`;

export interface ResearcherResultItem {
  id: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  case: {
    id: string;
    referenceCode: string;
    studyName: string;
  };
  status: ResearcherResultStatus;
  uploadedAt: string;
  updatedAt: string;
  availableAt: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  deletionReason: string | null;
}

export interface ResearcherResultsResponse {
  items: ResearcherResultItem[];
  summary: {
    total: number;
    uploaded: number;
    available: number;
    correctionRequired: number;
    deleted: number;
  };
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  appliedFilters: {
    q: string;
    status: ResearcherResultStatus | null;
    sort: ResearcherResultSort;
  };
}
