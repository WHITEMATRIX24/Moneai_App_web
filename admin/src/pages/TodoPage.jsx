// src/pages/TodoPage.jsx

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  RotateCcw,
  Check,
  ListTodo,
  CircleCheckBig,
  Clock3,
  CalendarDays,
  AlertTriangle,
  RefreshCw,
  Download,
} from "lucide-react";

import { todoService } from "../services/todo.service.js";
import PageHeader from "../components/PageHeader.jsx";
import { exportToPdf } from "../services/export.service.js";
import "./TodoPage.css";

export default function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  // ==========================================
  // HELPERS
  // ==========================================

  const formatDate = (value) => {
    if (!value) return "No due date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "No due date";
    }

    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isOverdue = (todo) => {
    if (!todo?.dueAt || todo.completed) {
      return false;
    }

    const dueDate = new Date(todo.dueAt);

    dueDate.setHours(23, 59, 59, 999);

    return dueDate < new Date();
  };

  // ==========================================
  // LOAD TASKS
  // ==========================================

  const load = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const params = {};

      if (filter === "active") {
        params.status = "active";
      }

      if (filter === "completed") {
        params.status = "completed";
      }

      const response = await todoService.list(params);

      setTodos(Array.isArray(response?.data?.todos) ? response.data.todos : []);
    } catch (err) {
      console.error("Failed to load tasks:", err);

      setTodos([]);
      setError("Unable to load your tasks.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  // ==========================================
  // CREATE
  // ==========================================

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    setCreating(true);
    setError("");

    try {
      await todoService.create({
        title: title.trim(),

        ...(dueAt
          ? {
              dueAt,
            }
          : {}),
      });

      setTitle("");
      setDueAt("");

      await load(true);
    } catch (err) {
      console.error("Failed to create task:", err);

      setError("Unable to create task.");
    } finally {
      setCreating(false);
    }
  };

  // ==========================================
  // COMPLETE
  // ==========================================

  const handleComplete = async (id) => {
    setBusyId(id);
    setError("");

    try {
      await todoService.complete(id);

      await load();
    } catch (err) {
      console.error("Failed to complete task:", err);

      setError("Unable to complete task.");
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // REOPEN
  // ==========================================

  const handleReopen = async (id) => {
    setBusyId(id);
    setError("");

    try {
      await todoService.reopen(id);

      await load();
    } catch (err) {
      console.error("Failed to reopen task:", err);

      setError("Unable to reopen task.");
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    setBusyId(id);
    setError("");

    try {
      await todoService.remove(id);

      await load();
    } catch (err) {
      console.error("Failed to delete task:", err);

      setError("Unable to delete task.");
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // STATS
  // ==========================================

  const stats = useMemo(() => {
    const completed = todos.filter((todo) => todo.completed).length;

    const active = todos.filter((todo) => !todo.completed).length;

    const overdue = todos.filter((todo) => isOverdue(todo)).length;

    return {
      total: todos.length,
      active,
      completed,
      overdue,
    };
  }, [todos]);

  return (
    <>
      <PageHeader
        title="To-Do"
        subtitle="Organize tasks, deadlines and daily priorities."
      />

      <div className="todo-page">
        {/* =====================================
            HERO
        ===================================== */}

        <section className="todo-hero">
          <div>
            <div className="todo-hero__eyebrow">
              <ListTodo size={15} />
              Productivity
            </div>

            <h1>Stay on top of your day.</h1>

            <p>
              Capture tasks, manage deadlines and keep track of what needs your
              attention.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="todo-refresh-btn"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "todo-spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>

            <button
              type="button"
              className="export-btn"
              disabled={loading || !todos.length}
              onClick={() => {
                const rows = todos.map((todo) => ({
                  Title: todo.title,
                  Status: todo.completed ? "Completed" : (isOverdue(todo) ? "Overdue" : "Active"),
                  "Due Date": todo.dueAt
                    ? new Date(todo.dueAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                    : "No due date",
                }));
                exportToPdf(
                  `todos_${new Date().toISOString().slice(0, 10)}.pdf`,
                  "To-Do List",
                  "Your tasks, deadlines and daily priorities.",
                  rows
                );
              }}
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </section>

        {/* =====================================
            STATS
        ===================================== */}

        <section className="todo-stats-grid">
          <div className="todo-stat-card">
            <div className="todo-stat-icon">
              <ListTodo size={20} />
            </div>

            <div>
              <span>Total Tasks</span>
              <strong>{stats.total}</strong>
              <small>All tasks</small>
            </div>
          </div>

          <div className="todo-stat-card">
            <div className="todo-stat-icon">
              <Clock3 size={20} />
            </div>

            <div>
              <span>Active</span>
              <strong>{stats.active}</strong>
              <small>Still to complete</small>
            </div>
          </div>

          <div className="todo-stat-card">
            <div className="todo-stat-icon">
              <CircleCheckBig size={20} />
            </div>

            <div>
              <span>Completed</span>
              <strong>{stats.completed}</strong>
              <small>Finished tasks</small>
            </div>
          </div>

          <div className="todo-stat-card">
            <div className="todo-stat-icon">
              <AlertTriangle size={20} />
            </div>

            <div>
              <span>Overdue</span>
              <strong>{stats.overdue}</strong>
              <small>Needs attention</small>
            </div>
          </div>
        </section>

        {/* =====================================
            ADD TASK
        ===================================== */}

        <section className="todo-panel todo-create-panel">
          <div className="todo-panel-heading">
            <div>
              <span>New task</span>

              <h2>Add something to your list</h2>

              <p>Add a task and optionally choose a due date.</p>
            </div>

            <div className="todo-heading-icon">
              <Plus size={20} />
            </div>
          </div>

          <form className="todo-create-form" onSubmit={handleAdd}>
            <div className="todo-title-field">
              <ListTodo size={18} />

              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="todo-date-field">
              <CalendarDays size={17} />

              <input
                type="date"
                lang="en-GB"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>

            <button
              className="todo-add-btn"
              type="submit"
              disabled={creating || !title.trim()}
            >
              <Plus size={16} />

              {creating ? "Adding..." : "Add Task"}
            </button>
          </form>
        </section>

        {/* =====================================
            ERROR
        ===================================== */}

        {error && (
          <div className="todo-error">
            <AlertTriangle size={17} />

            <span>{error}</span>
          </div>
        )}

        {/* =====================================
            TASK LIST
        ===================================== */}

        <section className="todo-panel">
          <div className="todo-list-header">
            <div>
              <span className="todo-section-label">Task list</span>

              <h2>Your Tasks</h2>

              <p>Manage your current and completed tasks.</p>
            </div>

            <div className="todo-filter-tabs">
              {[
                ["all", "All"],
                ["active", "Active"],
                ["completed", "Completed"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`todo-filter-tab ${
                    value === filter ? "active" : ""
                  }`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* =================================
              LOADING
          ================================= */}

          {loading ? (
            <div className="todo-loading">
              <div className="todo-loader" />

              <span>Loading your tasks...</span>
            </div>
          ) : todos.length ? (
            <div className="todo-list">
              {todos.map((todo) => {
                const overdue = isOverdue(todo);

                return (
                  <article
                    className={`todo-item ${
                      todo.completed ? "completed" : ""
                    } ${overdue ? "overdue" : ""}`}
                    key={todo._id}
                  >
                    <div className="todo-item__main">
                      <button
                        type="button"
                        className={`todo-check ${
                          todo.completed ? "checked" : ""
                        }`}
                        onClick={() =>
                          todo.completed
                            ? handleReopen(todo._id)
                            : handleComplete(todo._id)
                        }
                        disabled={busyId === todo._id}
                        aria-label={
                          todo.completed ? "Reopen task" : "Complete task"
                        }
                      >
                        {todo.completed && <Check size={15} />}
                      </button>

                      <div className="todo-item__content">
                        <strong>{todo.title}</strong>

                        <div className="todo-item__meta">
                          <CalendarDays size={13} />

                          <span>
                            {todo.dueAt
                              ? `Due ${formatDate(todo.dueAt)}`
                              : "No due date"}
                          </span>

                          {overdue && (
                            <span className="todo-overdue-badge">Overdue</span>
                          )}

                          {todo.completed && (
                            <span className="todo-completed-badge">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="todo-item__actions">
                      {todo.completed ? (
                        <button
                          type="button"
                          className="todo-action-btn reopen"
                          disabled={busyId === todo._id}
                          onClick={() => handleReopen(todo._id)}
                        >
                          <RotateCcw size={15} />
                          Reopen
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="todo-action-btn complete"
                          disabled={busyId === todo._id}
                          onClick={() => handleComplete(todo._id)}
                        >
                          <Check size={15} />
                          Complete
                        </button>
                      )}

                      <button
                        type="button"
                        className="todo-action-btn delete"
                        disabled={busyId === todo._id}
                        onClick={() => handleDelete(todo._id)}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="todo-empty">
              <div className="todo-empty-icon">
                <ListTodo size={25} />
              </div>

              <strong>
                {filter === "all"
                  ? "No tasks yet"
                  : filter === "active"
                    ? "No active tasks"
                    : "No completed tasks"}
              </strong>

              <span>
                {filter === "all"
                  ? "Add your first task above to get started."
                  : "There are no tasks in this category."}
              </span>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
