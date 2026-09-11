import api from "./api.js";

export const overviewService = {
  transactions: () => api.get("/finance/transactions"),
  metrics: () => api.get("/health/metrics"),
  aiUsage: () => api.get("/ai/usage"),
};
