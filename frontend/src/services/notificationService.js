import apiClient, {
  createQuery,
} from "./apiClient";

const NOTIFICATION_API =
  "/api/notifications";

export function getNotifications(
  filters = {}
) {
  return apiClient.get(
    `${NOTIFICATION_API}${createQuery(
      filters
    )}`
  );
}

export function createNotification(
  data
) {
  return apiClient.post(
    NOTIFICATION_API,
    data
  );
}

export function markNotificationRead(
  notificationId
) {
  return apiClient.patch(
    `${NOTIFICATION_API}/${notificationId}/read`,
    {}
  );
}

export function markAllNotificationsRead() {
  return apiClient.patch(
    `${NOTIFICATION_API}/read-all`,
    {}
  );
}

export function deleteNotification(
  notificationId
) {
  return apiClient.delete(
    `${NOTIFICATION_API}/${notificationId}`
  );
}

export function clearAllNotifications() {
  return apiClient.delete(
    NOTIFICATION_API
  );
}

export function getActivities(
  filters = {}
) {
  return apiClient.get(
    `${NOTIFICATION_API}/activities${createQuery(
      filters
    )}`
  );
}

export function clearActivities() {
  return apiClient.delete(
    `${NOTIFICATION_API}/activities`
  );
}