import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * qwen.provider.js has no live OpenRouter key in this environment, so
 * these tests mock global.fetch and assert on the outgoing request
 * shape (URL, headers, body) and on how the response is parsed — the
 * two things that would actually break integration with a real key.
 */

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = global.fetch;

beforeEach(() => {
  process.env.AI_QWEN_API_KEY = "sk-or-test-key";
  delete process.env.AI_QWEN_BASE_URL;
  delete process.env.AI_QWEN_APP_URL;
  delete process.env.AI_QWEN_APP_NAME;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  global.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("qwen.provider — configuration", () => {
  it("throws a clear error if AI_QWEN_API_KEY is missing", async () => {
    delete process.env.AI_QWEN_API_KEY;
    const { generate } = await import("../../src/ai/providers/qwen.provider.js");
    await expect(
      generate({ systemPrompt: "sys", messages: [], model: "qwen/qwen3-8b:free" }),
    ).rejects.toThrow(/AI_QWEN_API_KEY is not set/);
  });
});

describe("qwen.provider — generate()", () => {
  it("hits OpenRouter's chat/completions endpoint with the right auth header and body shape", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "hello from qwen" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        model: "qwen/qwen3-8b:free",
      }),
    });
    global.fetch = mockFetch;

    const { generate } = await import("../../src/ai/providers/qwen.provider.js");
    const result = await generate({
      systemPrompt: "You are helpful.",
      messages: [{ role: "user", content: "hi" }],
      model: "qwen/qwen3-8b:free",
      maxTokens: 500,
      temperature: 0.3,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer sk-or-test-key");
    expect(options.headers["HTTP-Referer"]).toBeUndefined();

    const body = JSON.parse(options.body);
    expect(body.model).toBe("qwen/qwen3-8b:free");
    expect(body.messages[0]).toEqual({ role: "system", content: "You are helpful." });
    expect(body.messages[1]).toEqual({ role: "user", content: "hi" });

    expect(result.text).toBe("hello from qwen");
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5, totalTokens: 15 });
  });

  it("respects AI_QWEN_BASE_URL and the optional attribution headers", async () => {
    process.env.AI_QWEN_BASE_URL = "https://custom-proxy.example.com/v1";
    process.env.AI_QWEN_APP_URL = "https://mone.ai";
    process.env.AI_QWEN_APP_NAME = "MONE AI";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }], usage: {}, model: "x" }),
    });
    global.fetch = mockFetch;

    const { generate } = await import("../../src/ai/providers/qwen.provider.js");
    await generate({ systemPrompt: "s", messages: [], model: "x" });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://custom-proxy.example.com/v1/chat/completions");
    expect(options.headers["HTTP-Referer"]).toBe("https://mone.ai");
    expect(options.headers["X-Title"]).toBe("MONE AI");
  });

  it("translates tool declarations into OpenAI-compatible function schemas", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "" } }], usage: {}, model: "x" }),
    });
    global.fetch = mockFetch;

    const { generate } = await import("../../src/ai/providers/qwen.provider.js");
    await generate({
      systemPrompt: "s",
      messages: [],
      model: "x",
      tools: [{ name: "get_accounts", description: "Get accounts", parameters: { type: "object", properties: {} } }],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.tools).toEqual([
      {
        type: "function",
        function: { name: "get_accounts", description: "Get accounts", parameters: { type: "object", properties: {} } },
      },
    ]);
  });

  it("parses a tool_calls response into the vendor-neutral toolCalls shape", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                { function: { name: "list_todos", arguments: '{"status":"pending"}' } },
              ],
            },
          },
        ],
        usage: {},
        model: "x",
      }),
    });
    global.fetch = mockFetch;

    const { generate } = await import("../../src/ai/providers/qwen.provider.js");
    const result = await generate({ systemPrompt: "s", messages: [], model: "x" });

    expect(result.toolCalls).toEqual([{ name: "list_todos", args: { status: "pending" } }]);
  });

  it("surfaces a non-2xx response as a descriptive error, including a 429 rate-limit body", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: "free-models-per-day limit exceeded" }),
    });

    const { generate } = await import("../../src/ai/providers/qwen.provider.js");
    await expect(generate({ systemPrompt: "s", messages: [], model: "x" })).rejects.toThrow(
      /Qwen \(OpenRouter\) provider error \(429\).*free-models-per-day/,
    );
  });
});

describe("qwen.provider — embed()", () => {
  it("throws not-supported rather than silently returning an empty vector", async () => {
    const { embed } = await import("../../src/ai/providers/qwen.provider.js");
    await expect(embed("some text")).rejects.toThrow(/embeddings are not supported/);
  });
});

describe("qwen.provider — countTokens()", () => {
  it("approximates at ~4 chars/token", async () => {
    const { countTokens } = await import("../../src/ai/providers/qwen.provider.js");
    await expect(countTokens("a".repeat(40))).resolves.toBe(10);
  });
});
