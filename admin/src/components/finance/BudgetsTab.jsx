import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import BudgetModal from "./BudgetModal";
import BudgetTable from "./BudgetTable";

import {
  getBudgets,
  createBudget,
  updateBudget,
  archiveBudget,
} from "../../services/financeBudget.service.js";

export default function BudgetsTab({ onRefresh }) {
  const [budgets, setBudgets] = useState([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  async function loadBudgets() {
    try {
      const data = await getBudgets();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadBudgets();
  }, []);

  const filteredBudgets = budgets.filter((budget) =>
    budget.category
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  async function handleSave(budget) {
    try {
      if (editingBudget) {
        await updateBudget(editingBudget._id, budget);
      } else {
        await createBudget(budget);
      }

      setModalOpen(false);
      setEditingBudget(null);

      await loadBudgets();

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Unable to save budget.");
    }
  }

  async function handleArchive(id) {
    if (!window.confirm("Archive this budget?"))
      return;

    try {
      await archiveBudget(id);

      await loadBudgets();

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
            placeholder="Search budget..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditingBudget(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} />
          Add Budget
        </button>

      </div>

      <BudgetTable
        budgets={filteredBudgets}
        onEdit={(budget) => {
          setEditingBudget(budget);
          setModalOpen(true);
        }}
        onArchive={handleArchive}
      />

      <BudgetModal
        open={modalOpen}
        initialData={editingBudget}
        onClose={() => {
          setModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSave}
      />

    </div>
  );
}