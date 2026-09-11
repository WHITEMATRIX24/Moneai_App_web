import { getProvider } from "../../ai/providers/index.js";

/**
 * aiProvider.service.js
 *
 * Vendor-neutral entry point for LLM calls (doc Section 5/8 — "Provider
 * abstraction and provider implementations", "Model/provider fallback").
 * Nothing outside this file (and providers/index.js) should ever import
 * a specific vendor SDK or know which one is configured — swapping
 * OpenAI/Gemini/Anthropic, or adding a fallback, is a .env change only.
 *
 * UPGRADED from a single primary+fallback pair to a full ordered
 * provider CHAIN, with AUTO-DETECTION as the default: leave
 * AI_FALLBACK_PROVIDERS unset and every provider that has an API key
 * configured is automatically tried, in priority order, the moment the
 * primary fails — add a new key later and it's used immediately, no
 * .env line to remember to update. Set AI_FALLBACK_PROVIDERS explicitly
 * only if you want to force a specific order or exclude a configured
 * provider from ever being used as a fallback. Any provider with no
 * API key set is always skipped instantly either way (no wasted
 * network round trip on something that can never succeed). See
 * resolveProviderChain() below.
 *
 * Required env vars (server/.env):
 *   AI_PROVIDER=gemini|openai|anthropic|qwen        (primary — tried first)
 *   AI_FALLBACK_PROVIDERS=                          (leave empty/unset to
 *     auto-detect every provider with a key; set e.g. "qwen,openai" to
 *     force a specific order/subset instead)
 *   AI_FALLBACK_PROVIDER=qwen                        (older single-value
 *     form, still honored the same way if AI_FALLBACK_PROVIDERS isn't set)
 *   AI_PRIMARY_MODEL / AI_FAST_MODEL / AI_EMBEDDING_MODEL   (generic defaults)
 *   AI_<PROVIDER>_PRIMARY_MODEL / _FAST_MODEL / _EMBEDDING_MODEL  (per-provider
 *     override, e.g. AI_OPENAI_PRIMARY_MODEL=gpt-4o — takes precedence)
 *   AI_MAX_TOKENS=4000
 *   AI_TEMPERATURE=0.3
 *   AI_API_KEY / AI_GEMINI_API_KEY, AI_OPENAI_API_KEY, AI_ANTHROPIC_API_KEY,
 *   AI_QWEN_API_KEY (an OpenRouter key — see qwen.provider.js)
 */

const DEFAULT_MODELS = {
  gemini: { primary: "gemini-2.5-flash", fast: "gemini-2.0-flash-lite", embedding: "text-embedding-004" },
  openai: { primary: "gpt-4o", fast: "gpt-4o-mini", embedding: "text-embedding-3-small" },
  anthropic: { primary: "claude-sonnet-4-6", fast: "claude-haiku-4-5", embedding: null },
  // Free-tier model IDs on OpenRouter rotate — verified live as of Sept
  // 2026 (see qwen.provider.js's header comment). Override with
  // AI_QWEN_PRIMARY_MODEL / AI_QWEN_FAST_MODEL if these have moved on.
  qwen: { primary: "qwen/qwen3.6-plus:free", fast: "qwen/qwen3-8b:free", embedding: null },
};

const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 4000);
const TEMPERATURE = Number(process.env.AI_TEMPERATURE || 0.3);

function primaryProviderName() {
  return (process.env.AI_PROVIDER || "gemini").toLowerCase();
}

/**
 * Ordered list of fallback provider names, most-preferred first.
 *
 * If AI_FALLBACK_PROVIDERS (or the older single-value
 * AI_FALLBACK_PROVIDER) is explicitly set, that exact list/order is
 * used as an override — e.g. if you want a specific order, or want to
 * deliberately exclude a configured provider from ever being used as
 * a fallback. Returns null (not []) when nothing is set, so
 * resolveProviderChain() below can tell "explicitly configured" apart
 * from "nothing set, auto-detect."
 */
function explicitFallbackProviderNames() {
  const raw = process.env.AI_FALLBACK_PROVIDERS || process.env.AI_FALLBACK_PROVIDER || "";
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? list : null;
}

/**
 * Whether a provider has an API key configured, checked without making
 * any network call. Used to skip a fallback candidate instantly instead
 * of burning a request (and real latency) on something that's certain
 * to fail with "X_API_KEY is not set" — that's a config problem, not a
 * capacity problem, and shouldn't cost the user a round trip to learn.
 * Keep this in sync with each provider file's own apiKey()/getClient().
 */
function hasCredentials(providerName) {
  switch (providerName) {
    case "gemini":
      return Boolean(process.env.AI_GEMINI_API_KEY || process.env.AI_API_KEY);
    case "openai":
      return Boolean(process.env.AI_OPENAI_API_KEY);
    case "anthropic":
      return Boolean(process.env.AI_ANTHROPIC_API_KEY);
    case "qwen":
      return Boolean(process.env.AI_QWEN_API_KEY);
    default:
      return false;
  }
}

