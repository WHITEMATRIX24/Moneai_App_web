import mongoose from "mongoose";

const takenLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD", user's local date
    time: { type: String, required: true }, // "HH:MM", must match one of `times`
    takenAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    personName: { type: String, default: "Me", trim: true },
    name: { type: String, required: true },
    dosage: { type: String, default: "" },
    notes: { type: String, default: "" },
    times: {
      type: [String], // e.g. ["08:00", "20:00"]
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one time is required",
      },
    },
    frequency: {
      type: String,
      enum: ["EVERYDAY", "CUSTOM_DAYS", "ONE_TIME"],
      default: "EVERYDAY",
    },
    days: {
      type: [Number], // 0 = Sun ... 6 = Sat. Only used when frequency = CUSTOM_DAYS.
      default: [],
      validate: {
        validator: (arr) =>
          Array.isArray(arr) && arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: "Days must be integers 0–6 (Sun–Sat)",
      },
    },
    onceDate: {
      type: String, // "YYYY-MM-DD". Only used when frequency = ONE_TIME.
      default: null,
    },
    active: { type: Boolean, default: true },
    takenLog: { type: [takenLogSchema], default: [] },
    deletedAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Medicine", schema);