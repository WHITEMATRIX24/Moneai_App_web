import api from "./api.js";

export const aiAdminService = {
  summary: () => api.get("/admin/ai/summary"),
  usageByDay: (days = 7) => api.get(`/admin/ai/usage-by-day?days=${days}`),
  features: () => api.get("/admin/ai/features"),
  models: () => api.get("/admin/ai/models"),
  errors: (limit = 50) => api.get(`/admin/ai/errors?limit=${limit}`),
  // GET /admin/ai/users — backend already existed (admin.ai.controller.js's
  // getAIUserUsage) but nothing on the frontend called it yet.
  userUsage: (limit = 20) => api.get(`/admin/ai/users?limit=${limit}`),
};
