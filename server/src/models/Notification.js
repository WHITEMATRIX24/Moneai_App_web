import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    audience: {
      type: String,
      enum: ["ALL", "FREE", "PREMIUM", "USER"],
      default: "ALL",
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["DRAFT", "SENT", "SCHEDULED", "CANCELLED"],
      default: "DRAFT",
    },
    scheduledAt: Date,
    sentAt: Date,
    // Per-user read tracking (used for broadcast audience notifications)
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Direct read flag (used when userId is set — personal notifications)
    read: { type: Boolean, default: false },
    readAt: Date,
    deliveryResults: [
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SENT", "DELIVERED", "FAILED"],
      default: "PENDING",
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
],
  },
  { timestamps: true },
);
export default mongoose.model("Notification", schema);
