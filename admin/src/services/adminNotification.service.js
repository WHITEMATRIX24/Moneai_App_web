// src/services/adminNotification.service.js

import api from "./api.js";

export const adminNotificationService = {
  list: (params = {}) =>
    api.get("/admin/notifications", {
      params,
    }),

  create: (data) => api.post("/admin/notifications", data),

  update: (id, data) => api.patch(`/admin/notifications/${id}`, data),

  schedule: (id, data) => api.post(`/admin/notifications/${id}/schedule`, data),

  sendNow: (id) => api.post(`/admin/notifications/${id}/send`),

  cancel: (id) => api.post(`/admin/notifications/${id}/cancel`),

  stats: (id) => api.get(`/admin/notifications/${id}/stats`),
};
