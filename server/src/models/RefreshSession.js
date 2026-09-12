import mongoose from "mongoose";

const refreshSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    userType: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },

    tokenHash: {
      type: String,
      required: true,
    },

    device: {
      type: String,
      default: "Web Browser",
    },

    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet"],
      default: "desktop",
    },

    browser: {
      type: String,
      default: "Chrome",
    },

    os: {
      type: String,
      default: "macOS",
    },

    ip: {
      type: String,
      default: "127.0.0.1",
    },

    location: {
      type: String,
      default: "Current Location",
    },

    userAgent: {
      type: String,
      default: "",
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically remove expired sessions from MongoDB
refreshSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model(
  "RefreshSession",
  refreshSessionSchema
);