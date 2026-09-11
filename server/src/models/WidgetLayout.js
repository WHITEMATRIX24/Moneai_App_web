import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    widgetId: { type: String, required: true },
    title: { type: String },
    description: { type: String },
    type: { type: String, default: "module" },
    customType: { type: String },
    widgetType: { type: String },
    variant: { type: String },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 1 },
    height: { type: Number, default: 1 },
    enabled: { type: Boolean, default: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false, strict: false }
);

const widgetLayoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    widgets: {
      type: [itemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("WidgetLayout", widgetLayoutSchema);
