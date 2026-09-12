import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "",
      trim: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: "MANUAL",
    },
  },
  { timestamps: true }
);

export default mongoose.model("HealthMetric", schema);

