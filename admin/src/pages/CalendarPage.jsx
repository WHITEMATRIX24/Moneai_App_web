// src/pages/CalendarPage.jsx

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Trash2,
  ListTodo,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { todoService } from "../services/todo.service.js";
import PageHeader from "../components/PageHeader.jsx";
import "./CalendarPage.css";
import "./TodoPage.css";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Local YYYY-MM-DD key (avoids UTC off-by-one issues from toISOString())
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);

  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await todoService.list({});

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
  }, []);

  const tasksByDay = useMemo(() => {
    const map = new Map();

    for (const todo of todos) {
      if (!todo?.dueAt) continue;

      const due = new Date(todo.dueAt);

      if (Number.isNaN(due.getTime())) continue;

      const key = dateKey(due);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push(todo);
    }

    return map;
  }, [todos]);

  const isOverdue = (todo) => {
    if (!todo?.dueAt || todo.completed) {
      return false;
    }

    const dueDate = new Date(todo.dueAt);

    dueDate.setHours(23, 59, 59, 999);

    return dueDate < new Date();
  };

  const weeks = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sun

    const gridStart = new Date(year, month, 1 - startOffset);

    const days = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i,
      );

      days.push(date);
    }

    const rows = [];

    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }

    return rows;
  }, [cursor]);

  const selectedKey = dateKey(selectedDate);
  const selectedTasks = tasksByDay.get(selectedKey) || [];

  const monthStats = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    let total = 0;
    let completed = 0;
    let overdue = 0;

    for (const [key, dayTasks] of tasksByDay.entries()) {
      const [y, m] = key.split("-").map(Number);

      if (y !== year || m !== month + 1) continue;

      total += dayTasks.length;
      completed += dayTasks.filter((t) => t.completed).length;
      overdue += dayTasks.filter((t) => isOverdue(t)).length;
    }

    return { total, completed, overdue };
  }, [tasksByDay, cursor]);

  const goToPrevMonth = () => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(new Date(today));
  };

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

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) return;

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

  const formatSelectedHeading = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="See your tasks laid out across the month."
      />

      <div className="calendar-page">
        <section className="calendar-hero">
          <div>
            <div className="calendar-hero__eyebrow">
              <CalendarDays size={15} />
              Planning
            </div>

            <h1>{MONTH_LABELS[cursor.getMonth()]} {cursor.getFullYear()}</h1>

            <p>
              {monthStats.total} task{monthStats.total === 1 ? "" : "s"} this
              month · {monthStats.completed} completed
              {monthStats.overdue > 0 && ` · ${monthStats.overdue} overdue`}
            </p>
          </div>

          <button
            type="button"
            className="calendar-refresh-btn"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "todo-spin" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </section>

        {error && (
          <div className="todo-error">
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}

        <div className="calendar-layout">
          <section className="calendar-panel calendar-grid-panel">
            <div className="calendar-nav">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={goToPrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                className="calendar-today-btn"
                onClick={goToToday}
              >
                Today
              </button>

              <button
                type="button"
                className="calendar-nav-btn"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {loading ? (
              <div className="todo-loading">
                <div className="todo-loader" />
                <span>Loading your tasks...</span>
              </div>
            ) : (
              <>
                <div className="calendar-weekday-row">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="calendar-weekday">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="calendar-grid">
                  {weeks.map((week) =>
                    week.map((date) => {
                      const key = dateKey(date);
                      const dayTasks = tasksByDay.get(key) || [];

                      const inCurrentMonth =
                        date.getMonth() === cursor.getMonth();

                      const isToday = isSameDay(date, today);
                      const isSelected = isSameDay(date, selectedDate);

                      const hasOverdue = dayTasks.some((t) => isOverdue(t));

                      return (
                        <button
                          type="button"
                          key={key}
                          className={[
                            "calendar-day",
                            !inCurrentMonth && "outside",
                            isToday && "today",
                            isSelected && "selected",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => setSelectedDate(date)}
                        >
                          <span className="calendar-day-number">
                            {date.getDate()}
                          </span>

                          {dayTasks.length > 0 && (
                            <span className="calendar-day-footer">
                              <span
                                className={`calendar-day-dot ${
                                  hasOverdue ? "overdue" : ""
                                }`}
                              />
                              <span className="calendar-day-count">
                                {dayTasks.length}
                              </span>
                            </span>
                          )}
                        </button>
                      );
                    }),
                  )}
                </div>
              </>
            )}
          </section>

          <section className="calendar-panel calendar-day-panel">
            <div className="calendar-day-panel__heading">
              <span className="todo-section-label">Selected day</span>
              <h2>{formatSelectedHeading(selectedDate)}</h2>
              <p>
                {selectedTasks.length
                  ? `${selectedTasks.length} task${
                      selectedTasks.length === 1 ? "" : "s"
                    } due`
                  : "No tasks due on this day."}
              </p>
            </div>

            {selectedTasks.length ? (
              <div className="todo-list calendar-task-list">
                {selectedTasks.map((todo) => {
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
                            {overdue && (
                              <span className="todo-overdue-badge">
                                Overdue
                              </span>
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
              <div className="todo-empty calendar-empty">
                <div className="todo-empty-icon">
                  <ListTodo size={25} />
                </div>

                <strong>Nothing due here</strong>

                <span>Pick another day, or add a task from the To-Do page.</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}