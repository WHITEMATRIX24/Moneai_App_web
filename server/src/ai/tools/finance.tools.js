import FinanceTransaction from "../../models/FinanceTransaction.js";
import FinanceBudget from "../../models/FinanceBudget.js";
import FinanceGoal from "../../models/FinanceGoal.js";
import FinanceAccount from "../../models/FinanceAccount.js";

/**
 * Doc Section 18 — Finance tool category. Same declaration/handler shape
 * as todo.tools.js: the model only ever sees the declaration and decides
 * WHEN to call it; the handler is always scoped to the authenticated
 * userId injected by aiApplicationTools.service.js, never anything the model supplies.
 *
 * Note on get_accounts/get_account_balance: these read from the real
 * Account model now. Users who signed up before Account existed (or who
 * just haven't created one yet) have zero Account docs, so both handlers
 * fall back to the old behavior — a single balance derived from all-time
 * FinanceTransaction totals (income - expenses) — rather than returning
 * an empty account list. Once a user has at least one real Account, the
 * derived fallback is never used for them again.
 */

export const getSpendingSummaryDeclaration = {
  name: "get_spending_summary",
  description:
    "Get a summary of the authenticated user's spending for the current month, broken down by category.",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

export const listBudgetsDeclaration = {
  name: "list_budgets",
  description: "List the authenticated user's configured budgets.",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * Write tool: proposes creating a budget. Only ever executed after
 * explicit user confirmation (see aiApplicationTools.service.js / Section 20).
 */
export const createBudgetDeclaration = {
  name: "create_budget",
  description:
    "Propose creating a new monthly budget for a spending category. Requires user confirmation before it takes effect.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      category: { type: "string", description: "Spending category, e.g. Food." },
      amount: { type: "number", description: "Budget amount in the user's currency." },
    },
    required: ["category", "amount"],
  },
};

/**
 * @param {string} userId
 */
