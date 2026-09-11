import AIInsight from "../../models/AIInsight.js";
import FinanceTransaction from "../../models/FinanceTransaction.js";
import FinanceBudget from "../../models/FinanceBudget.js";
import FinanceGoal from "../../models/FinanceGoal.js";
import Todo from "../../models/Todo.js";

/**
 * aiInsight.service.js — Doc 2 §35, Phase 4 ("Build automatic insights:
 * Finance trends, Overspending detection, Budget warnings, Goal
 * progress, Overdue task detection").
 *
 * There's no background job queue in this codebase yet (Doc 2 §60's
 * "Suggested Future Queue" — BullMQ — is still unbuilt), so this runs
 * on demand: `generateInsightsForUser()` is called synchronously when
 * the client asks for insights (see ai.controller.js's
 * listInsightsHandler). The aggregations here are the same shape and
 * cost as what aiContext.service.js already runs on every single AI
 * chat message, so running them once per insights-page load is cheap
 * by comparison. Move this behind a queue/cron once insights need to
 * be generated proactively (e.g. a daily digest) rather than on-view.
 *
 * Every detector is a pure rule (no LLM call) — deliberately, so
 * insights are inexpensive, deterministic, and can never hallucinate a
 * number the way a model-generated insight could (Doc 2 §23's
 * "Hallucination Prevention" rule).
 */

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function periodKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Upserts one insight, keyed on (userId, type, metadata.dedupeKey).
 * If a matching insight already exists and was dismissed, it is left
 * alone rather than resurrected — a user who dismissed "over budget on
 * Food this month" shouldn't see it pop back up on the next page load
 * just because the numbers refreshed slightly. Give the dedupeKey a
 * period component (see periodKey() above) so next month's version of
 * the same insight is a genuinely new row, not blocked by this month's
 * dismissal.
 */
async function upsertInsight(userId, { type, title, description, priority, metadata }) {
  const dedupeKey = metadata.dedupeKey;
  const existing = await AIInsight.findOne({ userId, type, "metadata.dedupeKey": dedupeKey });

  if (existing) {
    if (existing.dismissed) return existing;
    existing.title = title;
    existing.description = description;
    existing.priority = priority;
    existing.metadata = metadata;
    existing.generatedAt = new Date();
    await existing.save();
    return existing;
  }

  return AIInsight.create({ userId, type, title, description, priority, metadata, generatedAt: new Date() });
}

