import {
  getFinanceAnalytics,
} from "../services/financeAnalytics.service.js";

export function getTargetUserId(req) {
  if (req.auth?.type === "user" && req.auth?.user?._id) {
    return req.auth.user._id;
  }
  if (req.query?.userId) {
    return req.query.userId;
  }
  return req.auth?.user?._id || null;
}

export async function analytics(req, res) {
  try {
    const userId = getTargetUserId(req);
    const data = await getFinanceAnalytics(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load analytics.",
    });
  }
}