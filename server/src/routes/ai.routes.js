import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { aiRateLimit } from "../middleware/aiRateLimit.middleware.js";
import {
  listAIUsage,
  listAIErrors,
  recordAIUsage,
  getAIKPIs,
  getAIUsageTrends,
  chatWithAI,
  chatWithToolsAI,
  confirmChatAction,
  streamChatWithAI,
  createConversationHandler,
  listConversationsHandler,
  getConversationHandler,
  renameConversationHandler,
  deleteConversationHandler,
  sendConversationMessageHandler,
  confirmConversationMessageHandler,
  streamConversationMessageHandler,
  getPersonalizationConsentHandler,
  setPersonalizationConsentHandler,
  listAIMemoryHandler,
  deleteAIMemoryHandler,
  listInsightsHandler,
  dismissInsightHandler,
} from "../controllers/ai.controller.js";

const r = express.Router();

r.use(protect);

// Analytics aggregated endpoints (used by admin/src/services/aiAnalytics.service.js)
r.get("/kpis", getAIKPIs);
r.get("/usage-trends", getAIUsageTrends);

// Raw telemetry entries
r.get("/usage", listAIUsage);
r.get("/errors", listAIErrors);
r.post("/usage", recordAIUsage);

// Conversations
r.post("/conversations", createConversationHandler);
r.get("/conversations", listConversationsHandler);
r.get("/conversations/:conversationId", getConversationHandler);
r.patch("/conversations/:conversationId", renameConversationHandler);
r.delete("/conversations/:conversationId", deleteConversationHandler);
r.post("/conversations/:conversationId/messages", aiRateLimit, sendConversationMessageHandler);
r.post("/conversations/:conversationId/confirm", aiRateLimit, confirmConversationMessageHandler);
r.post("/conversations/:conversationId/stream", aiRateLimit, streamConversationMessageHandler);

// Personalization — consent & memory management (Settings page)
r.get("/personalization/consent", getPersonalizationConsentHandler);
r.patch("/personalization/consent", setPersonalizationConsentHandler);
r.get("/memory", listAIMemoryHandler);
r.delete("/memory/:key", deleteAIMemoryHandler);

// Insights — rule-based, no LLM call, so no aiRateLimit needed here
r.get("/insights", listInsightsHandler);
r.patch("/insights/:insightId/dismiss", dismissInsightHandler);

// Legacy Phase 1 endpoints (stateless, kept for backward compatibility)
r.post("/chat", aiRateLimit, chatWithAI);
r.post("/chat/tools", aiRateLimit, chatWithToolsAI);
r.post("/chat/tools/confirm", aiRateLimit, confirmChatAction);
r.post("/chat/stream", aiRateLimit, streamChatWithAI);

export default r;
