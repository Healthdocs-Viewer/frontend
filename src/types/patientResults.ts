export type PatientResultPublicationType = "INITIAL" | "CORRECTED";
export type PatientResultsSort = "availableAt,desc" | "availableAt,asc";

export interface PatientResultItem {
  resultId: string;
  caseId: string;
  caseReferenceCode: string;
  studyName: string;
  fileName: string;
  contentType: string;
  availableAt: string;
  publicationType: PatientResultPublicationType;
}

export interface PatientResultsResponse {
  summary: {
    availableCaseCount: number;
    latestPublishedAt: string;
  };
  items: PatientResultItem[];
  totalItems: number;
}

export interface PatientResultsQuery {
  q?: string;
  sort?: PatientResultsSort;
}
