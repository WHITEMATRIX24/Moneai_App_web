import api from "./api.js";

export const adminService = {
  dashboard: () => api.get("/admin/dashboard"),

  users: () => api.get("/admin/users"),

  updateUserStatus: (id, status) =>
    api.patch(`/admin/users/${id}/status`, { status }),

  updateUserPlan: (id, plan) =>
    api.patch(`/admin/users/${id}/plan`, { subscriptionPlan: plan }),

  getUserDevices: (id) =>
    api.get(`/admin/users/${id}/devices`),

  notifications: () =>
    api.get("/admin/notifications"),

  markNotificationRead: (id) =>
    api.patch(`/admin/notifications/${id}/read`),

  listAdmins: () =>
    api.get("/admin/admin-users"),

  createAdmin: (data) =>
    api.post("/admin/admin-users", data),

  updateAdmin: (id, data) =>
    api.patch(`/admin/admin-users/${id}`, data),

  updateAdminStatus: (id, isActive) =>
    api.patch(`/admin/admin-users/${id}/status`, { isActive }),

  deleteAdmin: (id) =>
    api.delete(`/admin/admin-users/${id}`),

  // AI ANALYTICS
  getAIUsage: () =>
    api.get("/admin/ai/usage"),

  aiUsage: () =>
    api.get("/admin/ai/usage"),

  getAIErrors: () =>
    api.get("/admin/ai/errors"),

  getAIUsers: (timeframe = "30d") => {
    const params = typeof timeframe === "string" ? { timeframe } : (timeframe || {});
    return api.get("/admin/ai/users", { params });
  },

  aiUsers: (timeframe = "30d") => {
    const params = typeof timeframe === "string" ? { timeframe } : (timeframe || {});
    return api.get("/admin/ai/users", { params });
  },

  // PLATFORM SETTINGS
  getSettings: () =>
    api.get("/admin/app-config"),

  updateSettings: (data) =>
    api.patch("/admin/app-config", data),
};