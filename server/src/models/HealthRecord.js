import mongoose from "mongoose";

const healthRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      index: true,
    },
    feature: { type: String },
    type: { type: String },
    name: { type: String },
    value: { type: mongoose.Schema.Types.Mixed },
    unit: { type: String },
    recordedAt: { type: Date, default: Date.now },
    notes: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, strict: false }
);

export default mongoose.model("HealthRecord", healthRecordSchema);
