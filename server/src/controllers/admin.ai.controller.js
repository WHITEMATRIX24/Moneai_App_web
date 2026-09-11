import AIUsage from "../models/AIUsage.js";
import {
  getAISummary,
  getAIUsageByDay,
  getAIFeatureAnalytics,
  getAIModelAnalytics,
  getAIErrors,
} from "./aiAdmin.controller.js";

/**
 * admin.ai.controller.js — Doc Section 6's exact controller filename
 * (both docs agree on this one). The 5 functions below were already
 * implemented in `aiAdmin.controller.js` (a naming mismatch from an
 * earlier pass) — re-exported here rather than duplicated, so there's
 * one implementation and one doc-correct import surface. The genuinely
 * new piece is `getAIUserUsage`, which the doc lists (5-member doc §11:
 * "High-usage users and cost concentration"; 4-member doc §61:
 * `GET /admin/ai/users`) but which had no implementation anywhere.
 */
export { getAISummary, getAIUsageByDay, getAIFeatureAnalytics, getAIModelAnalytics, getAIErrors };

/**
 * GET /api/v1/admin/ai/users?limit=50
 * Doc Section 11 (5-member) — "High-usage users and cost concentration".
 * Doc Section 61 (4-member) — GET /admin/ai/users.
 * Per-user rollup: request count, tokens, cost, error count — sorted by
 * cost so the highest-spend users surface first (the doc's "cost
 * concentration" framing).
 */
export async function getAIUserUsage(req, res) {
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const rows = await AIUsage.aggregate([
    {
      $group: {
        _id: "$userId",
        requests: { $sum: 1 },
        totalTokens: { $sum: "$totalTokens" },
        estimatedCost: { $sum: "$estimatedCost" },
        avgLatencyMs: { $avg: "$latencyMs" },
        errors: { $sum: { $cond: ["$successful", 0, 1] } },
        lastRequestAt: { $max: "$createdAt" },
      },
    },
    { $sort: { estimatedCost: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  ]);

  res.json({
    success: true,
    data: rows
      .filter((r) => r._id) // drop rows where userId was never set (e.g. legacy /chat before auth was threaded through)
      .map((r) => ({
        userId: r._id,
        name: r.user?.name || null,
        email: r.user?.email || null,
        plan: r.user?.subscriptionPlan || "FREE",
        requests: r.requests,
        totalTokens: r.totalTokens,
        estimatedCost: r.estimatedCost,
        avgLatencyMs: Math.round(r.avgLatencyMs || 0),
        errors: r.errors,
        lastRequestAt: r.lastRequestAt,
      })),
  });
}
