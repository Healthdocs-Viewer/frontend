import type { CaseStatus } from "./api";

export type NextStepType =
  | "ACCEPT_CONSENT" | "UPLOAD_FILE" | "VIEW_RESULT"
  | "SIGN_AUTHORIZATION" | "SCHEDULE_FOLLOW_UP" | "DOWNLOAD_REPORT";

export type ActivityType =
  | "CASE_CREATED" | "CONSENT_ACCEPTED" | "FILE_UPLOADED"
  | "RESULT_PUBLISHED" | "CASE_STATUS_CHANGED" | "NOTIFICATION_SENT"
  | "DOCUMENT_RECEIVED" | "REMINDER_SENT" | "RESULT_VIEWED"
  | "PERSONAL_DATA_CONFIRMED" | "CASE_ARCHIVED" | "MEDICAL_ORDER_ADDED";

export interface PatientDashboardResponse {
  summary: {
    activeCases: number;
    inProgressCases: number;
    availableResults: number;
    notificationsRequiringAttention: number;
  };
  recentCases: Array<{
    id: string;
    referenceCode: string;
    studyName: string;
    status: CaseStatus;
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
    title: string;
    description: string;
    caseId: string;
    caseReferenceCode: string;
    occurredAt: string;
  }>;
  availableResults: Array<{
    id: string;
    caseId: string;
    caseReferenceCode: string;
    studyName: string;
    availableAt: string;
  }>;
}
