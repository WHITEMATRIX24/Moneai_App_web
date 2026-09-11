import FinanceBudget from "../models/FinanceBudget.js";
import FinanceTransaction from "../models/FinanceTransaction.js";

/*
|--------------------------------------------------------------------------
| Calculate Spent Amount
|--------------------------------------------------------------------------
*/

async function calculateSpent(category, month, year, userId) {

  const startDate = new Date(year, month - 1, 1);

  const endDate = new Date(year, month, 1);

  const query = {
    type: "Expense",
    category,
    transactionDate: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  if (userId) {
    query.userId = userId;
  }

  const transactions = await FinanceTransaction.find(query);

  return transactions.reduce(

    (total, transaction) =>

      total + Number(transaction.amount),

    0

  );

}

/*
|--------------------------------------------------------------------------
| Get All Budgets
|--------------------------------------------------------------------------
*/

export async function getAllBudgets(userId) {

  const query = {
    archived: false,
  };

  if (userId) {
    query.userId = userId;
  }

  const budgets =
    await FinanceBudget.find(query).sort({

      createdAt: -1,

    });

  const result = [];

  for (const budget of budgets) {

    const spentAmount =
      await calculateSpent(

        budget.category,

        budget.month,

        budget.year,

        budget.userId || userId

      );

    const remaining =
      budget.budgetAmount -
      spentAmount;

    const progress =
      budget.budgetAmount === 0
        ? 0
        : Math.round(

            (spentAmount /
              budget.budgetAmount) *
              100

          );

    let status = "On Track";

    if (progress >= 100) {

      status = "Completed";

    } else if (progress >= 80) {

      status = "Warning";

    }

    result.push({

      ...budget.toObject(),

      spentAmount,

      remaining,

      progress,

      status,

    });

  }

  return result;

}

/*
|--------------------------------------------------------------------------
| Get Budget By ID
|--------------------------------------------------------------------------
*/

export async function getBudgetById(id, userId) {

  const query = { _id: id };
  if (userId) {
    query.userId = userId;
  }

  return await FinanceBudget.findOne(query);

}

/*
|--------------------------------------------------------------------------
| Create Budget
|--------------------------------------------------------------------------
*/

export async function createBudget(data) {

  if (!data.category?.trim()) {

    throw new Error(
      "Category is required."
    );

  }

  if (

    !data.budgetAmount ||

    Number(data.budgetAmount) <= 0

  ) {

    throw new Error(

      "Budget amount must be greater than zero."

    );

  }

  const duplicate =
    await FinanceBudget.findOne({

      userId: data.userId,

      category: data.category,

      month: data.month,

      year: data.year,

      archived: false,

    });

  if (duplicate) {

    throw new Error(

      "Budget already exists for this category."

    );

  }

  return await FinanceBudget.create({

    ...data,

    spentAmount: 0,

  });

}

/*
|--------------------------------------------------------------------------
| Update Budget
|--------------------------------------------------------------------------
*/

export async function updateBudget(id, data, userId) {

  if (

    data.budgetAmount &&

    Number(data.budgetAmount) <= 0

  ) {

    throw new Error(

      "Budget amount must be greater than zero."

    );

  }

  const query = { _id: id };
  if (userId) query.userId = userId;

  return await FinanceBudget.findOneAndUpdate(

    query,

    {

      ...data,

    },

    {

      new: true,

      runValidators: true,

    }

  );

}

/*
|--------------------------------------------------------------------------
| Archive Budget
|--------------------------------------------------------------------------
*/

export async function archiveBudget(id, userId) {

  const query = { _id: id };
  if (userId) query.userId = userId;

  return await FinanceBudget.findOneAndUpdate(

    query,

    {

      archived: true,

    },

    {

      new: true,

    }

  );

}