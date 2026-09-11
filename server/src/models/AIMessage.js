import mongoose from "mongoose";

/**
 * AIMessage — one turn in an AIConversation (doc Section 14).
 * TOOL-role messages record what a tool returned so a conversation's
 * history stays reconstructable without re-hitting Mongo per replay.
 */
const schema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["USER", "ASSISTANT", "SYSTEM", "TOOL"],
      required: true,
    },
    content: { type: String, default: "" },
    model: String,
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    latencyMs: Number,
    toolCalls: [
      {
        name: String,
        args: mongoose.Schema.Types.Mixed,
      },
    ],
    status: {
      type: String,
      enum: ["COMPLETED", "PENDING_CONFIRMATION", "FAILED"],
      default: "COMPLETED",
    },
  },
  { timestamps: true },
);

schema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model("AIMessage", schema);
