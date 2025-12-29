import api from "./auth";

export const notificationsService = {
  getNotifications: async (page = 1, pageSize = 20) => {
    const response = await api.get("/notifications", {
      params: { page, pageSize },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },
};

