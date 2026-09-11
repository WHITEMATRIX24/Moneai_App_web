import { readSSELines } from "../../utils/sse.js";

/**
 * openai.provider.js
 *
 * OpenAI implementation of the provider contract in base.provider.js.
 * Uses plain fetch() against the Chat Completions API instead of the
 * `openai` npm package, so swapping providers never means adding/removing
 * dependencies from package.json — only env vars change (Section 5's
 * "change providers without rewriting the application").
 *
 * Env:
 *   AI_OPENAI_API_KEY=sk-...
 *   AI_OPENAI_BASE_URL=https://api.openai.com/v1   (optional override,
 *     e.g. for an Azure OpenAI-compatible endpoint)
 */

const BASE_URL = () => process.env.AI_OPENAI_BASE_URL || "https://api.openai.com/v1";

function apiKey() {
  const key = process.env.AI_OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI provider: AI_OPENAI_API_KEY is not set");
  return key;
}

function toOpenAITools(tools) {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

/** Vendor-neutral messages -> OpenAI chat message array (see base.provider.js). */
function toOpenAIMessages(systemPrompt, messages) {
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI provider error (${res.status}): ${errText.slice(0, 300)}`);
  }
  return res.json();
}

export async function generate({ systemPrompt, messages, model, maxTokens, temperature, tools }) {
  const data = await callChatCompletions({
    model,
    messages: toOpenAIMessages(systemPrompt, messages),
    max_tokens: maxTokens,
    temperature,
    ...(toOpenAITools(tools) ? { tools: toOpenAITools(tools) } : {}),
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({
      model,
      messages: toOpenAIMessages(systemPrompt, messages),
      max_tokens: maxTokens,
      temperature,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });
  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI provider stream error (${res.status}): ${errText.slice(0, 300)}`);
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

export async function embed(text) {
  const res = await fetch(`${BASE_URL()}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({ model: process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small", input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI provider embed error (${res.status})`);
  const data = await res.json();
  return data.data?.[0]?.embedding ?? [];
}

export async function countTokens(text) {
  // OpenAI has no free-standing counting endpoint reachable without the
  // tiktoken package; approximate at ~4 chars/token (documented in
  // base.provider.js's error-contract section as an acceptable fallback).
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
