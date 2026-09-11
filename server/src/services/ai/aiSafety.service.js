/**
 * aiSafety.service.js
 *
 * Doc Section 52-53 — AI Safety Layer. Two jobs:
 *   1. Before the provider call: validate/sanitize the user's input and
 *      score it for prompt-injection patterns.
 *   2. After the provider call: a light check that the response doesn't
 *      look like it leaked the system prompt or fabricated a refusal of
 *      its own tool boundaries.
 *
 * This is pattern-matching, not a guarantee — real protection is that
 * tool permissions are enforced server-side in aiApplicationTools.service.js
 * regardless of what the model says (Section 53's core rule), so this
 * layer's job is to reduce how often a manipulated model even tries.
 */

const MAX_INPUT_LENGTH = 4000;

// Deliberately generic phrase patterns, not a giant blocklist — matches
// the kind of "ignore previous instructions" / "reveal your prompt" /
// "you are now X" attempts called out by name in Section 53.
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?)/i,
  /reveal\s+(your\s+)?(system\s+prompt|instructions?)/i,
  /show\s+(me\s+)?(your\s+)?(system\s+prompt|instructions?)/i,
  /you\s+are\s+now\s+[a-z0-9 _-]{2,40}/i,
  /forget\s+(you('re| are)|everything)/i,
  /act\s+as\s+(if\s+you\s+(are|were)|an?)\s+/i,
  /pretend\s+(you('re| are)|to\s+be)/i,
  /(reveal|show|give)\s+(me\s+)?(the\s+)?(database|api|admin)\s+(credentials?|key|password)/i,
  /(show|give|list)\s+(me\s+)?(every|all)\s+users?('|s)?\s+(transactions?|data)/i,
  /bypass\s+(confirmation|authorization|security)/i,
];

/**
 * Trims and length-caps user input before it reaches the provider.
 * Prevents pathological giant inputs from blowing the token budget or
 * padding an injection attempt past what a human would type.
 * @param {string} text
 */
export function sanitizeUserInput(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  return trimmed.length > MAX_INPUT_LENGTH ? trimmed.slice(0, MAX_INPUT_LENGTH) : trimmed;
}

/**
 * @param {string} text
 * @returns {{flagged: boolean, matches: string[]}}
 */
export function detectPromptInjection(text) {
  if (!text) return { flagged: false, matches: [] };
  const matches = INJECTION_PATTERNS.filter((re) => re.test(text)).map((re) => re.source);
  return { flagged: matches.length > 0, matches };
}

/**
 * Best-effort check that a generated response doesn't look like it
 * leaked the system prompt verbatim (a common injection "success"
 * signal) or start reciting security-rule text back at the user.
 * @param {string} text
 */
export function validateOutput(text) {
  if (!text) return { safe: true, reason: null };
  if (/you are mone ai, the personal intelligence assistant/i.test(text) && text.length > 200) {
    return { safe: false, reason: "response appears to echo the system prompt" };
  }
  return { safe: true, reason: null };
}

/**
 * Strips obvious secrets/PII-shaped tokens from text before it's logged
 * to AIUsage/console (Section 51: "Do not log full sensitive financial
 * information unnecessarily", Section 50: never send credentials/tokens
 * anywhere unnecessary).
 * @param {string} text
 */
export function redactForLogging(text) {
  if (!text) return text;
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[redacted-email]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[redacted-number]")
    .replace(/\b(sk|pk)-[A-Za-z0-9]{16,}\b/g, "[redacted-key]");
}

/**
 * Convenience wrapper the orchestrator calls once per inbound message.
 * Returns a safe-to-use string and a flag telling the caller whether to
 * short-circuit with a generic refusal instead of calling the provider.
 * A flagged message is NOT silently discarded — the safety prompt in
 * safety.prompt.js is the primary defense; this just gives the
 * orchestrator a signal for logging/rate-limit tightening. We do not
 * hard-block on a heuristic match alone, since false positives on
 * legitimate finance/security questions ("what's my account's security
 * question") are common; the system prompt handles the actual refusal.
 * @param {string} rawInput
 */
export function screenInput(rawInput) {
  const text = sanitizeUserInput(rawInput);
  const injection = detectPromptInjection(text);
  return { text, flagged: injection.flagged, matches: injection.matches };
}

/**
 * Screens a fact before it's written to AIUserMemory (Doc Section 16's
 * "avoid storing highly sensitive information unnecessarily" — this is
 * the content check aiMemory.service.js's header says belongs here,
 * now that something actually calls remember()). Pattern-matching only,
 * same caveat as the rest of this file: it catches obvious cases, it
 * is not a guarantee, and callers should still only ever pass
 * explicitly user-stated, low-sensitivity preferences through in the
 * first place.
 * @param {{key: string, value: string}} fact
 * @returns {{safe: boolean, reason: string|null}}
 */
const SENSITIVE_MEMORY_PATTERNS = [
  // Card/account-number-shaped strings, same regex family as redactForLogging.
  { re: /\b(?:\d[ -]*?){13,19}\b/, reason: "value looks like a card or account number" },
  { re: /\b(sk|pk)-[A-Za-z0-9]{16,}\b/, reason: "value looks like an API key" },
  { re: /password|passwd|pwd/i, reason: "key/value mentions a password" },
  { re: /\b(ssn|social security|aadha?ar|pan\s*card)\b/i, reason: "key/value mentions a government ID" },
  {
    re: /\b(diagnos(is|ed)|disease|disorder|medication|prescri(bed|ption)|hiv|cancer|depression|anxiety disorder)\b/i,
    reason: "key/value looks like a health condition, not a preference",
  },
];

export function screenMemoryFact({ key, value }) {
  const combined = `${key || ""} ${value || ""}`;
  for (const { re, reason } of SENSITIVE_MEMORY_PATTERNS) {
    if (re.test(combined)) return { safe: false, reason };
  }
  if ((value || "").length > 300) {
    return { safe: false, reason: "value is too long for a durable preference (possible data dump)" };
  }
  return { safe: true, reason: null };
}

export default { sanitizeUserInput, detectPromptInjection, validateOutput, redactForLogging, screenInput, screenMemoryFact };
