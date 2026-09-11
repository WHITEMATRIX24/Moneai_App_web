import AIToolExecution from "../../models/AIToolExecution.js";
import { remember } from "./aiMemory.service.js";
import { hasPersonalizationConsent } from "./aiConsent.service.js";

/**
 * aiInference.service.js
 *
 * The "without their knowledge" half of personalization — except it
 * isn't, by design: every write here is gated by hasPersonalizationConsent()
 * and every fact it writes is visible (source: "inferred") through the
 * same GET /api/v1/ai/memory endpoint that lists stated facts, so a user
 * who granted consent can always see and delete what's been inferred.
 * "Without their knowledge" only ever meant "without them having to
 * state it turn by turn" — never "without them being able to find out."
 *
 * Scope, deliberately small for this pass: one signal (which domain a
 * user's tool calls cluster in — finance/todo/health/medicine), derived
 * from AIToolExecution, the audit log every tool call already writes to.
 * No conversation-content mining, no third-party data. Add more signals
 * here later; the consent gate and visibility guarantee apply to
 * whatever gets added, not just this one.
 */

const TOOL_DOMAIN = {
  get_spending_summary: "finance",
  list_budgets: "finance",
  create_budget: "finance",
  get_accounts: "finance",
  get_account_balance: "finance",
  get_transactions: "finance",
  get_income_summary: "finance",
  analyze_spending: "finance",
  list_goals: "finance",
  get_goal: "finance",
  create_goal: "finance",
  list_todos: "todo",
  create_todo: "todo",
  update_todo: "todo",
  complete_todo: "todo",
  delete_todo: "todo",
  get_health_summary: "health",
  get_activity_summary: "health",
  get_sleep_summary: "health",
  list_medicines: "medicine",
  get_today_doses: "medicine",
  mark_dose_taken: "medicine",
  mark_dose_untaken: "medicine",
};

// Don't infer from a handful of calls — wait for a real pattern, and
// don't recompute on every single tool call (cheap query, but pointless
// churn on a fact that rarely needs updating turn to turn).
const MIN_EXECUTIONS = 8;
const RECOMPUTE_EVERY = 5;

/**
 * Recomputes and stores the user's inferred primary focus area, if
 * consent is granted and there's enough signal to be worth saving.
 * Fire-and-forget from the caller — errors are logged, never thrown,
 * so a failed inference pass never affects the tool call that triggered it.
 * @param {string} userId
 */
export async function runInferenceForUser(userId) {
  try {
    if (!(await hasPersonalizationConsent(userId))) return;

    const total = await AIToolExecution.countDocuments({ userId, status: "SUCCESS" });
    if (total < MIN_EXECUTIONS || total % RECOMPUTE_EVERY !== 0) return;

    const rows = await AIToolExecution.find({ userId, status: "SUCCESS" })
      .select("tool -_id")
      .limit(500)
      .sort({ createdAt: -1 })
      .lean();

    const counts = {};
    for (const { tool } of rows) {
      const domain = TOOL_DOMAIN[tool];
      if (!domain) continue;
      counts[domain] = (counts[domain] || 0) + 1;
    }

    const domains = Object.entries(counts);
    if (domains.length === 0) return;

    const [topDomain, topCount] = domains.sort((a, b) => b[1] - a[1])[0];
    const scoredTotal = domains.reduce((sum, [, c]) => sum + c, 0);
    const confidence = Math.min(1, topCount / scoredTotal);

    // Below this, usage is too spread across domains to call it a
    // "focus" with any confidence — better to save nothing than a
    // low-confidence guess the model would have to hedge on anyway.
    if (confidence < 0.4) return;

    await remember(userId, {
      key: "primaryFocusArea",
      value: topDomain,
      category: "behavior",
      confidence,
      source: "inferred",
    });
  } catch (err) {
    console.error("aiInference.runInferenceForUser failed:", err.message);
  }
}

export default { runInferenceForUser };
