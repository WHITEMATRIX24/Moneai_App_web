import {
  Pencil,
  Trash2,
} from "lucide-react";
import { useCurrency } from "../../utils/currency.js";

export default function GoalTable({
  goals,
  onEdit,
  onArchive,
}) {
  const { formatCurrency } = useCurrency();
  if (goals.length === 0) {
    return (
      <div className="empty-state">

        <h3>No Goals Found</h3>

        <p>
          Create your first financial goal.
        </p>

      </div>
    );
  }

  return (
    <table className="accounts-table">

      <thead>

        <tr>
          <th>Goal</th>
          <th>Target</th>
          <th>Saved</th>
          <th>Remaining</th>
          <th>Progress</th>
          <th>Target Date</th>
          <th>Status</th>
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

        {goals.map((goal) => {

          const targetAmount =
            Number(goal.targetAmount) || 0;

          const savedAmount =
            Number(goal.savedAmount) || 0;

          const remaining = Math.max(
            0,
            targetAmount - savedAmount
          );

          const progress =
            targetAmount > 0
              ? Math.min(
                  100,
                  Math.round(
                    (savedAmount /
                      targetAmount) *
                      100
                  )
                )
              : 0;

          return (
            <tr key={goal._id}>

              <td>
                <strong>
                  {goal.goalName}
                </strong>
              </td>

              <td>
                {formatCurrency(targetAmount)}
              </td>

              <td>
                {formatCurrency(savedAmount)}
              </td>

              <td
                style={{
                  color:
                    remaining > 0
                      ? "#2563eb"
                      : "#16a34a",
                  fontWeight: 700,
                }}
              >
                {formatCurrency(remaining)}
              </td>

              <td
                style={{
                  width: 180,
                }}
              >

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
                        progress === 100
                          ? "#16a34a"
                          : "#2563eb",
                      transition:
                        "width 0.3s ease",
                    }}
                  />

                </div>

                <small>
                  {progress}%
                </small>

              </td>

              <td>
                {goal.targetDate
                  ? new Date(
                      goal.targetDate
                    ).toLocaleDateString()
                  : "-"}
              </td>

              <td>

                <span
                  className={
                    goal.status === "Completed"
                      ? "status-badge income-badge"
                      : goal.status === "Cancelled"
                      ? "status-badge expense-badge"
                      : "status-badge transfer-badge"
                  }
                >
                  {goal.status ||
                    "In Progress"}
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
                    onEdit(goal)
                  }
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>

                <button
                  className="icon-btn delete-btn"
                  onClick={() =>
                    onArchive(goal._id)
                  }
                  title="Archive"
                >
                  <Trash2 size={16} />
                </button>

              </td>

            </tr>
          );
        })}

      </tbody>

    </table>
  );
}