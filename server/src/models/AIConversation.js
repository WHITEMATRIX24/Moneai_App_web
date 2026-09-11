import mongoose from "mongoose";

/**
 * AIConversation — one chat thread per user (doc Section 13).
 * `summary` backs "Conversation Summarization" (Section 43) so we never
 * have to replay the full message history into the model as it grows.
 */
const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "New Conversation" },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED", "DELETED"],
      default: "ACTIVE",
      index: true,
    },
    lastMessageAt: { type: Date, default: Date.now },
    summary: { type: String, default: "" },
    summaryUpdatedAt: Date,
    metadata: {
      primaryFeature: { type: String, default: "GENERAL" },
      model: String,
    },
  },
  { timestamps: true },
);

schema.index({ userId: 1, status: 1, lastMessageAt: -1 });

export default mongoose.model("AIConversation", schema);
