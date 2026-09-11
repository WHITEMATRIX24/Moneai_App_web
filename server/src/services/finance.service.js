import FinanceTransaction from "../models/FinanceTransaction.js";
import FinanceAccount from "../models/FinanceAccount.js";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const VALID_TRANSACTION_TYPES = [
  "Income",
  "Expense",
  "Transfer",
];

const MAX_TRANSACTION_AMOUNT = 100000000;
const MAX_DESCRIPTION_LENGTH = 250;

/*
|--------------------------------------------------------------------------
| Helper - Validate Transaction Data
|--------------------------------------------------------------------------
*/

function validateTransactionData(data) {
  if (!data.category || !String(data.category).trim()) {
    throw new Error("Category is required.");
  }

  if (!data.type) {
    throw new Error("Transaction type is required.");
  }

  if (!VALID_TRANSACTION_TYPES.includes(data.type)) {
    throw new Error("Invalid transaction type.");
  }

  if (
    data.amount === undefined ||
    data.amount === null ||
    data.amount === ""
  ) {
    throw new Error("Amount is required.");
  }

  const amount = Number(data.amount);

  if (!Number.isFinite(amount)) {
    throw new Error("Amount must be a valid number.");
  }

  if (amount <= 0) {
    throw new Error(
      "Amount must be greater than 0."
    );
  }

  if (amount > MAX_TRANSACTION_AMOUNT) {
    throw new Error(
      "Amount exceeds the allowed limit."
    );
  }

  if (!data.transactionDate) {
    throw new Error(
      "Transaction date is required."
    );
  }

  const selectedDate = new Date(
    data.transactionDate
  );

  if (Number.isNaN(selectedDate.getTime())) {
    throw new Error(
      "Transaction date is invalid."
    );
  }

  const today = new Date();

  today.setHours(23, 59, 59, 999);

  if (selectedDate > today) {
    throw new Error(
      "Future dates are not allowed."
    );
  }

  const description =
    data.description
      ? String(data.description).trim()
      : "";

  if (
    description.length >
    MAX_DESCRIPTION_LENGTH
  ) {
    throw new Error(
      "Description cannot exceed 250 characters."
    );
  }

  return {
    ...data,

    category:
      String(data.category).trim(),

    amount,

    transactionDate:
      selectedDate,

    description,
  };
}

/*
|--------------------------------------------------------------------------
| Helper - Check Duplicate Transaction
|--------------------------------------------------------------------------
*/

async function findDuplicateTransaction(
  data
) {
  return await FinanceTransaction.findOne({
    userId: data.userId,

    type: data.type,

    category: data.category,

    amount: data.amount,

    transactionDate:
      data.transactionDate,
  });
}

/*
|--------------------------------------------------------------------------
| Get All Transactions
|--------------------------------------------------------------------------
*/

export async function getAllTransactions(userId) {
  const query = userId ? { userId } : {};
  return await FinanceTransaction.find(query)
    .sort({
      transactionDate: -1,
    });
}

/*
|--------------------------------------------------------------------------
| Finance Summary
|--------------------------------------------------------------------------
*/

export async function getFinanceSummary(userId) {
  const query = userId ? { userId } : {};
  const transactions =
    await FinanceTransaction.find(query);

  const accounts =
    await FinanceAccount.find({
      ...query,
      archived: false,
    });

  let income = 0;
  let expense = 0;
  let netWorth = 0;

  transactions.forEach(
    (transaction) => {
      const amount =
        Number(transaction.amount) || 0;

      if (
        transaction.type === "Income"
      ) {
        income += amount;
      }

      if (
        transaction.type === "Expense"
      ) {
        expense += amount;
      }
    }
  );

  accounts.forEach((account) => {
    netWorth +=
      Number(account.balance) || 0;
  });

  return {
    netWorth,
    income,
    expense,
    accounts: accounts.length,
  };
}

/*
|--------------------------------------------------------------------------
| Create Transaction
|--------------------------------------------------------------------------
*/

export async function createTransaction(
  data
) {
  const validatedData =
    validateTransactionData(data);

  const duplicate =
    await findDuplicateTransaction(
      validatedData
    );

  if (duplicate) {
    throw new Error(
      "Duplicate transaction already exists."
    );
  }

  return await FinanceTransaction.create(
    validatedData
  );
}

/*
|--------------------------------------------------------------------------
| Add Transaction Controller Helper
|--------------------------------------------------------------------------
*/

export async function addTransaction(
  req,
  res
) {
  try {
    const transaction =
      await createTransaction(
        req.body
      );

    return res.status(201).json({
      success: true,

      message:
        "Transaction created successfully.",

      data: transaction,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,

      message:
        error.message ||
        "Failed to create transaction.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Update Transaction
|--------------------------------------------------------------------------
*/

export async function updateTransaction(
  id,
  data,
  userId
) {
  const query = { _id: id };
  if (userId) query.userId = userId;

  const existing =
    await FinanceTransaction.findOne(query);

  if (!existing) {
    throw new Error(
      "Transaction not found."
    );
  }

  const mergedData = {
    ...existing.toObject(),
    ...data,
    userId: existing.userId,
  };

  const validatedData =
    validateTransactionData(
      mergedData
    );

  const duplicate =
    await FinanceTransaction.findOne({
      _id: {
        $ne: id,
      },

      userId:
        validatedData.userId,

      type:
        validatedData.type,

      category:
        validatedData.category,

      amount:
        validatedData.amount,

      transactionDate:
        validatedData.transactionDate,
    });

  if (duplicate) {
    throw new Error(
      "Another identical transaction already exists."
    );
  }

  return await FinanceTransaction.findOneAndUpdate(
    query,
    {
      ...validatedData,
    },
    {
      new: true,
      runValidators: true,
    }
  );
}

/*
|--------------------------------------------------------------------------
| Delete Transaction
|--------------------------------------------------------------------------
*/

export async function deleteTransaction(
  id,
  userId
) {
  const query = { _id: id };
  if (userId) query.userId = userId;

  return await FinanceTransaction.findOneAndDelete(
    query
  );
}

/*
|--------------------------------------------------------------------------
| Import Statement Transactions
|--------------------------------------------------------------------------
|
| The controller will extract information from
| CSV / Excel / PDF and convert it into this
| common structure:
|
| {
|   userId,
|   type,
|   category,
|   amount,
|   description,
|   transactionDate
| }
|
|--------------------------------------------------------------------------
*/

export async function importTransactions(
  rows
) {
  if (!Array.isArray(rows)) {
    throw new Error(
      "Invalid imported transaction data."
    );
  }

  if (rows.length === 0) {
    throw new Error(
      "No transactions were found in the statement."
    );
  }

  let importedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  const errors = [];

  for (
    let index = 0;
    index < rows.length;
    index++
  ) {
    const row = rows[index];

    try {
      /*
       * Validate extracted row
       */
      const validatedData =
        validateTransactionData(
          row
        );

      /*
       * Check whether the same
       * transaction already exists.
       */
      const duplicate =
        await findDuplicateTransaction(
          validatedData
        );

      if (duplicate) {
        duplicateCount++;
        continue;
      }

      /*
       * Save transaction
       */
      await FinanceTransaction.create(
        validatedData
      );

      importedCount++;
    } catch (error) {
      errorCount++;

      errors.push({
        row: index + 1,

        message:
          error.message ||
          "Invalid transaction.",
      });
    }
  }

  return {
    importedCount,

    duplicateCount,

    errorCount,

    errors,
  };
}