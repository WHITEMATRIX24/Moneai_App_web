import AIUsage from "../models/AIUsage.js";

/**
 * GET /api/v1/admin/ai/summary
 * Doc Section 44 — KPI cards: Total Requests, Active AI Users, Tokens
 * Used, Estimated Cost, Average Response Time, Success Rate.
 */
export async function getAISummary(req, res) {
  const [totals, activeUserIds] = await Promise.all([
    AIUsage.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: "$totalTokens" },
          estimatedCost: { $sum: "$estimatedCost" },
          avgLatencyMs: { $avg: "$latencyMs" },
          successfulRequests: { $sum: { $cond: ["$successful", 1, 0] } },
        },
      },
    ]),
    AIUsage.distinct("userId"),
  ]);

  const summary = totals[0] || {
    totalRequests: 0,
    totalTokens: 0,
    estimatedCost: 0,
    avgLatencyMs: 0,
    successfulRequests: 0,
  };

  const successRate = summary.totalRequests
    ? Math.round((summary.successfulRequests / summary.totalRequests) * 1000) / 10
    : 100;

  res.json({
    success: true,
    data: {
      totalRequests: summary.totalRequests,
      activeAIUsers: activeUserIds.filter(Boolean).length,
      totalTokens: summary.totalTokens,
      estimatedCost: summary.estimatedCost,
      avgLatencyMs: Math.round(summary.avgLatencyMs || 0),
      successRate,
      errorRate: Math.round((100 - successRate) * 10) / 10,
    },
  });
}

/**
 * GET /api/v1/admin/ai/usage?days=7
 * Doc Section 45 — Requests by Day chart.
 */
export async function getAIUsageByDay(req, res) {
  const days = Math.min(Number(req.query.days) || 7, 30);
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const rows = await AIUsage.aggregate([
    { $match: { createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        requests: { $sum: 1 },
        tokens: { $sum: "$totalTokens" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in zero-request days so the chart doesn't have gaps.
  const byDate = new Map(rows.map((r) => [r._id, r]));
  const series = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const found = byDate.get(key);
    series.push({ date: key, requests: found?.requests || 0, tokens: found?.tokens || 0 });
  }

  res.json({ success: true, data: series });
}

/**
 * GET /api/v1/admin/ai/features
 * Doc Section 46 — Feature Analytics table (requestType stands in for
 * "feature" until Member 1 tags requests with a dedicated feature name).
 */
export async function getAIFeatureAnalytics(req, res) {
  const rows = await AIUsage.aggregate([
    { $group: { _id: "$requestType", requests: { $sum: 1 }, tokens: { $sum: "$totalTokens" } } },
    { $sort: { requests: -1 } },
  ]);

  res.json({
    success: true,
    data: rows.map((r) => ({ feature: r._id || "UNKNOWN", requests: r.requests, tokens: r.tokens })),
  });
}

/**
 * GET /api/v1/admin/ai/models
 * Doc Section 47 — Model Analytics table.
 */
export async function getAIModelAnalytics(req, res) {
  const rows = await AIUsage.aggregate([
    {
      $group: {
        _id: { provider: "$provider", model: "$model" },
        requests: { $sum: 1 },
        inputTokens: { $sum: "$promptTokens" },
        outputTokens: { $sum: "$completionTokens" },
        cost: { $sum: "$estimatedCost" },
        avgLatencyMs: { $avg: "$latencyMs" },
        errors: { $sum: { $cond: ["$successful", 0, 1] } },
      },
    },
    { $sort: { requests: -1 } },
  ]);

  res.json({
    success: true,
    data: rows.map((r) => ({
      provider: r._id.provider || "unknown",
      model: r._id.model || "unknown",
      requests: r.requests,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cost: r.cost,
      avgLatencyMs: Math.round(r.avgLatencyMs || 0),
      errorRate: r.requests ? Math.round((r.errors / r.requests) * 1000) / 10 : 0,
    })),
  });
}

/**
 * GET /api/v1/admin/ai/errors?limit=50
 * Doc Section 48 — AI Error Monitoring.
 */
export async function getAIErrors(req, res) {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const errors = await AIUsage.find({ successful: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("userId model provider requestType errorCode createdAt");

  res.json({ success: true, data: errors });
}
