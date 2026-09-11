/**
 * aiCost.js
 *
 * Doc Section 44/47 — Estimated Cost KPI + per-model cost column. Maps
 * (provider, model) -> a $/1M-token rate and turns a real usage result
 * into an estimatedCost figure for AIUsage. Deliberately data-only (no
 * network calls) so it can run inline on every request without adding
 * latency.
 *
 * Rates below are approximate list prices captured at the time this file
 * was written — providers change pricing without notice, so treat these
 * as "close enough for admin analytics trending," not billing-accurate.
 * Revisit PRICING_PER_MILLION_TOKENS whenever AI_PROVIDER/AI_*_MODEL
 * defaults change (see aiProvider.service.js's DEFAULT_MODELS).
 */

// USD per 1,000,000 tokens, { input, output }.
const PRICING_PER_MILLION_TOKENS = {
  gemini: {
    "gemini-3.6-flash": { input: 1.5, output: 7.5 },
    "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
    "gemini-2.5-flash": { input: 0.3, output: 2.5 },
    "gemini-2.0-flash-lite": { input: 0.075, output: 0.3 },
    "text-embedding-004": { input: 0, output: 0 },
  },
  openai: {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "text-embedding-3-small": { input: 0.02, output: 0 },
  },
  anthropic: {
    "claude-sonnet-4-6": { input: 3, output: 15 },
    "claude-haiku-4-5": { input: 1, output: 5 },
  },
};

// Used when (provider, model) isn't in the table above (a new/renamed
// model) so cost trends "roughly right" instead of silently reporting
// $0 forever — same fallback spirit as the provider files' chars/4
// token-count approximation.
const FALLBACK_RATE = { input: 1, output: 3 };

/**
 * @param {string} provider - "gemini" | "openai" | "anthropic" (case-insensitive)
 * @param {string} model
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {number} estimated cost in USD, rounded to 6 decimal places
 */
export function estimateCost(provider, model, inputTokens = 0, outputTokens = 0) {
  const table = PRICING_PER_MILLION_TOKENS[(provider || "").toLowerCase()] || {};
  const rate = table[model] || FALLBACK_RATE;

  const cost = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
  return Math.round(cost * 1e6) / 1e6;
}

export default { estimateCost };
