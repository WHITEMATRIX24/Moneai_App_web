import HealthMetric from "../../models/HealthMetric.js";

/**
 * Doc Section 18 — Health tool category. Kept read-only per Section 9
 * ("Initially keep health tools mainly read-only") — there is no
 * write/confirm tool here, unlike finance.tools.js/todo.tools.js.
 * health.prompt.js already tells the model never to propose creating,
 * editing or deleting health records.
 */

function windowStart(days) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  return from;
}

async function aggregateByType(userId, type, from) {
  const rows = await HealthMetric.aggregate([
    { $match: { userId, type, recordedAt: { $gte: from } } },
    {
      $group: {
        _id: null,
        total: { $sum: "$value" },
        avg: { $avg: "$value" },
        count: { $sum: 1 },
      },
    },
  ]);
  return rows[0] || null;
}

export const getHealthSummaryDeclaration = {
  name: "get_health_summary",
  description:
    "Get an overview of the authenticated user's logged health data over the last 7 days (steps, sleep, heart rate, calories, latest weight).",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

export const getActivitySummaryDeclaration = {
  name: "get_activity_summary",
  description:
    "Get the authenticated user's activity summary (steps and calories) over a given number of days.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      days: { type: "number", description: "How many trailing days to include. Defaults to 7." },
    },
  },
};

export const getSleepSummaryDeclaration = {
  name: "get_sleep_summary",
  description: "Get the authenticated user's average sleep over a given number of days.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      days: { type: "number", description: "How many trailing days to include. Defaults to 7." },
    },
  },
};

/**
 * @param {string} userId
 */
export async function executeGetHealthSummary(userId) {
  const from = windowStart(7);
  const [steps, sleep, heartRate, calories, latestWeight] = await Promise.all([
    aggregateByType(userId, "STEPS", from),
    aggregateByType(userId, "SLEEP", from),
    aggregateByType(userId, "HEART_RATE", from),
    aggregateByType(userId, "CALORIES", from),
    HealthMetric.findOne({ userId, type: "WEIGHT" })
      .sort({ recordedAt: -1 })
      .select("value unit recordedAt -_id")
      .lean(),
  ]);

  return {
    windowDays: 7,
    steps: steps ? Math.round(steps.total) : null,
    sleepAvgHours: sleep ? Math.round(sleep.avg * 10) / 10 : null,
    avgHeartRate: heartRate ? Math.round(heartRate.avg) : null,
    caloriesTotal: calories ? Math.round(calories.total) : null,
    latestWeight: latestWeight
      ? { value: latestWeight.value, unit: latestWeight.unit, recordedAt: latestWeight.recordedAt }
      : null,
  };
}

/**
 * @param {string} userId
 * @param {{days?: number}} args
 */
export async function executeGetActivitySummary(userId, args = {}) {
  const days = Math.min(Math.max(Number(args.days) || 7, 1), 90);
  const from = windowStart(days);

  const [steps, calories] = await Promise.all([
    aggregateByType(userId, "STEPS", from),
    aggregateByType(userId, "CALORIES", from),
  ]);

  return {
    windowDays: days,
    stepsTotal: steps ? Math.round(steps.total) : null,
    stepsAvgPerDay: steps ? Math.round(steps.total / days) : null,
    caloriesTotal: calories ? Math.round(calories.total) : null,
  };
}

/**
 * @param {string} userId
 * @param {{days?: number}} args
 */
export async function executeGetSleepSummary(userId, args = {}) {
  const days = Math.min(Math.max(Number(args.days) || 7, 1), 90);
  const from = windowStart(days);

  const sleep = await aggregateByType(userId, "SLEEP", from);

  return {
    windowDays: days,
    avgHours: sleep ? Math.round(sleep.avg * 10) / 10 : null,
    nightsLogged: sleep ? sleep.count : 0,
  };
}
