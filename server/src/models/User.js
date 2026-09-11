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
