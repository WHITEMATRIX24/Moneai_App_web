import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import GoalModal from "./GoalModal";
import GoalTable from "./GoalTable";

import {
  getGoals,
  createGoal,
  updateGoal,
  archiveGoal,
} from "../../services/financeGoal.service.js";

export default function GoalsTab({ onRefresh }) {
  const [goals, setGoals] = useState([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  async function loadGoals() {
    try {
      const data = await getGoals();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  const filteredGoals = goals.filter((goal) =>
    goal.goalName
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  async function handleSave(goal) {
    try {
      if (editingGoal) {
        await updateGoal(
          editingGoal._id,
          goal
        );
      } else {
        await createGoal(goal);
      }

      setModalOpen(false);
      setEditingGoal(null);

      await loadGoals();

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Save goal error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Unable to save goal.";
      alert(msg);
      throw err;
    }
  }

  async function handleArchive(id) {
    if (
      !window.confirm(
        "Archive this goal?"
      )
    )
      return;

    try {
      await archiveGoal(id);

      await loadGoals();

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Archive goal error:", err);
      alert(err.response?.data?.message || err.message || "Failed to archive goal.");
    }
  }

  return (
    <div className="accounts-page">

      <div className="accounts-toolbar">

        <div className="search-container">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search goal..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditingGoal(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} />
          Add Goal
        </button>

      </div>

      <GoalTable
        goals={filteredGoals}
        onEdit={(goal) => {
          setEditingGoal(goal);
          setModalOpen(true);
        }}
        onArchive={handleArchive}
      />

      <GoalModal
        open={modalOpen}
        initialData={editingGoal}
        onClose={() => {
          setModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSave}
      />

    </div>
  );
}