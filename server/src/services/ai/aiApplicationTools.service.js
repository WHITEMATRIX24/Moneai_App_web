import {
  listTodosDeclaration,
  executeListTodos,
  createTodoDeclaration,
  executeCreateTodo,
  updateTodoDeclaration,
  executeUpdateTodo,
  completeTodoDeclaration,
  executeCompleteTodo,
  deleteTodoDeclaration,
  executeDeleteTodo,
} from "../../ai/tools/todo.tools.js";
import {
  getSpendingSummaryDeclaration,
  executeGetSpendingSummary,
  listBudgetsDeclaration,
  executeListBudgets,
  createBudgetDeclaration,
  executeCreateBudget,
  getAccountsDeclaration,
  executeGetAccounts,
  getAccountBalanceDeclaration,
  executeGetAccountBalance,
  getTransactionsDeclaration,
  executeGetTransactions,
  getIncomeSummaryDeclaration,
  executeGetIncomeSummary,
  analyzeSpendingDeclaration,
  executeAnalyzeSpending,
  listGoalsDeclaration,
  executeListGoals,
  getGoalDeclaration,
  executeGetGoal,
  createGoalDeclaration,
  executeCreateGoal,
} from "../../ai/tools/finance.tools.js";
import {
  getHealthSummaryDeclaration,
  executeGetHealthSummary,
  getActivitySummaryDeclaration,
  executeGetActivitySummary,
  getSleepSummaryDeclaration,
  executeGetSleepSummary,
} from "../../ai/tools/health.tools.js";
import {
  getUserProfileDeclaration,
  executeGetUserProfile,
  getSubscriptionDeclaration,
  executeGetSubscription,
  getNotificationPreferencesDeclaration,
  executeGetNotificationPreferences,
} from "../../ai/tools/profile.tools.js";
import {
  listMedicinesDeclaration,
  executeListMedicines,
  getTodayDosesDeclaration,
  executeGetTodayDoses,
  markDoseTakenDeclaration,
  executeMarkDoseTaken,
  markDoseUntakenDeclaration,
  executeMarkDoseUntaken,
} from "../../ai/tools/medicine.tools.js";
import {
  rememberPreferenceDeclaration,
  executeRememberPreference,
  forgetPreferenceDeclaration,
  executeForgetPreference,
  listRememberedPreferencesDeclaration,
  executeListRememberedPreferences,
} from "../../ai/tools/memory.tools.js";
import AIToolExecution from "../../models/AIToolExecution.js";
import { runInferenceForUser } from "./aiInference.service.js";

/**
 * aiApplicationTools.service.js
 *
 * (Formerly aiTool.service.js — renamed to match the 5-member doc v1.1,
 * the newer/authoritative spec, Section 6's services/ai/ file list.
 * The 4-member doc v1.0 calls this aiTool.service.js; that name no
 * longer exists in this codebase as of this pass. The one real import
 * of it, in ai.service.js, now points here.)
 *
 * Every tool the LLM can call must be registered here. This is the
 * validation boundary: the model can only trigger names that exist
 * in this registry, and every handler receives userId from the
 * authenticated request — never from the model's output. This is
 * what prevents "LLM -> MongoDB" and enforces "LLM -> Tool validator
 * -> Authorization layer -> MONE AI service -> Database" from the doc.
 *
 * requiresConfirmation: true marks write tools. executeTool() refuses
 * to run these unless the caller explicitly passes confirmed: true —
 * this is the enforcement point for the doc's "Action Confirmation" rule.
 */
