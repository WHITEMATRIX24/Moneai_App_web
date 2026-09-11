import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["CHECKING", "SAVINGS", "CASH", "CREDIT_CARD", "INVESTMENT", "OTHER"],
      default: "CHECKING",
    },
    balance: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "INR" },
    // First account a user creates is the implicit default — used when a
    // transaction isn't linked to a specific account and, before any real
    // Account exists, by the AI get_accounts/get_account_balance fallback
    // in finance.tools.js.
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

schema.index({ userId: 1, isDefault: 1 });

export default mongoose.model("Account", schema);
