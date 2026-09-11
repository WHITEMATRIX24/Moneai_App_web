import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    actorAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("AuditLog", schema);
