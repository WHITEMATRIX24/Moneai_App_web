/**
 * aiModelRouter.service.js
 *
 * Doc Section 7 — Multi-Model Routing / Request Classifier. Not every
 * message needs the expensive reasoning model: greetings, short
 * confirmations, and simple single-field lookups route to the fast
 * tier; anything requiring analysis, multi-step reasoning, or a
 * write-tool proposal routes to primary.
 *
 * Deliberately a cheap heuristic classifier (regex/keyword + length),
 * not a model call — spending an LLM round trip just to decide which
 * LLM to use would defeat the latency/cost purpose of having a fast
 * tier at all (Section 6's "Latency/cost" priority for the fast model).
 */

const FAST_INTENT_PATTERNS = [
  /^(hi|hello|hey|yo|sup|good (morning|evening|afternoon))\b/i,
  /^(thanks|thank you|ok|okay|cool|got it|nice|great)\b/i,
  /^(what('s| is) my (name|currency|plan|subscription))\b/i,
  /^(what are my tasks|show my tasks|list my todos|what's on my (list|plate))/i,
  /^(yes|no|confirm|cancel)\b/i,
];

const COMPLEX_INTENT_PATTERNS = [
  /analy[sz]e|analysis|trend|compare|projection|forecast/i,
  /(save|saving)\s+(more|money)|where can i (save|cut)/i,
  /plan (my|the) (day|week|month|budget)/i,
  /multi[- ]?step|and then|after that/i,
];

const FAST_MAX_LENGTH = 40; // short messages with no complex-intent match lean fast

/**
 * @param {string} userMessage
 * @param {{hasCandidateTools?: boolean}} [options] - true when the tool
 *   registry contains a plausible match (write tools especially always
 *   deserve primary-tier reasoning per Section 6's "multi-step queries")
 * @returns {"fast"|"primary"}
 */
export function classifyTier(userMessage, { hasCandidateTools = false } = {}) {
  const text = (userMessage || "").trim();
  if (!text) return "fast";

  if (COMPLEX_INTENT_PATTERNS.some((re) => re.test(text))) return "primary";
  if (hasCandidateTools) return "primary"; // tool orchestration always gets the reasoning model
  if (FAST_INTENT_PATTERNS.some((re) => re.test(text))) return "fast";
  if (text.length <= FAST_MAX_LENGTH && text.split(/\s+/).length <= 8) return "fast";

  return "primary";
}

/**
 * Convenience helper for conversation titles / short summaries — always
 * fast tier per Section 6 ("Chat titles" is a named fast-model example).
 */
export function classificationTier() {
  return "fast";
}

export default { classifyTier, classificationTier };
