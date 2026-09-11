import express from "express";
import { listAIUsage } from "../controllers/ai.controller.js";
import {
  getAISummary,
  getAIUsageByDay,
  getAIFeatureAnalytics,
  getAIModelAnalytics,
  getAIErrors,
  getAIUserUsage,
} from "../controllers/admin.ai.controller.js";

/**
 * admin.ai.routes.js — Doc Section 6 lists this as a router file
 * separate from the general admin.routes.js (mirrors ai.controller.js
 * vs admin.ai.controller.js). Mounted at /api/v1/admin/ai in app.js's
 * chain via admin.routes.js's `r.use("/ai", adminAiRoutes)` — same
 * final paths as before, just moved out of the inline route list.
 * auth/role middleware (protect + allowRoles) is applied by the parent
 * admin.routes.js router before this one is reached, same as every
 * other admin sub-route.
 *
 * Path note: the doc's route list (4-member doc §61) names
 * `GET /admin/ai/usage` — that path already existed pre-refactor via
 * `listAIUsage` (raw usage records; admin callers get every user's
 * rows, same handler the user-facing /api/v1/ai/usage uses, split by
 * `req.auth.type`). `getAIUsageByDay` is a second, additive endpoint
 * for Section 45's "Requests by Day" chart aggregation — kept at
 * `/usage-by-day` rather than colliding with `/usage`, since the doc
 * doesn't actually distinguish the two but both are needed.
 */
const r = express.Router();

r.get("/usage", listAIUsage);
r.get("/summary", getAISummary);
r.get("/usage-by-day", getAIUsageByDay);
r.get("/features", getAIFeatureAnalytics);
r.get("/models", getAIModelAnalytics);
r.get("/errors", getAIErrors);
r.get("/users", getAIUserUsage);

export default r;
