import { remember, forget, list } from "../../services/ai/aiMemory.service.js";
import { screenMemoryFact } from "../../services/ai/aiSafety.service.js";
import { hasPersonalizationConsent } from "../../services/ai/aiConsent.service.js";

/**
 * memory.tools.js
 *
 * The wiring aiMemory.service.js's own header says doesn't exist yet:
 * this is what lets the model actually call remember()/forget()/list(),
 * turning AIUserMemory from a built-but-inert model into something the
 * AI can use. Doc Section 16 ("AI User Memory") + Phase 5 scope
 * (Section 72/76).
 *
 * requiresConfirmation is false for remember/forget, unlike every
 * other domain's write tools — a deliberate exception to this
 * codebase's blanket rule (aiApplicationTools.service.js's header:
 * "write tools ... executeTool() refuses to run these unless ...
 * confirmed: true"). Remembering a preference is low-stakes and
 * trivially reversible: the user can see and delete anything via
 * GET/DELETE /api/v1/ai/memory, or just ask the AI to forget it — so
 * requiring a confirm click on every "remember I prefer X" would be
 * pure friction with no matching safety benefit. If that trade-off
 * ever turns out wrong in practice, flip these two booleans to true —
 * everything else here (the pending-action/confirm plumbing) already
 * supports it either way.
 */

export const rememberPreferenceDeclaration = {
  name: "remember_preference",
  description:
    "Save a durable, low-sensitivity fact or preference the user explicitly stated, to use in future conversations (e.g. preferred currency, response style, a stated goal). Never call this for anything health-related, financial-account numbers, credentials, or anything the user didn't actually state. Executes immediately — no confirmation step.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      key: { type: "string", description: "Short identifier, e.g. 'preferredCurrency', 'responseStyle'." },
      value: { type: "string", description: "The fact/preference, in a few words." },
      category: { type: "string", description: "Optional grouping, e.g. 'finance', 'communication'. Defaults to 'general'." },
    },
    required: ["key", "value"],
  },
};

export const forgetPreferenceDeclaration = {
  name: "forget_preference",
  description: "Delete a previously remembered fact/preference by its key. Executes immediately — no confirmation step.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      key: { type: "string", description: "The key to forget, as returned by list_remembered_preferences." },
    },
    required: ["key"],
  },
};

export const listRememberedPreferencesDeclaration = {
  name: "list_remembered_preferences",
  description: "List everything currently remembered about the user (e.g. if they ask 'what do you remember about me?').",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * @param {string} userId
 * @param {{key: string, value: string, category?: string}} args
 */
export async function executeRememberPreference(userId, args = {}) {
  if (!args.key || args.value === undefined || args.value === null || args.value === "") {
    throw new Error("remember_preference requires both key and value");
  }

  // Consent is the umbrella permission for MONE AI to retain anything
  // about the user across conversations — stated facts included, not
  // just inferred ones (aiInference.service.js gates on the same check).
  // Thrown, not silently dropped, so the model can explain why and point
  // the user at Settings rather than pretending it saved something it didn't.
  if (!(await hasPersonalizationConsent(userId))) {
    throw new Error(
      "Personalization is turned off for this user. Ask them to enable it in Settings before anything can be remembered.",
    );
  }

  const screen = screenMemoryFact({ key: args.key, value: String(args.value) });
  if (!screen.safe) {
    // Thrown, not silently dropped — the tool loop surfaces this as an
    // error the model sees, so it can tell the user why it won't save
    // that particular fact rather than pretending it did.
    throw new Error(`Cannot remember this: ${screen.reason}`);
  }

  const saved = await remember(userId, {
    key: args.key,
    value: String(args.value),
    category: args.category || "general",
    source: "user_stated",
  });
  return { key: saved.key, value: saved.value, category: saved.category };
}

/**
 * @param {string} userId
 * @param {{key: string}} args
 */
export async function executeForgetPreference(userId, args = {}) {
  if (!args.key) throw new Error("forget_preference requires a key");
  await forget(userId, args.key);
  return { key: args.key, forgotten: true };
}

/**
 * @param {string} userId
 */
export async function executeListRememberedPreferences(userId) {
  const facts = await list(userId);
  return { facts };
}
