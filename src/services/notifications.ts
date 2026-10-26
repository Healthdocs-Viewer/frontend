import { apiClient } from "./apiClient";
import type {
  NotificationItem,
  NotificationsQuery,
  NotificationsResponse,
} from "../types/notifications";

export function getNotifications(
  query: NotificationsQuery = {},
): Promise<NotificationsResponse> {
  return apiClient.patient.getNotifications(query);
}

export function markNotificationRead(id: string): Promise<NotificationItem> {
  return apiClient.patient.markNotificationRead(id);
}

export function isNotificationUnread(item: NotificationItem): boolean {
  return item.readAt === null;
}
