import { useEffect, useState } from "react";
import { getStoredUser } from "../../services/auth.service.js";

function getInitialForm() {
  const user = getStoredUser();
  return {
    userId: user?._id || "000000000000000000000001",
    goalName: "",
    targetAmount: "",
    savedAmount: 0,
    targetDate: new Date().toISOString().split("T")[0],
    status: "In Progress",
  };
}

export default function GoalModal({
  open,
  onClose,
  onSave,
  initialData,
}) {
  const [form, setForm] = useState(getInitialForm);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        userId:
          initialData.userId?._id ||
          initialData.userId ||
          getInitialForm().userId,

        goalName:
          initialData.goalName || "",

        targetAmount:
          Number(initialData.targetAmount) || 0,

        savedAmount:
          Number(initialData.savedAmount) || 0,

        targetDate:
          initialData.targetDate
            ? initialData.targetDate.split("T")[0]
            : getInitialForm().targetDate,

        status:
          initialData.status || "In Progress",
      });
    } else {
      setForm(getInitialForm());
    }
  }, [open, initialData]);

  if (!open) return null;

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "targetAmount" ||
        name === "savedAmount"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const goalName = form.goalName.trim();

    const targetAmount = Number(
      form.targetAmount
    );

    const savedAmount =
      form.savedAmount === "" ||
      form.savedAmount === null ||
      form.savedAmount === undefined
        ? 0
        : Number(form.savedAmount);

    if (!goalName) {
      alert("Goal name is required.");
      return;
    }

    if (
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {
      alert(
        "Target amount must be greater than zero."
      );
      return;
    }

    if (
      !Number.isFinite(savedAmount) ||
      savedAmount < 0
    ) {
      alert(
        "Saved amount cannot be negative."
      );
      return;
    }

    if (savedAmount > targetAmount) {
      alert(
        "Saved amount cannot exceed target amount."
      );
      return;
    }

    if (!form.targetDate) {
      alert("Target date is required.");
      return;
    }

    const payload = {
      userId: form.userId,
      goalName,
      targetAmount,
      savedAmount,
      targetDate: form.targetDate,
      status: form.status,
    };

    console.log(
      "GOAL PAYLOAD:",
      payload
    );

    onSave(payload);
  }

  return (
    <div className="account-modal">

      <div className="account-modal-header">

        <div>
          <h2>
            {initialData
              ? "Edit Goal"
              : "Add Goal"}
          </h2>

          <p>
            Enter your financial goal details.
          </p>
        </div>

        <button
          className="close-btn"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>

      </div>

      <form onSubmit={handleSubmit}>

        <div className="form-grid">

          <div className="form-group">

            <label>Goal Name</label>

            <input
              name="goalName"
              value={form.goalName}
              onChange={handleChange}
              placeholder="Buy MacBook"
              maxLength={100}
            />

          </div>

          <div className="form-group">

            <label>Target Amount</label>

            <input
              type="number"
              name="targetAmount"
              min="1"
              step="0.01"
              value={form.targetAmount}
              onChange={handleChange}
              placeholder="100000"
            />

          </div>

          <div className="form-group">

            <label>Saved Amount</label>

            <input
              type="number"
              name="savedAmount"
              min="0"
              step="0.01"
              value={form.savedAmount}
              onChange={handleChange}
              placeholder="25000"
            />

          </div>

          <div className="form-group">

            <label>Target Date</label>

            <input
              type="date"
              name="targetDate"
              value={form.targetDate}
              onChange={handleChange}
            />

          </div>

          <div className="form-group">

            <label>Status</label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="In Progress">
                In Progress
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>

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
              ? "Update Goal"
              : "Save Goal"}
          </button>

        </div>

      </form>

    </div>
  );
}