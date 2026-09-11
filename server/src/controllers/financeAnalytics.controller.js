import {
  getFinanceAnalytics,
} from "../services/financeAnalytics.service.js";

export async function analytics(req, res) {
  try {
    const data = await getFinanceAnalytics();

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