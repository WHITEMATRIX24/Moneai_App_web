import Subscription from "../models/Subscription.js";

export async function getMySubscription(req, res) {
  try {
    const sub = (await Subscription.findOne({ userId: req.auth?.user?._id })) || {
      plan: "FREE",
      status: "ACTIVE",
    };
    return res.json(sub);
  } catch (error) {
    console.error("getMySubscription error:", error);
    return res.status(500).json({ message: "Failed to get subscription" });
  }
}

export async function listSubscriptions(req, res) {
  try {
    const subscriptions = await Subscription.find().populate("userId", "name email");
    return res.json({ subscriptions });
  } catch (error) {
    console.error("listSubscriptions error:", error);
    return res.status(500).json({ message: "Failed to list subscriptions" });
  }
}
