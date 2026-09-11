import mongoose from "mongoose";

/**
 * AIToolExecution — Doc Section 7/13 (5-member doc) and Section 4
 * (4-member doc) both list `AIToolExecution.js` in the recommended
 * models/ folder, but neither document specifies its fields — unlike
 * AIConversation/AIMessage/AIUsage, which have full schemas spelled out
 * in Section 13-15/7. This schema is therefore designed (not
 * transcribed) to satisfy what the doc DOES say the model is for:
 *   - Section 10 (5-member): "Validate every tool name and every tool
 *     parameter server-side" — needs a record of what was called and with what.
 *   - Section 48 (4-member): AI Error Monitoring lists "Invalid tool
 *     response" as a tracked error category — needs a status/error field.
 *   - Section 56/57: security tests for "Tool authorization" and
 *     "AI Quality Testing" validating tool answers against DB records —
 *     both need a persisted per-call audit trail, not just the inline
 *     `AIMessage.toolCalls` array (which records the call but not its
 *     resolved result/latency/outcome).
 *
 * Kept deliberately close to AIUsage.js's field style (userId, model
 * metadata, latencyMs, successful/errorCode) so the two collections are
 * easy to reason about side by side in admin analytics later.
 */
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      default: null, // null for the legacy stateless /chat/tools endpoints (no conversation)
      index: true,
    },
    tool: { type: String, required: true, index: true },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    requiresConfirmation: { type: Boolean, default: false },
    confirmed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["SUCCESS", "ERROR"],
      required: true,
    },
    // Trimmed handler return value — useful for QA replay (Section 57)
    // without re-hitting the DB. Never store raw Mongo docs here; every
    // tool handler already returns a summarized shape, so this is safe.
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
    latencyMs: { type: Number, default: 0 },
  },
  { timestamps: true },
);

schema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("AIToolExecution", schema);
