import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Download,
} from "lucide-react";

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../services/finance.service.js";

import api from "../../services/api.js";

function getActiveUserId() {
  try {
    const raw = localStorage.getItem("mone_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?._id) return u._id;
    }
  } catch {}
  return "000000000000000000000001";
}

export default function TransactionsTab({ onRefresh }) {
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef(null);

  const emptyForm = {
    userId: getActiveUserId(),
    type: "Income",
    category: "",
    amount: "",
    description: "",
    transactionDate: new Date()
      .toISOString()
      .split("T")[0],
  };

  const [form, setForm] = useState(emptyForm);

  /* =========================================================
     LOAD TRANSACTIONS
  ========================================================= */

  async function loadTransactions() {
    try {
      const data = await getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Unable to load transactions."
      );
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  /* =========================================================
     RESET FORM
  ========================================================= */

  function resetForm() {
    setForm({
      ...emptyForm,
      transactionDate: new Date()
        .toISOString()
        .split("T")[0],
    });

    setEditingId(null);
  }

  /* =========================================================
     SAVE / UPDATE TRANSACTION
  ========================================================= */

  async function handleSave() {
    if (!form.category.trim()) {
      alert("Category is required.");
      return;
    }

    if (!form.amount || isNaN(form.amount)) {
      alert("Please enter a valid amount.");
      return;
    }

    if (Number(form.amount) <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }

    if (Number(form.amount) > 100000000) {
      alert("Amount is too large.");
      return;
    }

    if (!form.transactionDate) {
      alert("Please select a transaction date.");
      return;
    }

    const selectedDate = new Date(
      `${form.transactionDate}T00:00:00`
    );

    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      alert("Future dates are not allowed.");
      return;
    }

    if (form.description.length > 250) {
      alert(
        "Description cannot exceed 250 characters."
      );
      return;
    }

    try {
      if (editingId) {
        await updateTransaction(
          editingId,
          form
        );

        alert(
          "Transaction updated successfully."
        );
      } else {
        await createTransaction(form);

        alert(
          "Transaction added successfully."
        );
      }

      resetForm();

      await loadTransactions();

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          err.message ||
          "Unable to save transaction."
      );
    }
  }

  /* =========================================================
     EDIT TRANSACTION
  ========================================================= */

  function handleEdit(transaction) {
    setEditingId(transaction._id);

    setForm({
      userId:
        transaction.userId?._id ||
        transaction.userId,

      type: transaction.type,

      category:
        transaction.category || "",

      amount:
        transaction.amount ?? "",

      description:
        transaction.description || "",

      transactionDate:
        transaction.transactionDate
          ?.split("T")[0] ||
        new Date()
          .toISOString()
          .split("T")[0],
    });
  }

  /* =========================================================
     DELETE TRANSACTION
  ========================================================= */

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Delete this transaction?"
    );

    if (!confirmed) return;

    try {
      await deleteTransaction(id);

      await loadTransactions();

      if (onRefresh) {
        onRefresh();
      }

      alert(
        "Transaction deleted successfully."
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Unable to delete transaction."
      );
    }
  }

  /* =========================================================
     IMPORT BANK STATEMENT
  ========================================================= */

  function openImportFilePicker() {
    if (importing) return;

    fileInputRef.current?.click();
  }

  async function handleImportStatement(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    /*
     * Clear selected file so the same file
     * can be selected again later.
     */
    event.target.value = "";

    const allowedExtensions = [
      ".csv",
      ".xlsx",
      ".xls",
      ".pdf",
    ];

    const fileName = file.name.toLowerCase();

    const isAllowed =
      allowedExtensions.some((extension) =>
        fileName.endsWith(extension)
      );

    if (!isAllowed) {
      alert(
        "Unsupported file format. Please upload a CSV, Excel or PDF bank statement."
      );

      return;
    }

    const maxFileSize =
      10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      alert(
        "File is too large. Maximum allowed size is 10 MB."
      );

      return;
    }

    try {
      setImporting(true);

      const formData = new FormData();

      formData.append(
        "statement",
        file
      );

      formData.append(
        "userId",
        "000000000000000000000001"
      );

      const response = await api.post(
        "/finance/transactions/import",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      const result = response.data;

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to import statement."
        );
      }

      const imported =
        result.data?.importedCount ?? 0;

      const duplicates =
        result.data?.duplicateCount ?? 0;

      const errors =
        result.data?.errorCount ?? 0;

      await loadTransactions();

      if (onRefresh) {
        onRefresh();
      }

      alert(
        `Statement imported successfully.\n\n` +
          `New transactions: ${imported}\n` +
          `Duplicates skipped: ${duplicates}\n` +
          `Invalid records: ${errors}`
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          err.message ||
          "Unable to import bank statement."
      );
    } finally {
      setImporting(false);
    }
  }

  /* =========================================================
     EXPORT TRANSACTIONS
  ========================================================= */

  function exportTransactions() {
    if (!transactions.length) {
      alert(
        "There are no transactions to export."
      );

      return;
    }

    const headers = [
      "Date",
      "Category",
      "Type",
      "Description",
      "Amount",
    ];

    const rows = transactions.map(
      (transaction) => [
        formatExportValue(
          transaction.transactionDate
            ? new Date(
                transaction.transactionDate
              ).toLocaleDateString()
            : ""
        ),

        formatExportValue(
          transaction.category
        ),

        formatExportValue(
          transaction.type
        ),

        formatExportValue(
          transaction.description || ""
        ),

        formatExportValue(
          transaction.amount
        ),
      ]
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `finance-transactions-${new Date()
        .toISOString()
        .split("T")[0]}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function formatExportValue(value) {
    const text =
      value === null ||
      value === undefined
        ? ""
        : String(value);

    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="transactions-page">

      {/* HEADER */}

      <div className="finance-header">

        <div>
          <h2>Transactions</h2>

          <p>
            Record, import and manage your
            financial transactions.
          </p>
        </div>

        {/* IMPORT / EXPORT */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={
              handleImportStatement
            }
            style={{
              display: "none",
            }}
          />

          <button
            type="button"
            className="finance-import-export-btn"
            onClick={
              openImportFilePicker
            }
            disabled={importing}
          >
            <Upload size={18} />

            {importing
              ? "Importing..."
              : "Import Statement"}
          </button>

          <button
            type="button"
            className="finance-import-export-btn"
            onClick={
              exportTransactions
            }
          >
            <Download size={18} />

            Export Transactions
          </button>

        </div>

      </div>

      {/* TRANSACTION FORM */}

      <div className="transaction-form-card">

        <div className="transaction-grid">

          {/* CATEGORY */}

          <div className="form-group">

            <label>Category</label>

            <input
              className="form-input"
              placeholder="Salary, Food, Shopping..."
              maxLength={40}
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category:
                    e.target.value,
                })
              }
            />

          </div>

          {/* TYPE */}

          <div className="form-group">

            <label>
              Transaction Type
            </label>

            <select
              className="form-input"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value,
                })
              }
            >
              <option>Income</option>
              <option>Expense</option>
              <option>Transfer</option>
            </select>

          </div>

          {/* AMOUNT */}

          <div className="form-group">

            <label>Amount</label>

            <input
              type="number"
              min="1"
              max="100000000"
              className="form-input"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  amount:
                    e.target.value === ""
                      ? ""
                      : Number(
                          e.target.value
                        ),
                })
              }
            />

          </div>

          {/* DATE */}

          <div className="form-group">

            <label>Date</label>

            <input
              type="date"
              className="form-input"
              value={
                form.transactionDate
              }
              max={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  transactionDate:
                    e.target.value,
                })
              }
            />

          </div>

          {/* DESCRIPTION */}

          <div
            className="form-group"
            style={{
              gridColumn:
                "1 / -1",
            }}
          >

            <label>
              Description
            </label>

            <textarea
              rows={4}
              maxLength={250}
              className="form-textarea"
              placeholder="Write a short description..."
              value={
                form.description
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
            />

          </div>

        </div>

        {/* SAVE BUTTON */}

        <div className="transaction-footer">

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >

            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
            >

              {editingId ? (
                <>
                  <Pencil size={18} />
                  Update Transaction
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Save Transaction
                </>
              )}

            </button>

            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                <X size={18} />
                Cancel
              </button>
            )}

          </div>

        </div>

      </div>

      {/* TRANSACTION TABLE */}

      <div className="accounts-table-card">

        <table className="accounts-table">

          <thead>

            <tr>

              <th>Date</th>

              <th>Category</th>

              <th>Type</th>

              <th>Description</th>

              <th
                style={{
                  textAlign: "right",
                }}
              >
                Amount
              </th>

              <th
                style={{
                  textAlign: "center",
                }}
              >
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {transactions.length ===
            0 ? (

              <tr>

                <td colSpan="6">

                  <div className="empty-state">

                    <h3>
                      No Transactions Found
                    </h3>

                    <p>
                      Add your first
                      transaction or
                      import a bank
                      statement.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              transactions.map(
                (transaction) => (

                  <tr
                    key={
                      transaction._id
                    }
                  >

                    <td>
                      {new Date(
                        transaction.transactionDate
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <strong>
                        {
                          transaction.category
                        }
                      </strong>
                    </td>

                    <td>

                      <span
                        className={
                          transaction.type ===
                          "Income"
                            ? "status-badge income-badge"
                            : transaction.type ===
                              "Expense"
                            ? "status-badge expense-badge"
                            : "status-badge transfer-badge"
                        }
                      >
                        {
                          transaction.type
                        }
                      </span>

                    </td>

                    <td>
                      {
                        transaction.description ||
                        "-"
                      }
                    </td>

                    <td
                      style={{
                        textAlign:
                          "right",
                        fontWeight: 700,
                        color:
                          transaction.type ===
                          "Income"
                            ? "#16a34a"
                            : transaction.type ===
                              "Expense"
                            ? "#dc2626"
                            : "#2563eb",
                      }}
                    >
                      ₹{" "}
                      {Number(
                        transaction.amount
                      ).toLocaleString()}
                    </td>

                    <td
                      style={{
                        textAlign:
                          "center",
                        whiteSpace:
                          "nowrap",
                      }}
                    >

                      <button
                        type="button"
                        className="icon-btn edit-btn"
                        onClick={() =>
                          handleEdit(
                            transaction
                          )
                        }
                        title="Edit"
                      >
                        <Pencil
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        className="icon-btn delete-btn"
                        onClick={() =>
                          handleDelete(
                            transaction._id
                          )
                        }
                        title="Delete"
                      >
                        <Trash2
                          size={16}
                        />
                      </button>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}