import FinanceTransaction from "../models/FinanceTransaction.js";
import FinanceAccount from "../models/FinanceAccount.js";

export async function getFinanceAnalytics(userId) {

  const query = userId ? { userId } : {};

  const transactions = await FinanceTransaction.find(query);

  const accounts = await FinanceAccount.find({
    ...query,
    archived: false,
  });

  let income = 0;
  let expense = 0;
  let netWorth = 0;

  const expenseByCategory = {};
  const monthlyMap = {};

  transactions.forEach((transaction) => {

    const amount = Number(transaction.amount);

    if (transaction.type === "Income") {
      income += amount;
    }

    if (transaction.type === "Expense") {

      expense += amount;

      expenseByCategory[
        transaction.category
      ] =
        (expenseByCategory[
          transaction.category
        ] || 0) + amount;

    }

    const month = new Date(
      transaction.transactionDate
    ).toLocaleString("default", {
      month: "short",
    });

    if (!monthlyMap[month]) {

      monthlyMap[month] = {
        month,
        income: 0,
        expense: 0,
      };

    }

    if (transaction.type === "Income") {
      monthlyMap[month].income += amount;
    }

    if (transaction.type === "Expense") {
      monthlyMap[month].expense += amount;
    }

  });

  accounts.forEach((account) => {

    netWorth += Number(account.balance);

  });

  return {

  summary: {

    netWorth,

    income,

    expense,

    savings: income - expense,

  },

  expenseByCategory,

  categories: Object.entries(
    expenseByCategory
  ).map(([category, amount]) => ({
    category,
    amount,
  })),

  monthlyTrend: Object.values(
    monthlyMap
  ).sort((a, b) => {

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return (
      months.indexOf(a.month) -
      months.indexOf(b.month)
    );

  }),

};

}