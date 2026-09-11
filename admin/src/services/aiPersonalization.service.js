import api from "./api.js";

// Talks to server/src/routes/ai.routes.js's personalization/memory
// endpoints — plain REST, separate from the AI tool loop, for the
// Settings page to read/control directly (not via a chat message).
export const aiPersonalizationService = {
  getConsent: () => api.get("/ai/personalization/consent"),
  setConsent: (granted) => api.patch("/ai/personalization/consent", { granted }),
  listMemory: () => api.get("/ai/memory"),
  forgetMemory: (key) => api.delete(`/ai/memory/${encodeURIComponent(key)}`),
};

export default aiPersonalizationService;
