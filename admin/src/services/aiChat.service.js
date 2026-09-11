import api from "./api.js";

// Talks to server/src/routes/ai.routes.js's conversation-aware endpoints
// (Doc Section 24-30). Deliberately uses the non-streaming
// /messages + /confirm pair rather than /stream — simpler to drive from
// a plain axios client, and every response already carries the same
// reply/model/usage/toolUsed/pendingAction shape either way.
export const aiChatService = {
  listConversations: (params) => api.get("/ai/conversations", { params }),
  createConversation: (title) => api.post("/ai/conversations", title ? { title } : {}),
  getConversation: (conversationId) => api.get(`/ai/conversations/${conversationId}`),
  renameConversation: (conversationId, title) => api.patch(`/ai/conversations/${conversationId}`, { title }),
  deleteConversation: (conversationId) => api.delete(`/ai/conversations/${conversationId}`),
  sendMessage: (conversationId, message) => api.post(`/ai/conversations/${conversationId}/messages`, { message }),
  confirmAction: (conversationId, pendingAction) =>
    api.post(`/ai/conversations/${conversationId}/confirm`, { pendingAction }),
};

export default aiChatService;
