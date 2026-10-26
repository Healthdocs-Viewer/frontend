import type { CaseStatus, CaseWorkflowStatus } from "./api";

export type NextStepType =
  | "ACCEPT_CONSENT" | "UPLOAD_FILE" | "VIEW_RESULT"
  | "SIGN_AUTHORIZATION" | "SCHEDULE_FOLLOW_UP" | "DOWNLOAD_REPORT";

export type ActivityType =
  | "CASE_CREATED" | "CONSENT_ACCEPTED" | "FILE_RECEIVED"
  | "CASE_PROCESSING_ENABLED" | "RESULT_PUBLISHED" | "INPUT_CHANGE_OPENED"
  | "INPUT_CHANGE_SUBMITTED" | "INPUT_CHANGE_APPROVED" | "INPUT_CHANGE_REJECTED"
  | "INPUT_CHANGE_CANCELLED";

export interface PatientDashboardResponse {
  summary: {
    activeCases: number;
    inProgressCases: number;
    availableResults: number;
    notificationsRequiringAttention?: number;
  };
  recentCases: Array<{
    id: string;
    referenceCode: string;
    studyName: string;
    status: CaseStatus | CaseWorkflowStatus;
    createdAt: string;
  }>;
  nextSteps: Array<{
    id: string;
    caseId: string;
    caseReferenceCode: string;
    type: NextStepType;
    title: string;
    description: string;
    priority: "HIGH" | "NORMAL" | "LOW";
    createdAt: string;
    action: { type: NextStepType; label: string };
  }>;
  recentActivity: Array<{
    id: string;
    type: ActivityType;
    occurredAt: string;
    caseReferenceCode: string;
  }>;
  availableResults: Array<{
    id: string;
    caseId: string;
    caseReferenceCode: string;
    studyName: string;
    availableAt: string;
  }>;
}
