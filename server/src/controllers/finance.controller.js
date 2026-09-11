import User from "../models/User.js";
import {
  getAllTransactions,
  getFinanceSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importTransactions,
} from "../services/finance.service.js";

/*
|--------------------------------------------------------------------------
| Helper - Resolve User ID
|--------------------------------------------------------------------------
*/

export async function resolveUserId(req) {
  if (req.body?.userId && req.body.userId !== "000000000000000000000001") {
    return req.body.userId;
  }

  if (req.auth?.user?._id) {
    return req.auth.user._id;
  }

  try {
    const firstUser = await User.findOne().select("_id");
    if (firstUser) return firstUser._id;
  } catch {}

  return req.body?.userId || "000000000000000000000001";
}

/*
|--------------------------------------------------------------------------
| Get All Transactions
|--------------------------------------------------------------------------
*/

export async function listTransactions(req, res) {
  try {
    const transactions =
      await getAllTransactions();

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch transactions.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Finance Summary
|--------------------------------------------------------------------------
*/

export async function financeSummary(req, res) {
  try {
    const summary =
      await getFinanceSummary();

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch finance summary.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Create Transaction
|--------------------------------------------------------------------------
*/

export async function addTransaction(req, res) {
  try {
    const payload = { ...req.body };
    payload.userId = await resolveUserId(req);

    const transaction =
      await createTransaction(
        payload
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

export async function editTransaction(
  req,
  res
) {
  try {
    const transaction =
      await updateTransaction(
        req.params.id,
        req.body
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Transaction updated successfully.",

      data: transaction,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,

      message:
        error.message ||
        "Failed to update transaction.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Delete Transaction
|--------------------------------------------------------------------------
*/

export async function removeTransaction(
  req,
  res
) {
  try {
    const transaction =
      await deleteTransaction(
        req.params.id
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,

      message:
        "Failed to delete transaction.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Import Bank Statement Transactions
|--------------------------------------------------------------------------
*/

function parseCSVLine(text) {
  const result = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }

  result.push(cur.trim());
  return result;
}

function parseCSV(content, fallbackUserId) {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

  const dateIdx = headers.findIndex(
    (h) => h.includes("date") || h.includes("time") || h.includes("when")
  );
  const descIdx = headers.findIndex(
    (h) =>
      h.includes("desc") ||
      h.includes("detail") ||
      h.includes("narration") ||
      h.includes("particular") ||
      h.includes("memo") ||
      h.includes("remark") ||
      h.includes("title")
  );
  const amountIdx = headers.findIndex(
    (h) => h.includes("amount") || h.includes("total") || h.includes("sum")
  );
  const debitIdx = headers.findIndex(
    (h) =>
      h.includes("debit") ||
      h.includes("withdrawal") ||
      h.includes("spent") ||
      h.includes("expense")
  );
  const creditIdx = headers.findIndex(
    (h) =>
      h.includes("credit") ||
      h.includes("deposit") ||
      h.includes("income")
  );
  const typeIdx = headers.findIndex((h) => h.includes("type"));
  const catIdx = headers.findIndex((h) => h.includes("cat"));

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values || values.length === 0) continue;

    const dateVal = dateIdx !== -1 ? values[dateIdx] : null;
    let txnDate = dateVal ? new Date(dateVal) : new Date();
    if (Number.isNaN(txnDate.getTime())) txnDate = new Date();

    const desc = descIdx !== -1 ? values[descIdx] : "";
    const category =
      catIdx !== -1 && values[catIdx] ? values[catIdx] : "General";

    let amount = 0;
    let type = "Expense";

    if (debitIdx !== -1 && creditIdx !== -1) {
      const debit =
        parseFloat((values[debitIdx] || "").replace(/[^0-9.-]/g, "")) || 0;
      const credit =
        parseFloat((values[creditIdx] || "").replace(/[^0-9.-]/g, "")) || 0;

      if (credit > 0) {
        amount = credit;
        type = "Income";
      } else if (debit > 0) {
        amount = debit;
        type = "Expense";
      }
    } else if (amountIdx !== -1) {
      const rawAmt =
        parseFloat((values[amountIdx] || "").replace(/[^0-9.-]/g, "")) || 0;
      amount = Math.abs(rawAmt);

      if (typeIdx !== -1 && values[typeIdx]) {
        const rawType = values[typeIdx].toLowerCase();
        if (
          rawType.includes("inc") ||
          rawType.includes("credit") ||
          rawType.includes("deposit")
        ) {
          type = "Income";
        } else if (rawType.includes("trans")) {
          type = "Transfer";
        } else {
          type = "Expense";
        }
      } else {
        type = rawAmt < 0 ? "Expense" : "Income";
      }
    }

    if (amount > 0) {
      rows.push({
        userId: fallbackUserId,
        type,
        category: category || "General",
        amount,
        description: desc.slice(0, 250),
        transactionDate: txnDate,
      });
    }
  }

  return rows;
}

export async function importStatement(req, res) {
  try {
    const userId = await resolveUserId(req);
    let rows = [];

    if (req.file) {
      const content = req.file.buffer.toString("utf8");
      rows = parseCSV(content, userId);
    } else if (Array.isArray(req.body?.rows)) {
      rows = req.body.rows;
    } else if (typeof req.body?.rows === "string") {
      try {
        rows = JSON.parse(req.body.rows);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON format in rows.",
        });
      }
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No valid transactions found in statement. Please verify the file contents.",
      });
    }

    rows = rows.map((r) => ({
      ...r,
      userId: r.userId || userId,
    }));

    const result = await importTransactions(rows);

    return res.status(200).json({
      success: true,
      message: "Statement processed successfully.",
      data: result,
    });
  } catch (error) {
    console.error("importStatement error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to import statement.",
    });
  }
}