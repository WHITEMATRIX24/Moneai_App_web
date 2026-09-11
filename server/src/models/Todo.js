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
    description: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    dueAt: Date,
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    deletedAt: Date,
  },
  { timestamps: true },
);
export default mongoose.model("Todo", schema);
