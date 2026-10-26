export type NotificationType = "RESULT_AVAILABLE";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  caseReferenceCode: string;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsQuery {
  page?: number;
  size?: number;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
