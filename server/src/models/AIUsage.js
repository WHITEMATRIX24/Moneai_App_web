import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    model: {
      type: String,
      default: "default",
    },

    provider: {
      type: String,
      default: "gemini",
    },

    requestType: {
      type: String,
      default: "CHAT",
    },

    promptTokens: {
      type: Number,
      default: 0,
    },

    completionTokens: {
      type: Number,
      default: 0,
    },

    totalTokens: {
      type: Number,
      default: 0,
    },

    estimatedCost: {
      type: Number,
      default: 0,
    },

    // Whether the AI request completed successfully
    successful: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Error code when an AI request fails
    errorCode: {
      type: String,
      default: null,
    },

    // Request response time in milliseconds
    latencyMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("AIUsage", schema);
