import FinanceAccount from "../models/FinanceAccount.js";
import FinanceTransaction from "../models/FinanceTransaction.js";

export async function getFinanceSummary(req, res) {
  try {
    const accounts = await FinanceAccount.find({
      archived: { $ne: true },
    });

    const transactions = await FinanceTransaction.find();

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