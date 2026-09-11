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