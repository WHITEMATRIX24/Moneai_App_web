import { Pencil, Archive } from "lucide-react";

export default function AccountTable({
  accounts,
  onEdit,
  onArchive,
}) {
  return (
    <div className="accounts-table-card">

      <table className="accounts-table">

        <thead>

          <tr>
            <th>Account</th>
            <th>Type</th>
            <th>Institution</th>
            <th style={{ textAlign: "right" }}>Balance</th>
            <th>Status</th>
            <th style={{ textAlign: "center" }}>Actions</th>
          </tr>

        </thead>

        <tbody>

          {accounts.length === 0 ? (

            <tr>
              <td colSpan={6}>

                <div className="empty-state">

                  <h3>No Accounts Found</h3>

                  <p>
                    Create your first finance account to get started.
                  </p>

                </div>

              </td>
            </tr>

          ) : (

            accounts.map((account) => (

              <tr key={account._id}>

                <td>

                  <div className="account-name">

                    <strong>{account.accountName}</strong>

                    <span>{account.currency}</span>

                  </div>

                </td>

                <td>{account.accountType}</td>

                <td>{account.institution || "-"}</td>

                <td className="balance-cell">
                  ₹ {Number(account.balance).toLocaleString()}
                </td>

                <td>

                  <span className="status-badge">
                    Active
                  </span>

                </td>

                <td>

                  <div className="action-buttons">

                    <button
                      className="action-btn"
                      title="Edit"
                      onClick={() => onEdit(account)}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      className="action-btn"
                      title="Archive"
                      onClick={() => onArchive(account._id)}
                    >
                      <Archive size={17} />
                    </button>

                  </div>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}