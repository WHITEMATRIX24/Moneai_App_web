import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: true,
    },

    phone: {
      type: String,
      default: "",
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "BLOCKED", "INACTIVE"],
      default: "ACTIVE",
    },

    subscriptionPlan: {
      type: String,
      default: "FREE",
    },

    lastActiveAt: {
      type: Date,
      default: null,
    },

    // ==============================
    // AI PERSONALIZATION CONSENT
    // ==============================
    // Gates ALL of AIUserMemory — both facts the user explicitly asks
    // the AI to remember (remember_preference) and facts the AI infers
    // from behavior (aiInference.service.js, source: "inferred").
    // Captured at signup (default false) and changeable anytime from
    // Settings. `consentVersion` lets a future change to what gets
    // inferred re-prompt only users who consented under an older
    // version, instead of assuming old consent covers new behavior.
    // Read/written by services/ai/aiConsent.service.js — do not remove.
    aiPersonalization: {
      consent: { type: Boolean, default: false },
      consentedAt: { type: Date, default: null },
      consentVersion: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  },
);

// ==============================
// HASH PASSWORD
// ==============================

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);

  this.password = await bcrypt.hash(this.password, salt);
});

// ==============================
// COMPARE PASSWORD
// ==============================

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
