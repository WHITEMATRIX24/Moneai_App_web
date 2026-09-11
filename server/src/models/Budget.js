import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ["MONTHLY", "WEEKLY", "YEARLY"], default: "MONTHLY" },
    createdVia: { type: String, enum: ["USER", "AI"], default: "USER" },
  },
  { timestamps: true },
);

schema.index({ userId: 1, category: 1 });

export default mongoose.model("Budget", schema);
