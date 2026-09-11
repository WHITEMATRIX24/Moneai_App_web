/**
 * tokenBudget.js
 *
 * Doc Section 41-42 — Token Usage / Prompt Optimization. Small, provider-
 * agnostic helpers so ai.service.js doesn't repeat trimming logic in
 * three places. Uses the cheap chars/4 heuristic for pre-flight
 * decisions (trimming BEFORE the call) — the real, billed counts always
 * come back from the provider's usage metadata after the call.
 */

const CHARS_PER_TOKEN = 4;

/**
 * @param {string} text
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * @param {Array<{role:string, content?:string}>} messages
 */
export function estimateMessagesTokens(messages) {
  return (messages || []).reduce((sum, m) => sum + estimateTokens(m.content || JSON.stringify(m.toolCall || m)), 0);
}

/**
 * Drops the oldest messages until the remaining history fits under
 * maxTokens, always keeping the most recent turns (Section 42: "Last 10
 * messages" style windowing). Never drops the final message (the
 * current user turn) even if that alone exceeds budget — callers should
 * rely on aiSafety's MAX_INPUT_LENGTH for that edge case instead.
 * @param {Array} messages
 * @param {number} maxTokens
 */
export function trimHistoryToBudget(messages, maxTokens) {
  if (!messages || messages.length === 0) return [];
  const kept = [...messages];
  while (kept.length > 1 && estimateMessagesTokens(kept) > maxTokens) {
    kept.shift();
  }
  return kept;
}

export default { estimateTokens, estimateMessagesTokens, trimHistoryToBudget };
