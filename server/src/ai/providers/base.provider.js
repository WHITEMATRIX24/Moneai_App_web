/**
 * base.provider.js
 *
 * This file has no executable code — it documents the contract every
 * provider in this folder (gemini/openai/anthropic) must implement, so
 * aiProvider.service.js can swap between them (or fall back from one to
 * another) without any other file in the codebase knowing which vendor
 * is actually being called. This is the "Provider abstraction" deliverable
 * from the architecture doc (Section 5/8 of the 4-member doc).
 *
 * ---------------------------------------------------------------------
 * COMMON MESSAGE FORMAT (vendor-neutral — every provider translates this
 * to/from its own wire format internally)
 * ---------------------------------------------------------------------
 * messages: Array<
 *   | { role: "user",      content: string }
 *   | { role: "assistant", content: string }                    // plain text turn
 *   | { role: "assistant", toolCall: { name: string, args: Object } } // model asked for a tool
 *   | { role: "tool",      toolName: string, content: any }      // result of that tool
 * >
 *
 * tools: Array<{ name: string, description: string, parameters: JSONSchema }>
 *   JSONSchema uses the plain { type, properties, required } shape (same
 *   shape the tool declarations in ai/tools/*.js already use minus the
 *   `name`/`description` wrapper) — each provider maps this to its own
 *   function-calling schema.
 *
 * ---------------------------------------------------------------------
 * REQUIRED EXPORTS — every provider module must export all four:
 * ---------------------------------------------------------------------
 *
 * generate({ systemPrompt, messages, model, maxTokens, temperature, tools })
 *   -> Promise<{ text: string, toolCalls: Array<{name,args}>, usage:
 *      {inputTokens,outputTokens,totalTokens}, model: string }>
 *   Non-streaming call. toolCalls is [] when the model just answered in
 *   text. Only ONE round trip — the orchestrator (ai.service.js) is what
 *   loops multiple tool calls by re-invoking generate() with the tool
 *   result appended to `messages` as a role:"tool" entry.
 *
 * stream({ systemPrompt, messages, model, maxTokens, temperature })
 *   -> AsyncGenerator<{type:"token",text} | {type:"done",usage,model}>
 *   Streaming call, text-only (no tool calls mid-stream — matches the
 *   doc's SSE event set of message_start/token/message_complete).
 *
 * embed(text) -> Promise<number[]>
 *   Used for future RAG (Section 36-38 of the doc). Providers that don't
 *   support embeddings (e.g. Anthropic has none of its own) should throw
 *   a clear "not supported" error rather than silently returning [].
 *
 * countTokens(text) -> Promise<number>
 *   Rough token estimate for pre-flight budget checks (utils/tokenBudget.js).
 *   Providers without a native counter may approximate (chars / 4) — see
 *   gemini.provider.js and anthropic.provider.js for the fallback pattern.
 *
 * ---------------------------------------------------------------------
 * ERROR CONTRACT
 * ---------------------------------------------------------------------
 * Providers should throw a plain Error whose `.message` is safe to show
 * in logs. aiProvider.service.js is responsible for catching provider
 * errors and deciding whether to retry against AI_FALLBACK_PROVIDER —
 * individual providers should NOT implement their own fallback logic.
 */

export {};
