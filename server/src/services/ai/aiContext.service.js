import FinanceTransaction from "../../models/FinanceTransaction.js";
import FinanceBudget from "../../models/FinanceBudget.js";
import Todo from "../../models/Todo.js";
import FinanceGoal from "../../models/FinanceGoal.js";
import HealthMetric from "../../models/HealthMetric.js";
import Medicine from "../../models/Medicine.js";

/**
 * aiContext.service.js
 *
 * Doc Section 10-12: the AI must never see raw collections — only
 * pre-aggregated summaries. Every function here is scoped to a single
 * userId (never taken from the model) and returns a small JSON object,
 * not Mongo documents. This is what gets folded into the prompt in
 * ai.service.js, on top of whatever tool the model explicitly calls.
 *
 * Kept as small, single-purpose exports (per-domain) so more can be
 * added alongside these without touching existing code.
 */

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Doc Section 11 — Finance Context.
 * Aggregates the current month's transactions into totals + top
 * categories, and lists active budgets. Never returns raw transaction
 * rows (Section 12's "send summaries, not 1,000 records" rule).
 * @param {string} userId
 */
export async function getFinanceContext(userId) {
  const from = startOfMonth();

  const [totals, categories, budgets] = await Promise.all([
    FinanceTransaction.aggregate([
      { $match: { userId, transactionDate: { $gte: from } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    FinanceTransaction.aggregate([
      { $match: { userId, type: "Expense", transactionDate: { $gte: from } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
    FinanceBudget.find({ userId, month: from.getMonth() + 1, year: from.getFullYear(), archived: false })
      .select("category budgetAmount spentAmount -_id")
      .lean(),
  ]);

  const income = totals.find((t) => t._id === "Income")?.total || 0;
  const expenses = totals.find((t) => t._id === "Expense")?.total || 0;

  return {
    period: from.toLocaleString("en-US", { month: "long", year: "numeric" }),
    income,
    expenses,
    savings: income - expenses,
    topCategories: categories.map((c) => ({ category: c._id, amount: c.total })),
    budgets: budgets.map((b) => ({ category: b.category, amount: b.budgetAmount })),
  };
}

/**
 * Doc Section 10 — Todo Context.
 * @param {string} userId
 */
export async function getTodoContext(userId) {
  const [pending, overdue, completedToday] = await Promise.all([
    Todo.countDocuments({ userId, completed: false, deletedAt: null }),
    Todo.countDocuments({
      userId,
      completed: false,
      deletedAt: null,
      dueAt: { $lt: new Date() },
    }),
    Todo.countDocuments({
      userId,
      completed: true,
      completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  return { pending, overdue, completedToday };
}

/**
 * Doc Section 10/18 — Goal Context. Goals are grouped with the Finance
 * domain in the tool list (get_goal/list_goals/create_goal), but kept
 * as a separate context function/key so a "how's my emergency fund
 * doing" question doesn't need the whole month's transaction history
 * to answer. Never returns raw Mongo docs.
 * @param {string} userId
 */
export async function getGoalContext(userId) {
  const goals = await FinanceGoal.find({ userId, status: "In Progress", archived: false })
    .select("goalName targetAmount savedAmount targetDate -_id")
    .lean();

  return {
    active: goals.map((g) => ({
      title: g.goalName,
      targetAmount: g.targetAmount,
      currentAmount: g.savedAmount,
      progressPct: g.targetAmount > 0
        ? Math.round((g.savedAmount / g.targetAmount) * 100)
        : 0,
      targetDate: g.targetDate || null,
    })),
  };
}

/**
 * Doc Section 10/18 — Health Context. Health tools/data are read-only
 * (Section 9), so this only ever aggregates existing HealthMetric rows
 * over a trailing 7-day window — never raw per-entry logs, matching
 * the "summary not the full history" rule the finance context follows.
 * @param {string} userId
 */
export async function getHealthContext(userId) {
  const from = new Date();
  from.setDate(from.getDate() - 7);

  const [totals, latestWeight] = await Promise.all([
    HealthMetric.aggregate([
      { $match: { userId, recordedAt: { $gte: from } } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$value" },
          avg: { $avg: "$value" },
          count: { $sum: 1 },
        },
      },
    ]),
    HealthMetric.findOne({ userId, type: "WEIGHT" })
      .sort({ recordedAt: -1 })
      .select("value unit recordedAt -_id")
      .lean(),
  ]);

  const byType = Object.fromEntries(totals.map((t) => [t._id, t]));

  return {
    windowDays: 7,
    steps: byType.STEPS ? Math.round(byType.STEPS.total) : null,
    sleepAvgHours: byType.SLEEP ? Math.round(byType.SLEEP.avg * 10) / 10 : null,
    avgHeartRate: byType.HEART_RATE ? Math.round(byType.HEART_RATE.avg) : null,
    caloriesTotal: byType.CALORIES ? Math.round(byType.CALORIES.total) : null,
    latestWeight: latestWeight
      ? { value: latestWeight.value, unit: latestWeight.unit, recordedAt: latestWeight.recordedAt }
      : null,
  };
}

/**
 * Doc: not in either requirement doc's tool list — see medicine.tools.js's
 * header for why this domain exists at all. Only a same-day count
 * (scheduled vs already taken), never the medicine list or dosages
 * themselves — that stays behind the explicit list_medicines/
 * get_today_doses tool calls so it's only pulled when actually relevant,
 * same reasoning as goals being split out from the finance context.
 * @param {string} userId
 */
export async function getMedicineContext(userId) {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekday = today.getDay();

  const medicines = await Medicine.find({ userId, active: true, deletedAt: null }).lean();

  let scheduledToday = 0;
  let takenToday = 0;
  for (const medicine of medicines) {
    const frequency = medicine.frequency || "EVERYDAY";
    const scheduled =
      frequency === "ONE_TIME"
        ? medicine.onceDate === dateKey
        : frequency === "CUSTOM_DAYS"
          ? Array.isArray(medicine.days) && medicine.days.includes(weekday)
          : true;
    if (!scheduled) continue;

    for (const time of medicine.times) {
      scheduledToday += 1;
      if (medicine.takenLog.some((log) => log.date === dateKey && log.time === time)) takenToday += 1;
    }
  }

  return { date: dateKey, scheduledToday, takenToday };
}

/**
 * Combined snapshot handed to the prompt builder. Kept flat/small —
 * this is what Section 12 calls the "Context Summary" step between
 * "Context Aggregator" and the LLM.
 * @param {string} userId
 */
export async function getUserContext(userId) {
  const [finance, todos, goals, health, medicine] = await Promise.all([
    getFinanceContext(userId),
    getTodoContext(userId),
    getGoalContext(userId),
    getHealthContext(userId),
    getMedicineContext(userId),
  ]);
  return { finance, todos, goals, health, medicine };
}

export default {
  getFinanceContext,
  getTodoContext,
  getGoalContext,
  getHealthContext,
  getMedicineContext,
  getUserContext,
};
