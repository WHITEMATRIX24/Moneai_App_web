import {
  Pencil,
  Trash2,
} from "lucide-react";

export default function BudgetTable({
  budgets,
  onEdit,
  onArchive,
}) {
  if (budgets.length === 0) {
    return (
      <div className="accounts-table-card">

        <div className="empty-state">

          <h3>No Budgets Found</h3>

          <p>
            Create your first monthly budget.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="accounts-table-card">

      <table className="accounts-table">

        <thead>

          <tr>

            <th>Category</th>

            <th>Budget</th>

            <th>Spent</th>

            <th>Remaining</th>

            <th>Progress</th>

            <th>Status</th>

            <th style={{ textAlign: "center" }}>
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {budgets.map((budget) => {

            const remaining =
              budget.budgetAmount -
              budget.spentAmount;

            const progress =
              budget.budgetAmount === 0
                ? 0
                : Math.min(
                    100,
                    Math.round(
                      (budget.spentAmount /
                        budget.budgetAmount) *
                        100
                    )
                  );

            let status = "On Track";

            if (progress >= 100) {
              status = "Exceeded";
            } else if (progress >= 80) {
              status = "Warning";
            }

            return (
              <tr key={budget._id}>

                <td>

                  <strong>
                    {budget.category}
                  </strong>

                </td>

                <td>
                  ₹{" "}
                  {Number(
                    budget.budgetAmount
                  ).toLocaleString()}
                </td>

                <td>
                  ₹{" "}
                  {Number(
                    budget.spentAmount
                  ).toLocaleString()}
                </td>

                <td
                  style={{
                    color:
                      remaining < 0
                        ? "#dc2626"
                        : "#16a34a",
                    fontWeight: 700,
                  }}
                >
                  ₹{" "}
                  {Number(
                    remaining
                  ).toLocaleString()}
                </td>

                <td style={{ width: 180 }}>

                  <div
                    style={{
                      background: "#e5e7eb",
                      borderRadius: 8,
                      overflow: "hidden",
                      height: 10,
                    }}
                  >

                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        background:
                          progress >= 100
                            ? "#dc2626"
                            : progress >= 80
                            ? "#f59e0b"
                            : "#16a34a",
                      }}
                    />

                  </div>

                  <small>
                    {progress}%
                  </small>

                </td>

                <td>

                  <span
                    className={
                      progress >= 100
                        ? "status-badge expense-badge"
                        : progress >= 80
                        ? "status-badge transfer-badge"
                        : "status-badge income-badge"
                    }
                  >
                    {status}
                  </span>

                </td>

                <td
                  style={{
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >

                  <button
                    className="icon-btn edit-btn"
                    onClick={() =>
                      onEdit(budget)
                    }
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="icon-btn delete-btn"
                    onClick={() =>
                      onArchive(budget._id)
                    }
                  >
                    <Trash2 size={16} />
                  </button>

                </td>

              </tr>
            );

          })}

        </tbody>

      </table>

    </div>
  );
}