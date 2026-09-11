import FinanceAccount from "../models/FinanceAccount.js";
import FinanceTransaction from "../models/FinanceTransaction.js";

export function getTargetUserId(req) {
  if (req.auth?.type === "user" && req.auth?.user?._id) {
    return req.auth.user._id;
  }
  if (req.query?.userId) {
    return req.query.userId;
  }
  return req.auth?.user?._id || null;
}

export async function getFinanceSummary(req, res) {
  try {
    const userId = getTargetUserId(req);
    const query = userId ? { userId } : {};

    const accounts = await FinanceAccount.find({
      ...query,
      archived: { $ne: true },
    });

    const transactions = await FinanceTransaction.find(query);

    const netWorth = accounts.reduce(
      (sum, account) => sum + Number(account.balance),
      0
    );

    const income = transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    res.json({
      netWorth,
      income,
      expense,
      accounts: accounts.length,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
}