import mongoose from "mongoose";

const financeGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    goalName: {
      type: String,
      required: true,
      trim: true,
    },

    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    savedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    targetDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "In Progress",
    },

    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "FinanceGoal",
  financeGoalSchema
);