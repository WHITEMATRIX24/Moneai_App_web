import { GoogleGenAI } from "@google/genai";

/**
 * gemini.provider.js
 *
 * Google Gemini implementation of the provider contract in base.provider.js.
 * This used to be the entire content of aiProvider.service.js — it's been
 * pulled out here so that file can become a thin router across providers
 * instead of being locked to one vendor.
 */

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.AI_API_KEY && !process.env.AI_GEMINI_API_KEY) {
      throw new Error("Gemini provider: AI_API_KEY (or AI_GEMINI_API_KEY) is not set");
    }
    client = new GoogleGenAI({
      apiKey: process.env.AI_GEMINI_API_KEY || process.env.AI_API_KEY,
    });
  }
  return client;
}

function toGeminiTools(tools) {
  if (!tools || tools.length === 0) return undefined;
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parametersJsonSchema: t.parameters,
      })),
    },
  ];
}

/**
 * Translates the vendor-neutral message array (see base.provider.js) into
 * Gemini's `contents` shape, including function call / function response
 * parts for tool turns. This is what lets the orchestrator do multi-step
 * tool loops without knowing Gemini's wire format.
 */
function toGeminiContents(messages) {
  const contents = [];
  for (const m of messages) {
    if (m.role === "tool") {
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: m.toolName, response: { result: m.content } } }],
      });
      continue;
    }
    if (m.role === "assistant" && m.toolCall) {
      // Gemini 2.5+/3 attaches a `thoughtSignature` to the functionCall
      // part it returns, and validates on replay that the exact same
      // signature comes back on the *current* turn's functionCall parts
      // (see https://ai.google.dev/gemini-api/docs/thought-signatures).
      // Drop it here and you get a 400 "missing thought_signature" the
      // moment a tool result is sent back — which is what was happening.
      contents.push({
        role: "model",
        parts: [
          {
            functionCall: { name: m.toolCall.name, args: m.toolCall.args },
            ...(m.toolCall.thoughtSignature ? { thoughtSignature: m.toolCall.thoughtSignature } : {}),
          },
        ],
      });
      continue;
    }
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content || "" }],
    });
  }
  return contents;
}

function extractUsage(response) {
  return {
    inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
  };
}

export async function generate({ systemPrompt, messages, model, maxTokens, temperature, tools }) {
  const response = await getClient().models.generateContent({
    model,
    contents: toGeminiContents(messages),
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
      temperature,
      ...(toGeminiTools(tools) ? { tools: toGeminiTools(tools) } : {}),
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];

  // BUGFIX: this used to read `response.text` (the SDK's getter) for
  // the text field below. That getter does exactly the same part-walk
  // as the toolCalls extraction right after it — but ALSO does a
  // console.warn("there are non-text parts functionCall in the
  // response...") every single time a functionCall part is present,
  // i.e. on every tool-calling turn. Since tool calling is this app's
  // main feature, that warning was firing constantly and cluttering
  // production logs with something that looks like an error but isn't
  // — toolCalls were always being extracted correctly from `parts`
  // regardless. Building text from the same `parts` array we already
  // have avoids touching the noisy getter, while matching its actual
  // behavior (skip `thought` parts, concatenate the rest).
  let text = "";
  for (const part of parts) {
    if (typeof part.text === "string" && !part.thought) text += part.text;
  }

  // Only the first functionCall part in a parallel-call response actually
  // carries the thoughtSignature (Gemini attaches it once per turn, not
  // per call) — capture whatever's on each part and let it be undefined
  // where absent rather than guessing.
  const toolCalls = parts
    .filter((p) => p.functionCall)
    .map((p) => ({
      name: p.functionCall.name,
      args: p.functionCall.args || {},
      ...(p.thoughtSignature ? { thoughtSignature: p.thoughtSignature } : {}),
    }));

  return { text, toolCalls, usage: extractUsage(response), model };
}

export async function* stream({ systemPrompt, messages, model, maxTokens, temperature }) {
  const result = await getClient().models.generateContentStream({
    model,
    contents: toGeminiContents(messages),
    config: { systemInstruction: systemPrompt, maxOutputTokens: maxTokens, temperature },
  });

  let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  for await (const chunk of result) {
    if (chunk.text) yield { type: "token", text: chunk.text };
    if (chunk.usageMetadata) usage = extractUsage(chunk);
  }
  yield { type: "done", usage, model };
}

export async function embed(text) {
  const embeddingModel = process.env.AI_EMBEDDING_MODEL || "text-embedding-004";
  const response = await getClient().models.embedContent({ model: embeddingModel, contents: text });
  return response.embeddings?.[0]?.values ?? [];
}

export async function countTokens(text, model) {
  try {
    const response = await getClient().models.countTokens({
      model: model || process.env.AI_PRIMARY_MODEL || "gemini-2.5-flash",
      contents: text,
    });
    return response.totalTokens ?? 0;
  } catch {
    // Fallback heuristic if the count endpoint is unavailable — see
    // base.provider.js's error contract notes.
    return Math.ceil((text || "").length / 4);
  }
}

export default { generate, stream, embed, countTokens };