/**
 * Builds the ordered list of providers to actually attempt.
 *
 * Primary always goes first (even without a credentials check here —
 * if it's missing a key, its own generate()/stream() throws a clear
 * error immediately, before any network call, so nothing is wasted by
 * still listing it first).
 *
 * For what comes after primary, there are two modes:
 *
 * 1. EXPLICIT (AI_FALLBACK_PROVIDERS or AI_FALLBACK_PROVIDER is set):
 *    use exactly that list/order, skipping any entry with no key.
 *
 * 2. AUTO-DETECT (neither is set — this is now the default): every
 *    known provider OTHER than primary that has a configured API key
 *    is automatically added as a fallback candidate, in
 *    PROVIDER_PRIORITY_ORDER below. This is the actual point of a
 *    fallback chain — the whole reason to add a second API key is so
 *    it gets used automatically the moment the primary is unavailable,
 *    without also having to remember to edit a separate env line
 *    every time a new key is added. If you add an OpenAI key next
 *    month, it's used the moment Gemini fails, with zero .env changes
 *    beyond adding the key itself.
 *
 * PROVIDER_PRIORITY_ORDER is only the tie-breaker for auto-detect mode
 * when more than one non-primary provider has a key — it is NOT a
 * hardcoded "always use this one" choice; whichever of these actually
 * HAS a key wins a slot in the chain, in this relative order.
 */
const PROVIDER_PRIORITY_ORDER = ["anthropic", "openai", "gemini", "qwen"];

function resolveProviderChain() {
  const primary = primaryProviderName();
  const seen = new Set([primary]);
  const chain = [primary];

  const explicit = explicitFallbackProviderNames();

  if (explicit) {
    for (const name of explicit) {
      if (seen.has(name)) continue;
      seen.add(name);
      if (hasCredentials(name)) {
        chain.push(name);
      } else {
        console.warn(`AI fallback provider "${name}" is configured but has no API key set — skipping it.`);
      }
    }
  } else {
    // Auto-detect: consider every provider with a key, in priority
    // order, regardless of which specific ones happen to be present.
    for (const name of PROVIDER_PRIORITY_ORDER) {
      if (seen.has(name)) continue;
      seen.add(name);
      if (hasCredentials(name)) chain.push(name);
    }
  }

  return chain;
}

/**
 * Resolves a model name for a given provider + tier, checking a
 * per-provider override first, then the generic var, then the built-in
 * default table above.
 * @param {string} providerName
 * @param {"fast"|"primary"} tier
 */
function resolveModel(providerName, tier) {
  const upper = providerName.toUpperCase();
  const perProviderKey = tier === "fast" ? `AI_${upper}_FAST_MODEL` : `AI_${upper}_PRIMARY_MODEL`;
  const genericKey = tier === "fast" ? "AI_FAST_MODEL" : "AI_PRIMARY_MODEL";
  return (
    process.env[perProviderKey] ||
    process.env[genericKey] ||
    DEFAULT_MODELS[providerName]?.[tier] ||
    DEFAULT_MODELS.gemini[tier]
  );
}

function resolveEmbeddingModel(providerName) {
  const upper = providerName.toUpperCase();
  return (
    process.env[`AI_${upper}_EMBEDDING_MODEL`] ||
    process.env.AI_EMBEDDING_MODEL ||
    DEFAULT_MODELS[providerName]?.embedding
  );
}

/**
 * Runs `fn` against each provider in resolveProviderChain(), in order,
 * stopping at the first success. Every attempt is logged so admin error
 * analytics can see which provider actually served each request via the
 * `providerUsed`/`fallbackUsed` fields tacked onto the result.
 *
 * Also times the whole call (including any failed attempts before a
 * successful one further down the chain, since that's real latency the
 * user experienced) and tacks the result onto `latencyMs` — this is
 * what feeds AIUsage's latency column and the admin "Average Response
 * Time" KPI (Section 44).
 * @param {(providerName: string) => Promise<Object>} fn
 */
async function withProviderChain(fn) {
  const startedAt = Date.now();
  const chain = resolveProviderChain();
  let lastErr = null;

  for (let i = 0; i < chain.length; i++) {
    const providerName = chain[i];
    try {
      const result = await fn(providerName);
      return { ...result, providerUsed: providerName, fallbackUsed: i > 0, latencyMs: Date.now() - startedAt };
    } catch (err) {
      lastErr = err;
      const next = chain[i + 1];
      console.error(
        `AI provider "${providerName}" failed${next ? `, trying next in chain ("${next}")` : " — no more providers configured/available"}:`,
        err.message,
      );
    }
  }

  if (lastErr) {
    lastErr.message = `All configured AI providers failed. Chain tried: [${chain.join(" → ")}]. Last error: ${lastErr.message}`;
    throw lastErr;
  }
  throw new Error("No AI provider is configured (set AI_PROVIDER and/or AI_FALLBACK_PROVIDERS).");
}

/**
 * Non-streaming generation.
 * @param {Object} options
 * @param {string} options.systemPrompt
 * @param {Array} options.messages - see base.provider.js for the shape
 * @param {"fast"|"primary"} [options.tier="primary"]
 * @param {Array<{name,description,parameters}>} [options.tools]
 * @returns {Promise<{text, toolCalls, usage, model, providerUsed, fallbackUsed}>}
 */
