import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Covers Doc §16/56 "LLM provider success/failure" + "provider quota
 * errors" — the withFallback() logic in aiProvider.service.js (doc
 * §5/8's "Model/provider fallback"). The vendor SDKs themselves are
 * mocked at the registry level, so this never makes a real network call.
 */

vi.mock("../../src/ai/providers/index.js", () => ({
  getProvider: vi.fn(),
}));

const { getProvider } = await import("../../src/ai/providers/index.js");
const { generate } = await import("../../src/services/ai/aiProvider.service.js");

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.AI_PROVIDER = "gemini";
  delete process.env.AI_FALLBACK_PROVIDER;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("aiProvider.service — primary success path", () => {
  it("returns the primary provider's result untouched, tagged with providerUsed", async () => {
    getProvider.mockReturnValue({
      generate: vi.fn(async () => ({ text: "hi", usage: {}, model: "gemini-2.5-flash" })),
    });

    const result = await generate({ systemPrompt: "sys", messages: [] });

    expect(result.text).toBe("hi");
    expect(result.providerUsed).toBe("gemini");
    expect(result.fallbackUsed).toBe(false);
    expect(getProvider).toHaveBeenCalledWith("gemini");
    expect(getProvider).toHaveBeenCalledTimes(1);
  });
});

describe("aiProvider.service — no fallback configured", () => {
  it("propagates the primary provider's error as-is", async () => {
    getProvider.mockReturnValue({
      generate: vi.fn(async () => {
        throw new Error("gemini quota exceeded");
      }),
    });

    await expect(generate({ systemPrompt: "sys", messages: [] })).rejects.toThrow(
      "gemini quota exceeded",
    );
    // Only one attempt — no fallback provider configured, so getProvider
    // is never called a second time.
    expect(getProvider).toHaveBeenCalledTimes(1);
  });
});

describe("aiProvider.service — fallback provider configured", () => {
  beforeEach(() => {
    process.env.AI_FALLBACK_PROVIDER = "openai";
  });

  it("retries once via the fallback when the primary fails", async () => {
    const geminiGenerate = vi.fn(async () => {
      throw new Error("gemini down");
    });
    const openaiGenerate = vi.fn(async () => ({
      text: "recovered",
      usage: {},
      model: "gpt-4o",
    }));

    getProvider.mockImplementation((name) =>
      name === "gemini" ? { generate: geminiGenerate } : { generate: openaiGenerate },
    );

    const result = await generate({ systemPrompt: "sys", messages: [] });

    expect(result.text).toBe("recovered");
    expect(result.providerUsed).toBe("openai");
    expect(result.fallbackUsed).toBe(true);
    expect(geminiGenerate).toHaveBeenCalledTimes(1);
    expect(openaiGenerate).toHaveBeenCalledTimes(1);
  });

  it("combines both error messages when primary AND fallback fail", async () => {
    getProvider.mockImplementation((name) => ({
      generate: vi.fn(async () => {
        throw new Error(`${name} unavailable`);
      }),
    }));

    await expect(generate({ systemPrompt: "sys", messages: [] })).rejects.toThrow(
      /gemini unavailable.*openai unavailable/s,
    );
  });

  it("does not retry when the fallback is the same as the primary", async () => {
    process.env.AI_FALLBACK_PROVIDER = "gemini";
    const geminiGenerate = vi.fn(async () => {
      throw new Error("gemini down");
    });
    getProvider.mockReturnValue({ generate: geminiGenerate });

    await expect(generate({ systemPrompt: "sys", messages: [] })).rejects.toThrow(
      "gemini down",
    );
    expect(geminiGenerate).toHaveBeenCalledTimes(1);
  });
});
