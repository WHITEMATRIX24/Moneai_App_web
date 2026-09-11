import mongoose from "mongoose";

const financeAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    accountName: {
      type: String,
      required: true,
      trim: true,
    },

    accountType: {
      type: String,
      enum: [
        "Bank",
        "Cash",
        "Credit Card",
        "Wallet",
        "Investment",
      ],
      required: true,
    },

    institution: {
      type: String,
      default: "",
    },

    balance: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
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
  "FinanceAccount",
  financeAccountSchema
);