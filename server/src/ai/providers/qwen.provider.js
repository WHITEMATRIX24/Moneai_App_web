import { readSSELines } from "../../utils/sse.js";

/**
 * qwen.provider.js
 *
 * Qwen implementation of the provider contract in base.provider.js,
 * routed through OpenRouter rather than Alibaba's own DashScope API.
 *
 * Why OpenRouter and not Alibaba direct: Alibaba's own free tier is a
 * one-time ~70M token trial that runs out — not a standing free tier.
 * OpenRouter's `:free`-tagged Qwen models cost $0 indefinitely (capped
 * at 50 requests/day, 20/minute — rising to 1,000/day if the account
 * ever adds $10+ in credits at any point, a one-time threshold that
 * doesn't expire). Given this project's actual constraint is "no paid
 * key available," indefinite-free beats trial-then-billed. OpenRouter
 * also exposes an OpenAI-compatible endpoint, so this file is almost
 * identical in shape to openai.provider.js rather than needing a new
 * wire format.
 *
 * IMPORTANT — free model IDs on OpenRouter rotate without much notice
 * (providers add/drop `:free` listings). The default below was verified
 * live as of September 2026, but before relying on it, check
 * https://openrouter.ai/models?max_price=0 and set AI_QWEN_PRIMARY_MODEL
 * / AI_QWEN_FAST_MODEL explicitly if the default has moved on.
 *
 * Env:
 *   AI_QWEN_API_KEY=sk-or-...      (an OpenRouter key, not an Alibaba one —
 *                                    Qwen is being reached THROUGH OpenRouter)
 *   AI_QWEN_BASE_URL=https://openrouter.ai/api/v1   (optional override)
 *   AI_QWEN_PRIMARY_MODEL / AI_QWEN_FAST_MODEL       (optional override —
 *     see aiProvider.service.js's DEFAULT_MODELS.qwen for the built-in default)
 *   AI_QWEN_APP_URL / AI_QWEN_APP_NAME   (optional — OpenRouter's
 *     HTTP-Referer/X-Title headers, used only for OpenRouter's own
 *     leaderboard attribution, safe to leave unset)
 */

const BASE_URL = () => process.env.AI_QWEN_BASE_URL || "https://openrouter.ai/api/v1";

function apiKey() {
  const key = process.env.AI_QWEN_API_KEY;
  if (!key) throw new Error("Qwen provider: AI_QWEN_API_KEY is not set (this should be an OpenRouter key)");
  return key;
}

function headers() {
  const h = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` };
  // Optional OpenRouter attribution headers — safe to omit entirely.
  if (process.env.AI_QWEN_APP_URL) h["HTTP-Referer"] = process.env.AI_QWEN_APP_URL;
  if (process.env.AI_QWEN_APP_NAME) h["X-Title"] = process.env.AI_QWEN_APP_NAME;
  return h;
}

function toQwenTools(tools) {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

/** Vendor-neutral messages -> OpenAI-compatible chat message array (see base.provider.js). */
function toQwenMessages(systemPrompt, messages) {
  const out = [{ role: "system", content: systemPrompt }];
  for (const m of messages) {
    if (m.role === "tool") {
      out.push({ role: "tool", tool_call_id: m.toolName, content: JSON.stringify(m.content ?? {}) });
      continue;
    }
    if (m.role === "assistant" && m.toolCall) {
      out.push({
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: m.toolCall.name,
            type: "function",
            function: { name: m.toolCall.name, arguments: JSON.stringify(m.toolCall.args || {}) },
          },
        ],
      });
      continue;
    }
    out.push({ role: m.role, content: m.content || "" });
  }
  return out;
}

async function callChatCompletions(body) {
  const res = await fetch(`${BASE_URL()}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // OpenRouter's free-tier 429 body names the specific limit hit
    // (per-minute vs per-day) — worth surfacing rather than truncating
    // away, since it tells the caller whether retrying in 1 minute vs
    // waiting until tomorrow is the right move.
    throw new Error(`Qwen (OpenRouter) provider error (${res.status}): ${errText.slice(0, 300)}`);
  }
  return res.json();
}

export async function generate({ systemPrompt, messages, model, maxTokens, temperature, tools }) {
  const data = await callChatCompletions({
    model,
    messages: toQwenMessages(systemPrompt, messages),
    max_tokens: maxTokens,
    temperature,
    ...(toQwenTools(tools) ? { tools: toQwenTools(tools) } : {}),
  });

  const choice = data.choices?.[0]?.message || {};
  const toolCalls = (choice.tool_calls || []).map((tc) => ({
    name: tc.function?.name,
    args: safeJsonParse(tc.function?.arguments),
  }));

  return {
    text: choice.content || "",
    toolCalls,
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
    model: data.model || model,
  };
}

export async function* stream({ systemPrompt, messages, model, maxTokens, temperature }) {
  const res = await fetch(`${BASE_URL()}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model,
      messages: toQwenMessages(systemPrompt, messages),
      max_tokens: maxTokens,
      temperature,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });
  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Qwen (OpenRouter) provider stream error (${res.status}): ${errText.slice(0, 300)}`);
  }

  let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  for await (const payload of readSSELines(res)) {
    if (payload === "[DONE]") continue;
    const json = safeJsonParse(payload);
    if (!json) continue;
    const delta = json.choices?.[0]?.delta?.content;
    if (delta) yield { type: "token", text: delta };
    if (json.usage) {
      usage = {
        inputTokens: json.usage.prompt_tokens ?? 0,
        outputTokens: json.usage.completion_tokens ?? 0,
        totalTokens: json.usage.total_tokens ?? 0,
      };
    }
  }
  yield { type: "done", usage, model };
}

export async function embed() {
  // OpenRouter's free tier doesn't carry a free embedding model, and
  // Alibaba's own embedding endpoint isn't reachable through this
  // provider (it's a different base URL/auth than chat completions).
  // Per base.provider.js's contract, providers without embedding
  // support throw rather than silently returning []. RAG isn't wired
  // into anything yet (Phase 5 scope), so nothing calls this today —
  // if that changes, route embeddings through AI_EMBEDDING_PROVIDER
  // pointed at gemini instead (see aiProvider.service.js's embed()).
  throw new Error("Qwen provider (via OpenRouter): embeddings are not supported by this provider");
}

export async function countTokens(text) {
  // No free-standing counting endpoint on OpenRouter's free tier;
  // approximate at ~4 chars/token, same fallback openai.provider.js uses.
  return Math.ceil((text || "").length / 4);
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export default { generate, stream, embed, countTokens };
