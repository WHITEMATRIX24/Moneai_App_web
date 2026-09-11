import AIUsage from "../../models/AIUsage.js";
import { estimateCost } from "../../utils/aiCost.js";

/**
 * aiUsage.service.js — named in Doc Section 6's services/ai/ list but,
 * until now, never existed as its own file: every controller handler in
 * ai.controller.js called `AIUsage.create({...})` directly (7 call
 * sites, each repeating the same provider/model/token/cost/latency
 * shape — see CHANGES.md's "Latency + cost tracking" entry). This pulls
 * that repeated shape into the doc-named service, matching Section 41's
 * "Token Usage" tracking list (input/output/total tokens, model,
 * provider, estimated cost, latency, feature, user, conversation) and
 * Section 48's error-monitoring needs (successful/errorCode).
 */

/**
 * Records one successful AI request. Mirrors the exact fields every
 * controller call site was already passing — this only moves the
 * `AIUsage.create` + `estimateCost` pairing into one place.
 * @param {Object} options
 * @param {string} options.userId
 * @param {string} options.model
 * @param {string} options.provider
 * @param {string} options.requestType - CHAT | CHAT_TOOL | CHAT_TOOL_CONFIRMED | CHAT_STREAM
 * @param {{inputTokens:number, outputTokens:number, totalTokens:number}} options.usage
 * @param {number} [options.latencyMs=0]
 */
export async function recordUsage({ userId, model, provider, requestType, usage, latencyMs = 0 }) {
  return AIUsage.create({
    userId,
    model,
    provider,
    requestType,
    promptTokens: usage.inputTokens,
    completionTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    estimatedCost: estimateCost(provider, model, usage.inputTokens, usage.outputTokens),
    latencyMs,
  });
}

/**
 * Doc Section 48 — AI Error Monitoring. Logs a failed request so the
 * admin error-rate/error-table analytics have something to show. Never
 * throws — a logging failure must not mask the original error.
 * @param {string} userId
 * @param {string} requestType
 * @param {string} errorCode
 */
export async function recordFailure(userId, requestType, errorCode) {
  try {
    await AIUsage.create({ userId, requestType, successful: false, errorCode });
  } catch {
    /* logging is best-effort */
  }
}

export default { recordUsage, recordFailure };
