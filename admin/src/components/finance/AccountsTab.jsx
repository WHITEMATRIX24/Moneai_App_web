import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import AccountModal from "./AccountModal";
import AccountTable from "./AccountTable";

import {
  getAccounts,
  createAccount,
  updateAccount,
  archiveAccount,
} from "../../services/financeAccount.service.js";

export default function AccountsTab({ onRefresh }) {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingAccount, setEditingAccount] = useState(null);

  async function loadAccounts() {
    try {
      const data = await getAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const keyword = search.toLowerCase();

    return (
      account.accountName?.toLowerCase().includes(keyword) ||
      account.institution?.toLowerCase().includes(keyword) ||
      account.accountType?.toLowerCase().includes(keyword)
    );
  });

  async function handleSave(account) {
    try {
      if (editingAccount) {
        await updateAccount(editingAccount._id, account);
      } else {
        await createAccount(account);
      }

      setModalOpen(false);
      setEditingAccount(null);

      await loadAccounts();

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Unable to save account");
    }
  }

  async function handleArchive(id) {
    if (!window.confirm("Archive this account?")) return;

    try {
      await archiveAccount(id);

      await loadAccounts();

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="accounts-page">

      <div className="accounts-toolbar">

        <div className="search-container">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditingAccount(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} />
          Add Account
        </button>

      </div>

      <AccountTable
        accounts={filteredAccounts}
        onEdit={(account) => {
          setEditingAccount(account);
          setModalOpen(true);
        }}
        onArchive={handleArchive}
      />

      <AccountModal
        open={modalOpen}
        initialData={editingAccount}
        onClose={() => {
          setModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSave}
      />

    </div>
  );
}