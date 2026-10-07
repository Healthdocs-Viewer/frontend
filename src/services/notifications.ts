import notificationsMock from "../mocks/responses/notifications.json";
import preferencesMock from "../mocks/responses/notification-preferences.json";
import type {
  NotificationCategory,
  NotificationItem,
  NotificationPreferences,
  NotificationsQuery,
  NotificationsResponse,
} from "../types/notifications";

const initialResponse = notificationsMock as NotificationsResponse;
let notificationItems = initialResponse.items.map((item) => ({ ...item }));
let preferences = preferencesMock as NotificationPreferences;

// Future endpoint: GET /api/v1/notifications?category=&unreadOnly=&page=0&size=20
export async function getNotifications(
  query: NotificationsQuery = {},
): Promise<NotificationsResponse> {
  const page = query.page ?? 0;
  const size = query.size ?? 20;
  const unreadItems = notificationItems.filter((item) => item.readAt === null);
  const filtered = notificationItems.filter((item) =>
    (!query.category || item.category === query.category) &&
    (!query.unreadOnly || item.readAt === null),
  );

  return {
    summary: {
      unreadCount: unreadItems.length,
      totalCount: notificationItems.length,
    },
    categoryCounts: {
      CASES: notificationItems.filter((item) => item.category === "CASES").length,
      RESULTS: notificationItems.filter((item) => item.category === "RESULTS").length,
      SYSTEM: notificationItems.filter((item) => item.category === "SYSTEM").length,
    },
    items: filtered.slice(page * size, (page + 1) * size),
    page,
    size,
    totalItems: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
    appliedFilters: {
      category: query.category ?? null,
      unreadOnly: query.unreadOnly ?? false,
    },
  };
}

// Future endpoint: POST /api/v1/notifications/{notificationId}/read
export async function markNotificationRead(id: string): Promise<void> {
  notificationItems = notificationItems.map((item) =>
    item.id === id && item.readAt === null
      ? { ...item, readAt: new Date().toISOString() }
      : item,
  );
}

// Future endpoint: POST /api/v1/notifications/read-all
export async function markAllNotificationsRead(): Promise<void> {
  const readAt = new Date().toISOString();
  notificationItems = notificationItems.map((item) =>
    item.readAt === null ? { ...item, readAt } : item,
  );
}

// Future endpoints: GET/PUT /api/v1/notification-preferences
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return { categories: { ...preferences.categories } };
}

export async function updateNotificationPreference(
  category: NotificationCategory,
  enabled: boolean,
): Promise<NotificationPreferences> {
  preferences = {
    categories: { ...preferences.categories, [category]: enabled },
  };
  return getNotificationPreferences();
}

export function isNotificationUnread(item: NotificationItem): boolean {
  return item.readAt === null;
}
