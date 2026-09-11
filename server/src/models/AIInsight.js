import mongoose from "mongoose";

/**
 * AIInsight — Doc 2 §35 "AI Insight System" (Phase 4 in both docs'
 * roadmaps). Proactively generated observations like "your food
 * spending increased 18%" or "3 high-priority tasks are overdue",
 * surfaced without the user having to ask.
 *
 * Field names follow this codebase's actual AI-model convention
 * (userId, not the doc's literal `user` — see AIConversation.js,
 * AIMessage.js, AIUsage.js, AIToolExecution.js, all of which use
 * userId; AIUserMemory.js is the one outlier using `user`).
 *
 * `metadata.dedupeKey` is how aiInsight.service.js avoids spamming
 * duplicate rows every time insights are (re)generated — see that
 * file's upsertInsight() for the matching logic, including why a
 * dismissed insight is deliberately NOT resurrected mid-period.
 */
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "BUDGET_EXCEEDED",
        "SPENDING_INCREASE",
        "GOAL_BEHIND_SCHEDULE",
        "GOAL_PROGRESS",
        "OVERDUE_TASKS",
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    // "RULE_ENGINE" today — the doc leaves room for LLM-generated
    // insights later (Phase 4/5's "proactive insights"); keeping this
    // field means that can be added without a schema migration.
    source: { type: String, default: "RULE_ENGINE" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    dismissed: { type: Boolean, default: false },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

schema.index({ userId: 1, dismissed: 1, generatedAt: -1 });
schema.index({ userId: 1, type: 1, "metadata.dedupeKey": 1 });

export default mongoose.model("AIInsight", schema);
