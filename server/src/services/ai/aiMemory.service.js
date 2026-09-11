import AIUserMemory from "../../models/AIUserMemory.js";

// BUGFIX: there was no ceiling on how many facts one user could
// accumulate. Two concrete costs of that: (1) unbounded Mongo growth
// per user with no cleanup path, and (2) aiPrompt.service.js JSON-
// stringifies the *entire* list into every system prompt with no
// truncation — a user with hundreds of facts would silently balloon
// token usage/cost/latency on every single turn. Capped at a number
// generous enough for real preferences, small enough to bound cost.
const MAX_FACTS_PER_USER = 50;

/**
 * aiMemory.service.js — Doc Section 6's recommended services/ai/ list
 * names this file; Section 16 describes the model it's built around
 * ("AI can optionally retain useful user preferences"). This is
 * Phase 5 / advanced-personalization scope (Section 72/76), which
 * hasn't started — this service is the AI-side implementation built
 * ahead of that phase, per the request to prewire modules that aren't
 * live yet. It is intentionally standalone: nothing in aiPrompt.service.js
 * or aiApplicationTools.service.js calls this yet, so turning it on later is a
 * matter of wiring these functions in, not building them from scratch.
 *
 * Design notes:
 * - remember() upserts on (user, key) — a repeated fact updates the
 *   existing row (Section 16's schema has no separate "history" field,
 *   so last-write-wins is the intended behavior).
 * - list()/get() never return more than the doc's schema fields — no
 *   raw Mongo _id/__v leakage into anything that might reach a prompt.
 * - Per Section 16's "avoid storing highly sensitive information
 *   unnecessarily": this service does not filter content itself (it
 *   isn't a safety layer) — callers are responsible for only ever
 *   passing low-sensitivity, explicitly-stated preferences through
 *   remember(). aiSafety.service.js is the right place to add a content
 *   check before calling this, once something actually calls it.
 */

/**
 * @param {string} userId
 * @param {{key: string, value: string, category?: string, confidence?: number, source?: string}} fact
 */
export async function remember(userId, { key, value, category = "general", confidence = 1, source = "user_stated" }) {
  if (!key || value === undefined || value === null) {
    throw new Error("remember() requires both key and value");
  }

  // Only a genuinely new key counts against the cap — updating an
  // existing key's value is not growth, so it must never be blocked by
  // this check (that would make correcting a remembered fact fail once
  // a user happens to be at the limit).
  const existing = await AIUserMemory.findOne({ user: userId, key }).select("_id").lean();
  if (!existing) {
    const count = await AIUserMemory.countDocuments({ user: userId });
    if (count >= MAX_FACTS_PER_USER) {
      throw new Error(
        `Memory limit reached (${MAX_FACTS_PER_USER} facts). Forget an existing preference before saving a new one.`,
      );
    }
  }

  return AIUserMemory.findOneAndUpdate(
    { user: userId, key },
    { $set: { value: String(value), category, confidence, source } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
}

/**
 * @param {string} userId
 * @param {string} key
 */
export async function forget(userId, key) {
  await AIUserMemory.deleteOne({ user: userId, key });
}

/**
 * @param {string} userId
 * @param {string} [category] - optional filter
 * @returns {Promise<Array<{key:string, value:string, category:string, confidence:number}>>}
 */
export async function list(userId, category) {
  const query = { user: userId };
  if (category) query.category = category;
  const rows = await AIUserMemory.find(query)
    .select("key value category confidence -_id")
    .lean();
  return rows;
}

/**
 * @param {string} userId
 * @param {string} key
 */
export async function get(userId, key) {
  const row = await AIUserMemory.findOne({ user: userId, key })
    .select("key value category confidence -_id")
    .lean();
  return row || null;
}

export default { remember, forget, list, get };
