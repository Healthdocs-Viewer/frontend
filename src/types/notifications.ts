export type NotificationCategory = "CASES" | "RESULTS" | "SYSTEM";

export type NotificationType =
  | "CASE_CREATED"
  | "CASE_STATUS_CHANGED"
  | "FILE_RECEIVED"
  | "FILE_REQUIRED"
  | "RESULT_AVAILABLE"
  | "RESULT_CORRECTION_REQUIRED"
  | "RESULT_CORRECTED"
  | "RESULT_VIEWED"
  | "WELCOME"
  | "SECURITY_ALERT"
  | "ACCOUNT_NOTICE";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  caseId?: string;
  caseReferenceCode?: string;
  createdAt: string;
  readAt: string | null;
  data: {
    studyName?: string;
    status?: string;
  };
}

export interface NotificationsQuery {
  category?: NotificationCategory;
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

export interface NotificationsResponse {
  summary: {
    unreadCount: number;
    totalCount: number;
  };
  categoryCounts: Record<NotificationCategory, number>;
  items: NotificationItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  appliedFilters: {
    category: NotificationCategory | null;
    unreadOnly: boolean;
  };
}

export interface NotificationPreferences {
  categories: Record<NotificationCategory, boolean>;
}
