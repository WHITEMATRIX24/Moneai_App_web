import { useEffect, useState } from "react";

const EMPTY_FORM = {
  userId: "000000000000000000000001",
  category: "",
  budgetAmount: "",
  spentAmount: 0,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
};

export default function BudgetModal({
  open,
  onClose,
  onSave,
  initialData,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? { ...initialData }
          : EMPTY_FORM
      );
    }
  }, [open, initialData]);

  if (!open) return null;

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "budgetAmount" ||
        name === "spentAmount" ||
        name === "month" ||
        name === "year"
          ? Number(value)
          : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.category.trim()) {
      alert("Category is required.");
      return;
    }

    if (form.budgetAmount <= 0) {
      alert("Budget amount must be greater than zero.");
      return;
    }

    onSave(form);
  }

  return (
    <div className="modal-overlay">

      <div className="account-modal">

        <div className="account-modal-header">

          <div>
            <h2>
              {initialData
                ? "Edit Budget"
                : "Add Budget"}
            </h2>

            <p>
              Enter your monthly budget details.
            </p>
          </div>

          <button
            className="close-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            <div className="form-group">

              <label>Category</label>

              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Food"
              />

            </div>

            <div className="form-group">

              <label>Budget Amount</label>

              <input
                type="number"
                name="budgetAmount"
                value={form.budgetAmount}
                onChange={handleChange}
                placeholder="10000"
              />

            </div>

            <div className="form-group">

              <label>Month</label>

              <input
                type="number"
                min="1"
                max="12"
                name="month"
                value={form.month}
                onChange={handleChange}
              />

            </div>

            <div className="form-group">

              <label>Year</label>

              <input
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
              />

            </div>

          </div>

          <div className="modal-footer">

            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              {initialData
                ? "Update Budget"
                : "Save Budget"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}