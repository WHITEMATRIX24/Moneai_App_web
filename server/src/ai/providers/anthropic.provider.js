import { readSSELines } from "../../utils/sse.js";

/**
 * anthropic.provider.js
 *
 * Anthropic implementation of the provider contract in base.provider.js.
 * Uses plain fetch() against /v1/messages instead of the @anthropic-ai/sdk
 * package, matching the dependency-free approach used in openai.provider.js.
 *
 * Env:
 *   AI_ANTHROPIC_API_KEY=sk-ant-...
 *   AI_ANTHROPIC_VERSION=2023-06-01   (optional override)
 */

const BASE_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = () => process.env.AI_ANTHROPIC_VERSION || "2023-06-01";

function apiKey() {
  const key = process.env.AI_ANTHROPIC_API_KEY;
  if (!key) throw new Error("Anthropic provider: AI_ANTHROPIC_API_KEY is not set");
  return key;
}

function headers() {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey(),
    "anthropic-version": ANTHROPIC_VERSION(),
  };
}

function toAnthropicTools(tools) {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters }));
}

/**
 * Vendor-neutral messages -> Anthropic's messages array. Anthropic
 * represents both a tool call and its result as *content blocks* inside
 * a single user/assistant message rather than separate turns, so
 * consecutive tool role/toolCall entries get merged the way the API
 * expects.
 */
function toAnthropicMessages(messages) {
  const out = [];
  for (const m of messages) {
    if (m.role === "tool") {
      out.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: m.toolName, content: JSON.stringify(m.content ?? {}) }],
      });
      continue;
    }
    if (m.role === "assistant" && m.toolCall) {
      out.push({
        role: "assistant",
        content: [{ type: "tool_use", id: m.toolCall.name, name: m.toolCall.name, input: m.toolCall.args || {} }],
      });
      continue;
    }
    out.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content || "" });
  }
  return out;
}

async function callMessages(body) {
  const res = await fetch(BASE_URL, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic provider error (${res.status}): ${errText.slice(0, 300)}`);
  }
  return res.json();
}

export async function generate({ systemPrompt, messages, model, maxTokens, temperature, tools }) {
  const data = await callMessages({
    model,
    system: systemPrompt,
    messages: toAnthropicMessages(messages),
    max_tokens: maxTokens,
    temperature,
    ...(toAnthropicTools(tools) ? { tools: toAnthropicTools(tools) } : {}),
  });

  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const toolCalls = (data.content || [])
    .filter((b) => b.type === "tool_use")
    .map((b) => ({ name: b.name, args: b.input || {} }));

  return {
    text,
    toolCalls,
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    },
    model: data.model || model,
  };
}

export async function* stream({ systemPrompt, messages, model, maxTokens, temperature }) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: toAnthropicMessages(messages),
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic provider stream error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  for await (const payload of readSSELines(res)) {
    const json = safeJsonParse(payload);
    if (!json) continue;
    if (json.type === "content_block_delta" && json.delta?.text) {
      yield { type: "token", text: json.delta.text };
    }
    if (json.type === "message_start" && json.message?.usage) {
      usage.inputTokens = json.message.usage.input_tokens ?? 0;
    }
    if (json.type === "message_delta" && json.usage) {
      usage.outputTokens = json.usage.output_tokens ?? 0;
      usage.totalTokens = usage.inputTokens + usage.outputTokens;
    }
  }
  yield { type: "done", usage, model };
}

export async function embed() {
  // Anthropic does not offer an embeddings endpoint — callers should
  // route embedding requests to a different configured provider.
  throw new Error("Anthropic provider does not support embeddings; set AI_EMBEDDING_PROVIDER to another provider.");
}

export async function countTokens(text) {
  // No free-standing counting endpoint used here — approximate.
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
