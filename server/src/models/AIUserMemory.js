import mongoose from "mongoose";

/**
 * AIUserMemory — Doc Section 16 ("AI User Memory"). Schema copied
 * field-for-field from the doc:
 *
 *   { user, key, value, category, confidence, source, createdAt, updatedAt }
 *
 * Per the doc's own caveat directly under this schema ("Avoid storing
 * highly sensitive information unnecessarily") this is for durable,
 * low-sensitivity preferences only (e.g. "preferredCurrency": "INR",
 * "responseStyle": "short") — never health, auth, or financial-account
 * detail. aiMemory.service.js is the only writer; nothing here is
 * populated automatically by tool calls yet (Phase 5 per Doc Section
 * 72/76 — this model + service are being built ahead of that phase so
 * the write path exists once the orchestrator is told to use it).
 *
 * One (user, key) pair is a single fact — `key` is unique per user so
 * a repeated write updates confidence/value instead of duplicating rows.
 */
const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true },
    category: { type: String, default: "general" },
    // 0-1 confidence the fact is current/accurate — lets a low-confidence
    // inferred preference be overwritten more readily than one the user
    // stated explicitly (source: "user_stated").
    confidence: { type: Number, default: 1, min: 0, max: 1 },
    // Where the fact came from — "user_stated" | "inferred" | "system".
    source: { type: String, default: "user_stated" },
  },
  { timestamps: true },
);

schema.index({ user: 1, key: 1 }, { unique: true });

export default mongoose.model("AIUserMemory", schema);