export async function executeGetSpendingSummary(userId) {
  const from = new Date();
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  const rows = await FinanceTransaction.aggregate([
    { $match: { userId, type: "Expense", transactionDate: { $gte: from } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const totalSpent = rows.reduce((sum, r) => sum + r.total, 0);

  // Compact summary, not raw transaction rows — Section 12's rule.
  return {
    period: from.toLocaleString("en-US", { month: "long", year: "numeric" }),
    totalSpent,
    byCategory: rows.map((r) => ({ category: r._id, amount: r.total })),
  };
}

/**
 * @param {string} userId
 */
export async function executeListBudgets(userId) {
  const budgets = await FinanceBudget.find({ userId, archived: false }).sort({ createdAt: -1 });
  return budgets.map((b) => ({
    category: b.category,
    amount: b.budgetAmount,
    spent: b.spentAmount,
    month: b.month,
    year: b.year,
  }));
}

/**
 * Only called after confirmation — see executeTool() in aiApplicationTools.service.js.
 * @param {string} userId
 * @param {{category: string, amount: number}} args
 */
export async function executeCreateBudget(userId, args = {}) {
  if (!args.category) throw new Error("category is required");
  if (typeof args.amount !== "number" || args.amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  const now = new Date();
  const budget = await FinanceBudget.create({
    userId,
    category: args.category,
    budgetAmount: args.amount,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  return { category: budget.category, amount: budget.budgetAmount, month: budget.month, year: budget.year };
}

// ---------------------------------------------------------------------
// get_accounts / get_account_balance — see the module-level note above
// on why these are derived rather than backed by a real Account model.
// ---------------------------------------------------------------------

export const getAccountsDeclaration = {
  name: "get_accounts",
  description:
    "Get the authenticated user's accounts and their balances (checking, savings, cash, credit card, etc).",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

export const getAccountBalanceDeclaration = {
  name: "get_account_balance",
  description: "Get the authenticated user's total balance across all accounts.",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

// Pre-Account fallback: a single balance derived from all-time
// FinanceTransaction totals (income - expenses). Only used for a user
// with zero real Account docs — see the module-level note above.
async function computeDerivedBalance(userId) {
  const totals = await FinanceTransaction.aggregate([
    { $match: { userId } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const income = totals.find((t) => t._id === "Income")?.total || 0;
  const expenses = totals.find((t) => t._id === "Expense")?.total || 0;
  return income - expenses;
}

/**
 * @param {string} userId
 */
export async function executeGetAccounts(userId) {
  const accounts = await FinanceAccount.find({ userId, archived: false }).sort({
    createdAt: 1,
  });

  if (accounts.length === 0) {
    const totalBalance = await computeDerivedBalance(userId);
    return {
      totalBalance,
      accounts: [{ name: "Main", balance: totalBalance, derived: true }],
    };
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  return {
    totalBalance,
    accounts: accounts.map((a) => ({
      name: a.accountName,
      type: a.accountType,
      balance: a.balance,
      currency: a.currency,
    })),
  };
}

/**
 * @param {string} userId
 */
export async function executeGetAccountBalance(userId) {
  const accounts = await FinanceAccount.find({ userId, archived: false });
  if (accounts.length === 0) {
    return { totalBalance: await computeDerivedBalance(userId) };
  }
  return { totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0) };
}

// ---------------------------------------------------------------------
// get_transactions — the one place a small page of raw-ish rows is
// returned rather than an aggregate. Still trimmed to a compact shape
// (no _id, no userId, no timestamps) and capped at 20, per Section 12.
// ---------------------------------------------------------------------

export const getTransactionsDeclaration = {
  name: "get_transactions",
  description:
    "List the authenticated user's most recent transactions, optionally filtered by type or category. Returns at most 20, most recent first — use get_spending_summary or analyze_spending instead for totals/trends.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["Income", "Expense"],
        description: "Filter by transaction type.",
      },
      category: { type: "string", description: "Filter by category, e.g. Food." },
      limit: { type: "number", description: "Max rows to return, up to 20. Defaults to 10." },
    },
  },
};

/**
 * @param {string} userId
 * @param {{type?: string, category?: string, limit?: number}} args
 */
export async function executeGetTransactions(userId, args = {}) {
  const q = { userId };
  if (args.type) q.type = args.type;
  if (args.category) q.category = args.category;

  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);

  const rows = await FinanceTransaction.find(q)
    .sort({ transactionDate: -1 })
    .limit(limit)
    .select("type amount category description transactionDate -_id")
    .lean();

  return rows;
}

// ---------------------------------------------------------------------
// get_income_summary
// ---------------------------------------------------------------------

export const getIncomeSummaryDeclaration = {
  name: "get_income_summary",
  description:
    "Get a summary of the authenticated user's income for the current month, broken down by category/source.",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * @param {string} userId
 */
export async function executeGetIncomeSummary(userId) {
  const from = new Date();
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  const rows = await FinanceTransaction.aggregate([
    { $match: { userId, type: "Income", transactionDate: { $gte: from } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const totalIncome = rows.reduce((sum, r) => sum + r.total, 0);

  return {
    period: from.toLocaleString("en-US", { month: "long", year: "numeric" }),
    totalIncome,
    bySource: rows.map((r) => ({ source: r._id, amount: r.total })),
  };
}

// ---------------------------------------------------------------------
// analyze_spending — month-over-month comparison. Distinct from
// get_spending_summary (current month only): this is what Section 34's
// "Compare this month with last month" suggested prompt needs.
// ---------------------------------------------------------------------

export const analyzeSpendingDeclaration = {
  name: "analyze_spending",
  description:
    "Compare the authenticated user's spending this month against last month, overall and by category, to answer trend/change questions.",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * @param {string} userId
 */
export async function executeAnalyzeSpending(userId) {
  const startOfThisMonth = new Date();
  startOfThisMonth.setDate(1);
  startOfThisMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date(startOfThisMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  const [thisMonthRows, lastMonthRows] = await Promise.all([
    FinanceTransaction.aggregate([
      { $match: { userId, type: "Expense", transactionDate: { $gte: startOfThisMonth } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
    FinanceTransaction.aggregate([
      {
        $match: {
          userId,
          type: "Expense",
          transactionDate: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
  ]);

  const thisTotal = thisMonthRows.reduce((sum, r) => sum + r.total, 0);
  const lastTotal = lastMonthRows.reduce((sum, r) => sum + r.total, 0);
  const lastByCategory = Object.fromEntries(lastMonthRows.map((r) => [r._id, r.total]));

  return {
    thisMonthTotal: thisTotal,
    lastMonthTotal: lastTotal,
    changePct: lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : null,
    byCategory: thisMonthRows.map((r) => ({
      category: r._id,
      thisMonth: r.total,
      lastMonth: lastByCategory[r._id] || 0,
    })),
  };
}

// ---------------------------------------------------------------------
// Goal tools — list_goals / get_goal (read), create_goal (write).
// Mirrors the getGoalContext() shape in aiContext.service.js.
// ---------------------------------------------------------------------

export const listGoalsDeclaration = {
  name: "list_goals",
  description: "List the authenticated user's active savings goals, with progress toward each.",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

export const getGoalDeclaration = {
  name: "get_goal",
  description: "Get a single savings goal's details and progress by title.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "The goal's title, from list_goals." },
    },
    required: ["title"],
  },
};

/**
 * Write tool: proposes creating a savings goal. Requires confirmation.
 */
export const createGoalDeclaration = {
  name: "create_goal",
  description:
    "Propose creating a new savings goal. Requires user confirmation before it takes effect.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Goal title, e.g. Emergency Fund." },
      targetAmount: { type: "number", description: "Target amount in the user's currency." },
      targetDate: {
        type: "string",
        description: "Target date in ISO format (YYYY-MM-DD). Required by the app's goal model.",
      },
    },
    required: ["title", "targetAmount", "targetDate"],
  },
};

function toGoalSummary(g) {
  return {
    title: g.goalName,
    targetAmount: g.targetAmount,
    currentAmount: g.savedAmount,
    progressPct: g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0,
    targetDate: g.targetDate || null,
  };
}

/**
 * @param {string} userId
 */
export async function executeListGoals(userId) {
  const goals = await FinanceGoal.find({ userId, status: "In Progress", archived: false })
    .select("goalName targetAmount savedAmount targetDate")
    .lean();
  return goals.map(toGoalSummary);
}

/**
 * @param {string} userId
 * @param {{title: string}} args
 */
export async function executeGetGoal(userId, args = {}) {
  if (!args.title) throw new Error("title is required");

  const goal = await FinanceGoal.findOne({ userId, goalName: args.title, archived: false })
    .select("goalName targetAmount savedAmount targetDate")
    .lean();
  if (!goal) throw new Error("Goal not found");

  return toGoalSummary(goal);
}

/**
 * Only called after confirmation — see executeTool() in aiApplicationTools.service.js.
 * @param {string} userId
 * @param {{title: string, targetAmount: number, targetDate: string}} args
 */
export async function executeCreateGoal(userId, args = {}) {
  if (!args.title) throw new Error("title is required");
  if (typeof args.targetAmount !== "number" || args.targetAmount <= 0) {
    throw new Error("targetAmount must be a positive number");
  }
  if (!args.targetDate) throw new Error("targetDate is required");

  const goal = await FinanceGoal.create({
    userId,
    goalName: args.title,
    targetAmount: args.targetAmount,
    targetDate: args.targetDate,
  });

  return toGoalSummary(goal);
}