const registry = {
  list_todos: {
    declaration: listTodosDeclaration,
    handler: executeListTodos,
    requiresConfirmation: false,
  },
  create_todo: {
    declaration: createTodoDeclaration,
    handler: executeCreateTodo,
    requiresConfirmation: true,
  },
  get_spending_summary: {
    declaration: getSpendingSummaryDeclaration,
    handler: (userId) => executeGetSpendingSummary(userId),
    requiresConfirmation: false,
  },
  list_budgets: {
    declaration: listBudgetsDeclaration,
    handler: (userId) => executeListBudgets(userId),
    requiresConfirmation: false,
  },
  create_budget: {
    declaration: createBudgetDeclaration,
    handler: executeCreateBudget,
    requiresConfirmation: true,
  },
  update_todo: {
    declaration: updateTodoDeclaration,
    handler: executeUpdateTodo,
    requiresConfirmation: true,
  },
  complete_todo: {
    declaration: completeTodoDeclaration,
    handler: executeCompleteTodo,
    requiresConfirmation: true,
  },
  delete_todo: {
    declaration: deleteTodoDeclaration,
    handler: executeDeleteTodo,
    requiresConfirmation: true,
  },
  get_accounts: {
    declaration: getAccountsDeclaration,
    handler: (userId) => executeGetAccounts(userId),
    requiresConfirmation: false,
  },
  get_account_balance: {
    declaration: getAccountBalanceDeclaration,
    handler: (userId) => executeGetAccountBalance(userId),
    requiresConfirmation: false,
  },
  get_transactions: {
    declaration: getTransactionsDeclaration,
    handler: executeGetTransactions,
    requiresConfirmation: false,
  },
  get_income_summary: {
    declaration: getIncomeSummaryDeclaration,
    handler: (userId) => executeGetIncomeSummary(userId),
    requiresConfirmation: false,
  },
  analyze_spending: {
    declaration: analyzeSpendingDeclaration,
    handler: (userId) => executeAnalyzeSpending(userId),
    requiresConfirmation: false,
  },
  list_goals: {
    declaration: listGoalsDeclaration,
    handler: (userId) => executeListGoals(userId),
    requiresConfirmation: false,
  },
  get_goal: {
    declaration: getGoalDeclaration,
    handler: executeGetGoal,
    requiresConfirmation: false,
  },
  create_goal: {
    declaration: createGoalDeclaration,
    handler: executeCreateGoal,
    requiresConfirmation: true,
  },
  get_health_summary: {
    declaration: getHealthSummaryDeclaration,
    handler: (userId) => executeGetHealthSummary(userId),
    requiresConfirmation: false,
  },
  get_activity_summary: {
    declaration: getActivitySummaryDeclaration,
    handler: executeGetActivitySummary,
    requiresConfirmation: false,
  },
  get_sleep_summary: {
    declaration: getSleepSummaryDeclaration,
    handler: executeGetSleepSummary,
    requiresConfirmation: false,
  },
  get_user_profile: {
    declaration: getUserProfileDeclaration,
    handler: (userId) => executeGetUserProfile(userId),
    requiresConfirmation: false,
  },
  get_subscription: {
    declaration: getSubscriptionDeclaration,
    handler: (userId) => executeGetSubscription(userId),
    requiresConfirmation: false,
  },
  get_notification_preferences: {
    declaration: getNotificationPreferencesDeclaration,
    handler: (userId) => executeGetNotificationPreferences(userId),
    requiresConfirmation: false,
  },
  list_medicines: {
    declaration: listMedicinesDeclaration,
    handler: (userId) => executeListMedicines(userId),
    requiresConfirmation: false,
  },
  get_today_doses: {
    declaration: getTodayDosesDeclaration,
    handler: executeGetTodayDoses,
    requiresConfirmation: false,
  },
  mark_dose_taken: {
    declaration: markDoseTakenDeclaration,
    handler: executeMarkDoseTaken,
    requiresConfirmation: true,
  },
  mark_dose_untaken: {
    declaration: markDoseUntakenDeclaration,
    handler: executeMarkDoseUntaken,
    requiresConfirmation: true,
  },
  remember_preference: {
    declaration: rememberPreferenceDeclaration,
    handler: executeRememberPreference,
    // Deliberately false: unlike budgets/goals/todos, a remembered
    // preference is low-stakes and easily reversible (the user can see
    // and delete anything via GET/DELETE /api/v1/ai/memory or by asking
    // the AI), so requiring a confirm click on every "remember I prefer
    // X" would be pure friction with no real safety benefit. This is an
    // intentional exception to the codebase's default write-tool rule,
    // not an oversight — see memory.tools.js for the same note.
    requiresConfirmation: false,
  },
  forget_preference: {
    declaration: forgetPreferenceDeclaration,
    handler: executeForgetPreference,
    requiresConfirmation: false, // Deliberate — see remember_preference above.
  },
  list_remembered_preferences: {
    declaration: listRememberedPreferencesDeclaration,
    handler: (userId) => executeListRememberedPreferences(userId),
    requiresConfirmation: false,
  },
};

export function getToolDeclarations() {
  return Object.values(registry).map((t) => t.declaration);
}

export function toolRequiresConfirmation(name) {
  const tool = registry[name];
  if (!tool) throw new Error(`Unknown or unauthorized tool: ${name}`);
  return tool.requiresConfirmation;
}

/**
 * Fire-and-forget audit write to AIToolExecution (Doc §10's "validate
 * every tool name and parameter" needs a record, not just enforcement —
 * see the model's file header for the full rationale). Never awaited by
 * executeTool() itself: a logging failure must not affect the user-facing
 * tool call, and the extra round trip shouldn't add to response latency.
 */
function logToolExecution(entry) {
  AIToolExecution.create(entry).catch((err) => {
    console.error("AIToolExecution logging failed:", err.message);
  });
}

/**
 * @param {string} name
 * @param {Object} args
 * @param {string} userId - from the authenticated request, never the model
 * @param {boolean} [confirmed=false] - must be explicitly true for write tools
 * @param {string|null} [conversationId=null] - null for the legacy stateless
 *   /chat/tools endpoints, which have no persisted conversation to attach to
 */
export async function executeTool(name, args, userId, confirmed = false, conversationId = null) {
  const tool = registry[name];
  if (!tool) {
    throw new Error(`Unknown or unauthorized tool: ${name}`);
  }
  if (tool.requiresConfirmation && !confirmed) {
    throw new Error(
      `Tool "${name}" requires user confirmation before it can execute`,
    );
  }

  const startedAt = Date.now();
  try {
    const result = await tool.handler(userId, args || {});
    logToolExecution({
      userId,
      conversation: conversationId,
      tool: name,
      parameters: args || {},
      requiresConfirmation: tool.requiresConfirmation,
      confirmed,
      status: "SUCCESS",
      result,
      latencyMs: Date.now() - startedAt,
    });
    // Fire-and-forget, same rationale as logToolExecution above: this is
    // where behavioral inference gets its signal (Doc's memory personalization,
    // extended beyond stated facts — see aiInference.service.js's header).
    // The function itself no-ops instantly if the user hasn't granted
    // personalization consent, so this is a no-op cost for most calls.
    runInferenceForUser(userId);
    return result;
  } catch (err) {
    logToolExecution({
      userId,
      conversation: conversationId,
      tool: name,
      parameters: args || {},
      requiresConfirmation: tool.requiresConfirmation,
      confirmed,
      status: "ERROR",
      errorMessage: err.message,
      latencyMs: Date.now() - startedAt,
    });
    throw err;
  }
}

export default { getToolDeclarations, toolRequiresConfirmation, executeTool };