export async function generate({ systemPrompt, messages, tier = "primary", tools }) {
  return withProviderChain((providerName) => {
    const provider = getProvider(providerName);
    return provider.generate({
      systemPrompt,
      messages,
      tools,
      model: resolveModel(providerName, tier),
      maxTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    });
  });
}

/**
 * Streaming generation, now WITH provider-chain fallback — but only
 * for the window before any token has reached the client. Once a chunk
 * has actually been yielded out of this generator, we're committed to
 * that provider for the rest of the response: swapping mid-stream would
 * mean the client either sees a garbled mix of two providers' wording,
 * or has to discard and restart what it already rendered — both worse
 * than just failing. So each candidate provider gets exactly one chance
 * to produce its *first* chunk (token or done); if that first `.next()`
 * call throws, or the provider's stream ends with nothing at all, this
 * moves on to the next provider in the chain with zero client-visible
 * impact — the user never sees the failed attempt, no delay beyond the
 * failed call's own timeout. Once a provider successfully produces a
 * first chunk, it owns the rest of the response.
 * @param {Object} options - same shape as generate() (no tools — text only)
 * @returns {AsyncGenerator<{type:"token",text}|{type:"done",usage,model,providerUsed}>}
 */
export async function* stream({ systemPrompt, messages, tier = "primary" }) {
  const startedAt = Date.now();
  const chain = resolveProviderChain();
  let lastErr = null;

  for (let i = 0; i < chain.length; i++) {
    const providerName = chain[i];
    const provider = getProvider(providerName);
    const model = resolveModel(providerName, tier);

    const gen = provider.stream({
      systemPrompt,
      messages,
      model,
      maxTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    });

    let first;
    try {
      first = await gen.next();
    } catch (err) {
      // Nothing reached the client yet — safe to try the next provider.
      lastErr = err;
      const next = chain[i + 1];
      console.error(
        `AI stream provider "${providerName}" failed before producing any output${next ? `, trying next in chain ("${next}")` : " — no more providers configured/available"}:`,
        err.message,
      );
      continue;
    }

    if (first.done) {
      // Generator ended immediately with nothing at all — treat like a
      // failure and try the next provider, same reasoning as above.
      lastErr = lastErr || new Error(`Provider "${providerName}" produced no output`);
      continue;
    }

    // We have real output — commit to this provider for the rest of
    // the response. From here on, any error is a genuine mid-stream
    // failure and propagates as-is (no more provider swapping).
    if (i > 0) {
      console.error(`AI stream recovered using fallback provider "${providerName}" after ${i} earlier failure(s).`);
    }

    const emit = (chunk) =>
      chunk.type === "done" ? { ...chunk, providerUsed: providerName, latencyMs: Date.now() - startedAt } : chunk;

    yield emit(first.value);
    for await (const chunk of gen) {
      yield emit(chunk);
    }
    return;
  }

  throw lastErr || new Error("No AI provider is configured (set AI_PROVIDER and/or AI_FALLBACK_PROVIDERS).");
}

/**
 * Embeddings for future RAG use (doc Section 36-38). Set
 * AI_EMBEDDING_PROVIDER if the primary chat provider doesn't offer
 * embeddings (e.g. primary=anthropic, embeddings via openai).
 * @param {string} text
 */
export async function embed(text) {
  const providerName = (process.env.AI_EMBEDDING_PROVIDER || primaryProviderName()).toLowerCase();
  const provider = getProvider(providerName);
  return provider.embed(text, resolveEmbeddingModel(providerName));
}

/**
 * Rough token estimate for pre-flight budget checks (utils/tokenBudget.js).
 * @param {string} text
 */
export async function countTokens(text) {
  const providerName = primaryProviderName();
  return getProvider(providerName).countTokens(text, resolveModel(providerName, "primary"));
}

/**
 * Backward-compatible helper for the legacy stateless /chat/tools flow:
 * second half of a tool-calling round trip using the vendor-neutral
 * message format (see base.provider.js). Prefer building the `messages`
 * array yourself and calling generate() directly for new code — this
 * wraps that pattern for the one caller (ai.service.js's legacy
 * sendMessageWithTools/confirmMessage) that still expects a single
 * (call, toolResult) pair instead of a full message history.
 * @param {Object} options
 * @param {string} options.systemPrompt
 * @param {string} options.userMessage
 * @param {{name: string, args: Object}} options.call
 * @param {*} options.toolResult
 * @param {"fast"|"primary"} [options.tier="primary"]
 */
export async function generateWithFunctionResult({ systemPrompt, userMessage, call, toolResult, tier = "primary" }) {
  return generate({
    systemPrompt,
    tier,
    messages: [
      { role: "user", content: userMessage },
      // Pass `call` through whole, not just {name, args} — Gemini needs
      // call.thoughtSignature echoed back on this turn's functionCall
      // part or it 400s (see gemini.provider.js's toGeminiContents).
      { role: "assistant", toolCall: call },
      { role: "tool", toolName: call.name, content: toolResult },
    ],
  });
}

export default { generate, stream, embed, countTokens, generateWithFunctionResult };