/** Doc 2 §35 example: "You are ₹3,500 above your entertainment budget." */
async function detectBudgetExceeded(userId, insights) {
  const from = startOfMonth();
  const budgets = await FinanceBudget.find({
    userId,
    month: from.getMonth() + 1,
    year: from.getFullYear(),
    archived: false,
  }).lean();
  if (!budgets.length) return;

  const spend = await FinanceTransaction.aggregate([
    { $match: { userId, type: "Expense", transactionDate: { $gte: from } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);
  const spendByCategory = Object.fromEntries(spend.map((s) => [s._id, s.total]));

  for (const budget of budgets) {
    const spent = spendByCategory[budget.category] || 0;
    if (spent <= budget.budgetAmount) continue;

    const over = spent - budget.budgetAmount;
    insights.push(
      await upsertInsight(userId, {
        type: "BUDGET_EXCEEDED",
        title: `Over budget on ${budget.category}`,
        description: `You've spent ${spent} on ${budget.category} this month, which is ${over} over your ${budget.budgetAmount} budget.`,
        priority: over > budget.budgetAmount * 0.25 ? "HIGH" : "MEDIUM",
        metadata: {
          dedupeKey: `${budget.category}:${periodKey()}`,
          category: budget.category,
          budgeted: budget.budgetAmount,
          spent,
          overBy: over,
        },
      }),
    );
  }
}

/** Doc 2 §35 example: "Your food spending increased 18%." */
async function detectSpendingIncrease(userId, insights) {
  const thisMonthStart = startOfMonth();
  const lastMonthStart = startOfMonth(new Date(thisMonthStart.getFullYear(), thisMonthStart.getMonth() - 1, 1));

  const [thisMonth, lastMonth] = await Promise.all([
    FinanceTransaction.aggregate([
      { $match: { userId, type: "Expense", transactionDate: { $gte: thisMonthStart } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
    FinanceTransaction.aggregate([
      { $match: { userId, type: "Expense", transactionDate: { $gte: lastMonthStart, $lt: thisMonthStart } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
  ]);
  const lastByCategory = Object.fromEntries(lastMonth.map((c) => [c._id, c.total]));

  // Ignore tiny amounts (avoid noise like "your ₹50 coffee spend
  // doubled to ₹100") and cap to the biggest few categories so this
  // can't produce more insights than a person can usefully act on.
  const MIN_AMOUNT = 500;
  const INCREASE_THRESHOLD_PCT = 15;

  const candidates = thisMonth
    .filter((c) => c.total >= MIN_AMOUNT && lastByCategory[c._id] > 0)
    .map((c) => ({
      category: c._id,
      current: c.total,
      previous: lastByCategory[c._id],
      pctChange: Math.round(((c.total - lastByCategory[c._id]) / lastByCategory[c._id]) * 100),
    }))
    .filter((c) => c.pctChange >= INCREASE_THRESHOLD_PCT)
    .sort((a, b) => b.pctChange - a.pctChange)
    .slice(0, 3);

  for (const c of candidates) {
    insights.push(
      await upsertInsight(userId, {
        type: "SPENDING_INCREASE",
        title: `${c.category} spending is up ${c.pctChange}%`,
        description: `Your ${c.category} spending increased ${c.pctChange}% this month (${c.current} vs ${c.previous} last month).`,
        priority: c.pctChange >= 40 ? "HIGH" : "MEDIUM",
        metadata: { dedupeKey: `${c.category}:${periodKey()}`, ...c },
      }),
    );
  }
}

/**
 * Doc 2 §35 example: "You are 73% toward your emergency fund target."
 * Also flags goals whose progress is meaningfully behind the pace
 * needed to hit targetDate, using createdAt as the implicit start
 * date (Goal has no separate startDate field).
 */
async function detectGoalProgress(userId, insights) {
  const goals = await FinanceGoal.find({ userId, status: "In Progress", archived: false }).lean();
  const now = new Date();

  for (const goal of goals) {
    if (!goal.targetAmount || goal.targetAmount <= 0) continue;
    const actualPct = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));

    if (goal.targetDate) {
      const totalDays = Math.max(1, (new Date(goal.targetDate) - goal.createdAt) / 86_400_000);
      const elapsedDays = Math.max(0, (now - goal.createdAt) / 86_400_000);
      const expectedPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
      const gap = expectedPct - actualPct;

      if (now > new Date(goal.targetDate) && actualPct < 100) {
        insights.push(
          await upsertInsight(userId, {
            type: "GOAL_BEHIND_SCHEDULE",
            title: `"${goal.goalName}" is past its target date`,
            description: `"${goal.goalName}" was due ${new Date(goal.targetDate).toLocaleDateString()} and is at ${actualPct}% (${goal.savedAmount}/${goal.targetAmount}).`,
            priority: "HIGH",
            metadata: { dedupeKey: `${goal._id}:overdue:${periodKey()}`, goalId: goal._id, actualPct },
          }),
        );
        continue;
      }

      if (gap >= 15) {
        insights.push(
          await upsertInsight(userId, {
            type: "GOAL_BEHIND_SCHEDULE",
            title: `"${goal.goalName}" is behind schedule`,
            description: `"${goal.goalName}" is at ${actualPct}% but should be around ${expectedPct}% by now to hit its target date.`,
            priority: gap >= 30 ? "HIGH" : "MEDIUM",
            metadata: { dedupeKey: `${goal._id}:behind:${periodKey()}`, goalId: goal._id, actualPct, expectedPct },
          }),
        );
        continue;
      }
    }

    // Informational milestone — only for goals not already flagged above.
    if (actualPct >= 75 && actualPct < 100) {
      insights.push(
        await upsertInsight(userId, {
          type: "GOAL_PROGRESS",
          title: `"${goal.goalName}" is ${actualPct}% funded`,
          description: `You're ${actualPct}% toward your "${goal.goalName}" goal (${goal.savedAmount}/${goal.targetAmount}).`,
          priority: "LOW",
          metadata: { dedupeKey: `${goal._id}:milestone75:${periodKey()}`, goalId: goal._id, actualPct },
        }),
      );
    }
  }
}

/** Doc 2 §35 example: "Three high-priority tasks are overdue." */
async function detectOverdueTasks(userId, insights) {
  const overdue = await Todo.countDocuments({
    userId,
    completed: false,
    deletedAt: null,
    dueAt: { $lt: new Date() },
  });
  if (overdue === 0) return;

  insights.push(
    await upsertInsight(userId, {
      type: "OVERDUE_TASKS",
      title: overdue === 1 ? "1 task is overdue" : `${overdue} tasks are overdue`,
      description: `You have ${overdue} incomplete task${overdue === 1 ? "" : "s"} past their due date.`,
      priority: overdue >= 3 ? "HIGH" : "MEDIUM",
      // Deliberately no date in the dedupeKey — unlike the finance/goal
      // detectors, this should keep updating the same row every day
      // rather than spawning a new "overdue tasks" insight daily.
      metadata: { dedupeKey: "overdue", overdueCount: overdue },
    }),
  );
}

/**
 * Runs every detector for one user and returns the current,
 * non-dismissed insight set (freshest first, highest priority first).
 * @param {string} userId
 */
export async function generateInsightsForUser(userId) {
  const insights = [];
  await Promise.all([
    detectBudgetExceeded(userId, insights),
    detectSpendingIncrease(userId, insights),
    detectGoalProgress(userId, insights),
    detectOverdueTasks(userId, insights),
  ]);

  const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return AIInsight.find({ userId, dismissed: false })
    .sort({ generatedAt: -1 })
    .lean()
    .then((rows) => rows.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]));
}

/** @param {string} userId @param {string} insightId */
export async function dismissInsight(userId, insightId) {
  return AIInsight.findOneAndUpdate({ _id: insightId, userId }, { $set: { dismissed: true } }, { new: true });
}

export default { generateInsightsForUser, dismissInsight };
