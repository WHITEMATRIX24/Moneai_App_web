import HealthMetric from "../models/HealthMetric.js";

export async function listHealthMetrics(req, res) {
  try {
    const q = req.auth?.type === "user" ? { userId: req.auth.user._id } : {};
    const metrics = await HealthMetric.find(q).sort({ recordedAt: -1 });
    return res.json({ metrics });
  } catch (error) {
    console.error("listHealthMetrics error:", error);
    return res.status(500).json({ message: "Failed to list health metrics" });
  }
}

export async function createHealthMetric(req, res) {
  try {
    const userId = req.auth?.user?._id;
    const doc = await HealthMetric.create({ userId, ...req.body });
    return res.status(201).json(doc);
  } catch (error) {
    console.error("createHealthMetric error:", error);
    return res.status(500).json({ message: error.message || "Failed to create health metric" });
  }
}
