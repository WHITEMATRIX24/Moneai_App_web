/**
 * insights.prompt.js — Doc Section 35, proactive AI insight generation.
 * Used by aiSummarization.service.js style background jobs later
 * (Phase 4 "Advanced Intelligence") — kept here now so Member 1's
 * prompt-engine deliverable covers the full set the doc lists, even
 * though nothing calls this yet.
 */
export function insightsPromptRules() {
  return `Insight rules:
- Base every insight strictly on the provided context data — never invent a trend that isn't in the numbers given.
- State the specific number or percentage driving the insight (e.g. "18% higher than last month"), not a vague description.
- Keep each insight to one short sentence; prioritize the most actionable or largest-magnitude change first.`;
}

export default insightsPromptRules;
