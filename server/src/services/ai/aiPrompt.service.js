import { baseSystemPrompt } from "../../ai/prompts/system.prompt.js";
import { financePromptRules } from "../../ai/prompts/finance.prompt.js";
import { todoPromptRules } from "../../ai/prompts/todo.prompt.js";
import { healthPromptRules } from "../../ai/prompts/health.prompt.js";
import { medicinePromptRules } from "../../ai/prompts/medicine.prompt.js";
import { memoryPromptRules } from "../../ai/prompts/memory.prompt.js";
import { safetyPromptRules } from "../../ai/prompts/safety.prompt.js";

/**
 * aiPrompt.service.js
 *
 * The prompt engine (doc Section 21-22, "Prompt Engine" box in the
 * architecture diagram). Composes the final system prompt from:
 *   base instructions + only the domain rule-sets relevant to this turn
 *   + the safety rules (always included) + the context-engine snapshot.
 *
 * Domain fragments are included conditionally rather than always-on so
 * a plain "hi" doesn't carry finance/todo/health rule text it doesn't
 * need — keeps the prompt smaller (Section 42's "prompt optimization").
 */

/**
 * @param {Object} context - output of aiContext.service.js's getUserContext
 * @returns {string[]} names of domains with non-trivial data, used to
 *   decide which prompt fragments to include
 */
function activeDomains(context, forceDomains) {
  if (forceDomains && forceDomains.length > 0) return forceDomains;
  const domains = [];
  if (context?.finance || context?.goals) domains.push("finance");
  if (context?.todos) domains.push("todo");
  if (context?.health) domains.push("health");
  if (context?.medicine) domains.push("medicine");
  return domains;
}

const DOMAIN_RULES = {
  finance: financePromptRules,
  todo: todoPromptRules,
  health: healthPromptRules,
  medicine: medicinePromptRules,
};

/**
 * @param {Object} options
 * @param {Object} options.context - getUserContext() snapshot
 * @param {string} [options.conversationSummary] - Section 43 summary, if any
 * @param {string[]} [options.forceDomains] - include these domain rule-sets
 *   regardless of `context` (used by the legacy stateless /chat/tools
 *   endpoints, which offer finance+todo tools without a context snapshot)
 * @param {Array<{key:string,value:string,category?:string}>} [options.memory] -
 *   aiMemory.service.js's list(userId) output. Only wired into the main
 *   orchestrator path (ai.service.js's buildSystemPromptWithContext) —
 *   the legacy stateless endpoints don't fetch it, same as they don't
 *   fetch `context`.
 */
export function buildSystemPrompt({ context, conversationSummary, forceDomains, memory } = {}) {
  const parts = [baseSystemPrompt()];

  for (const domain of activeDomains(context, forceDomains)) {
    const rules = DOMAIN_RULES[domain];
    if (rules) parts.push(rules());
  }

  // Always included, not domain-conditional — see memory.prompt.js's
  // header for why (a new fact to remember can come up in any turn).
  parts.push(memoryPromptRules());
  parts.push(safetyPromptRules());

  if (conversationSummary) {
    parts.push(`Conversation so far (summarized): ${conversationSummary}`);
  }

  if (memory && memory.length > 0) {
    parts.push(
      `Remembered about this user (from past conversations — use naturally where relevant, don't recite unprompted):\n${JSON.stringify(memory)}`,
    );
  }

  if (context) {
    parts.push(`Current user context (already verified, do not question it):\n${JSON.stringify(context)}`);
  }

  return parts.join("\n\n");
}

export default { buildSystemPrompt };
