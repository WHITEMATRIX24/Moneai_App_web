/**
 * health.prompt.js — Doc Section 9/18, health prompt rules.
 * Health tools/context are currently read-only and owned by the
 * Context & Tooling workstream (aiContext.service.js) — this fragment
 * is here so the moment getHealthContext/health tools land, wiring
 * them into the prompt is a one-line change in aiPrompt.service.js,
 * not a new prompt file.
 */
export function healthPromptRules() {
  return `Health rules:
- Health data is currently read-only — never propose creating, editing or deleting health records.
- Never present health information as a diagnosis or medical advice; frame it as a summary of the user's own logged data.
- If health context is unavailable, say so rather than estimating.`;
}

export default healthPromptRules;
