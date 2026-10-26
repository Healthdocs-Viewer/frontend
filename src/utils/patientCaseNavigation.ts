import type { CaseStatus, CaseWorkflowStatus } from "../types/api";
import type { PatientCaseCreationStage } from "../types/patientCases";

const INCOMPLETE_CASE_STATUSES = new Set<CaseStatus | CaseWorkflowStatus>([
  "INFORMATION_PENDING",
  "CREATED",
  "CONSENT_PENDING",
  "FILE_PENDING",
  "CONFIRMATION_PENDING",
]);

export function getPatientCasePath(
  caseId: string,
  referenceCode: string,
  status: CaseStatus | CaseWorkflowStatus,
  creationStage?: PatientCaseCreationStage | null,
): string {
  if (creationStage || INCOMPLETE_CASE_STATUSES.has(status)) {
    return `/mis_casos/${caseId}/edit`;
  }
  return `/mis_casos/${referenceCode}`;
}
