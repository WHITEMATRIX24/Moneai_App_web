import { useEffect, useState } from "react";
import { getStoredUser } from "../../services/auth.service.js";

function getInitialForm() {
  const user = getStoredUser();
  return {
    userId: user?._id || "000000000000000000000001",
    accountName: "",
    accountType: "Bank",
    institution: "",
    balance: "",
    currency: "INR",
  };
}

export default function AccountModal({
  open,
  onClose,
  onSave,
  initialData,
}) {
  const [form, setForm] = useState(getInitialForm);

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...initialData } : getInitialForm());
    }
  }, [open, initialData]);

  if (!open) return null;

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "balance" ? Number(value) : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.accountName.trim()) {
      alert("Account Name is required.");
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
              {initialData ? "Edit Account" : "Add Account"}
            </h2>

            <p>
              Enter the account information below.
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
              <label>Account Name</label>

              <input
                name="accountName"
                value={form.accountName}
                onChange={handleChange}
                placeholder="HDFC Savings"
              />
            </div>

            <div className="form-group">
              <label>Account Type</label>

              <select
                name="accountType"
                value={form.accountType}
                onChange={handleChange}
              >
                <option>Bank</option>
                <option>Wallet</option>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Investment</option>
              </select>
            </div>

            <div className="form-group">
              <label>Institution</label>

              <input
                name="institution"
                value={form.institution}
                onChange={handleChange}
                placeholder="HDFC Bank"
              />
            </div>

            <div className="form-group">
              <label>Opening Balance</label>

              <input
                type="number"
                name="balance"
                value={form.balance}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Currency</label>

              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
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
              {initialData ? "Update Account" : "Save Account"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}