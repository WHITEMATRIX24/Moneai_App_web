import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Two layers under test:
 *   1. aiSafety.service.js's screenMemoryFact() — the pattern-matching
 *      itself, real code (not mocked).
 *   2. memory.tools.js's executeRememberPreference() — that it actually
 *      calls the screen and refuses to persist an unsafe fact, with
 *      aiMemory.service.js mocked so no DB is touched.
 */

vi.mock("../../src/services/ai/aiMemory.service.js", () => ({
  remember: vi.fn(async (userId, fact) => ({ ...fact })),
  forget: vi.fn(async () => {}),
  list: vi.fn(async () => []),
}));

// executeRememberPreference() checks personalization consent before ever
// reaching the safety screen (a real DB read via aiConsent.service.js ->
// User.findById). Mocked so this suite tests only what it says it tests —
// the screen and the tool wiring — without a live Mongo connection, and
// without consent state masking the screen's own pass/fail behavior.
vi.mock("../../src/services/ai/aiConsent.service.js", () => ({
  hasPersonalizationConsent: vi.fn(async () => true),
}));

const { screenMemoryFact } = await import("../../src/services/ai/aiSafety.service.js");
const { remember } = await import("../../src/services/ai/aiMemory.service.js");
const { executeRememberPreference } = await import("../../src/ai/tools/memory.tools.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("aiSafety.service — screenMemoryFact()", () => {
  it("allows an ordinary low-sensitivity preference", () => {
    expect(screenMemoryFact({ key: "responseStyle", value: "short answers" })).toEqual({
      safe: true,
      reason: null,
    });
    expect(screenMemoryFact({ key: "preferredCurrency", value: "INR" }).safe).toBe(true);
  });

  it("blocks anything shaped like a card/account number", () => {
    const result = screenMemoryFact({ key: "note", value: "4111 1111 1111 1111" });
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/card or account number/);
  });

  it("blocks anything mentioning a password", () => {
    expect(screenMemoryFact({ key: "loginPassword", value: "hunter2" }).safe).toBe(false);
  });

  it("blocks government-ID-shaped facts", () => {
    expect(screenMemoryFact({ key: "note", value: "my aadhaar number is..." }).safe).toBe(false);
  });

  it("blocks health-condition-shaped facts even when phrased as a preference", () => {
    const result = screenMemoryFact({ key: "note", value: "I was diagnosed with anxiety disorder" });
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/health condition/);
  });

  it("blocks values that look like a data dump rather than a preference", () => {
    const result = screenMemoryFact({ key: "note", value: "x".repeat(301) });
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/too long/);
  });
});

describe("memory.tools — executeRememberPreference() actually uses the screen", () => {
  it("persists a safe fact via aiMemory.service.remember()", async () => {
    const result = await executeRememberPreference("user-a", {
      key: "responseStyle",
      value: "short",
    });
    expect(remember).toHaveBeenCalledTimes(1);
    expect(remember).toHaveBeenCalledWith(
      "user-a",
      expect.objectContaining({ key: "responseStyle", value: "short" }),
    );
    expect(result.key).toBe("responseStyle");
  });

  it("refuses to persist an unsafe fact and never calls remember()", async () => {
    await expect(
      executeRememberPreference("user-a", { key: "note", value: "card number 4111111111111111" }),
    ).rejects.toThrow(/Cannot remember this/);
    expect(remember).not.toHaveBeenCalled();
  });

  it("requires both key and value", async () => {
    await expect(executeRememberPreference("user-a", { key: "x" })).rejects.toThrow(
      /requires both key and value/,
    );
    expect(remember).not.toHaveBeenCalled();
  });
});