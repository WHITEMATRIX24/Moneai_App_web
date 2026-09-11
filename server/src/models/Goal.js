import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: Date,
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "ARCHIVED"],
      default: "ACTIVE",
    },
    createdVia: { type: String, enum: ["USER", "AI"], default: "USER" },
  },
  { timestamps: true },
);

schema.index({ userId: 1, status: 1 });

export default mongoose.model("Goal", schema);
