// src/pages/MedicinesPage.jsx

import { useEffect, useMemo, useState } from "react";
import {
  Pill,
  Clock3,
  Check,
  Plus,
  Trash2,
  Pencil,
  X,
  ListChecks,
  AlertTriangle,
  RefreshCw,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

import { medicineService } from "../services/medicine.service.js";
import PageHeader from "../components/PageHeader.jsx";
import { exportToPdf } from "../services/export.service.js";
import "./MedicinesPage.css";

// ── Helpers ────────────────────────────────────────────────────────────

function formatTime12(time) {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const m = (mStr || "00").padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

const WEEKDAYS = [
  { value: 0, short: "S", label: "Sunday" },
  { value: 1, short: "M", label: "Monday" },
  { value: 2, short: "T", label: "Tuesday" },
  { value: 3, short: "W", label: "Wednesday" },
  { value: 4, short: "T", label: "Thursday" },
  { value: 5, short: "F", label: "Friday" },
  { value: 6, short: "S", label: "Saturday" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDays(days) {
  if (!days || !days.length) return "No days selected";
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.map((d) => WEEKDAYS[d].label.slice(0, 3)).join(", ");
}

function formatSchedule(medicine) {
  const frequency = medicine.frequency || "EVERYDAY";
  if (frequency === "ONE_TIME") {
    if (!medicine.onceDate) return "One-time";
    const [y, m, d] = medicine.onceDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return `One-time · ${date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  if (frequency === "CUSTOM_DAYS") return formatDays(medicine.days);
  return "Every day";
}

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

const emptyForm = {
  personName: "Me",
  name: "",
  dosage: "",
  notes: "",
  times: [""],
  frequency: "EVERYDAY",
  days: [],
  onceDate: "",
};

// ── Mini Dose Calendar ─────────────────────────────────────────────────

function MiniDoseCalendar({ medicines }) {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selected, setSelected] = useState(null);

  const { year, month } = view;

  function prevMonth() {
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
    setSelected(null);
  }

  function nextMonth() {
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
    setSelected(null);
  }

  // Build dose map: dateStr → [medicine names]
  const dosesByDate = useMemo(() => {
    const map = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dow = date.getDay();
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;
      const names = [];

      medicines.forEach((med) => {
        const freq = med.frequency || "EVERYDAY";
        if (freq === "EVERYDAY") {
          names.push(med.name);
        } else if (freq === "CUSTOM_DAYS") {
          if ((med.days || []).includes(dow)) names.push(med.name);
        } else if (freq === "ONE_TIME") {
          if (med.onceDate === dateStr) names.push(med.name);
        }
      });

      if (names.length) map[dateStr] = names;
    }
    return map;
  }, [medicines, year, month]);

  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDoses = selected ? dosesByDate[selected] || [] : [];

  return (
    <div className="med-mini-cal">
      {/* Month nav */}
      <div className="med-mini-cal__nav">
        <button
          className="med-mini-cal__nav-btn"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="med-mini-cal__title">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          className="med-mini-cal__nav-btn"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day grid */}
      <div className="med-mini-cal__grid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="med-mini-cal__dow">
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="med-mini-cal__empty" />;

          const mm = String(month + 1).padStart(2, "0");
          const dd = String(day).padStart(2, "0");
          const dateStr = `${year}-${mm}-${dd}`;
          const hasDoses = !!dosesByDate[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = selected === dateStr;

          return (
            <button
              key={day}
              className={[
                "med-mini-cal__day",
                hasDoses ? "has-doses" : "",
                isToday ? "is-today" : "",
                isSelected ? "is-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelected(isSelected ? null : dateStr)}
              aria-label={`${day} ${MONTH_NAMES[month]}${hasDoses ? ` — ${dosesByDate[dateStr].length} dose(s)` : ""}`}
            >
              {day}
              {hasDoses && (
                <span className="med-mini-cal__dot" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected-day details */}
      {selected && (
        <div className="med-mini-cal__detail">
          <p className="med-mini-cal__detail-date">
            {new Date(`${selected}T00:00:00`).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          {selectedDoses.length ? (
            <ul className="med-mini-cal__detail-list">
              {selectedDoses.map((name, i) => (
                <li key={i}>
                  <Pill size={11} />
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="med-mini-cal__detail-empty">No doses this day.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [todayDoses, setTodayDoses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [personFilter, setPersonFilter] = useState("ALL");

  const [busyDoseKey, setBusyDoseKey] = useState(null);
  const [busyMedId, setBusyMedId] = useState(null);

  // ── Load ──────────────────────────────────────────────────────────────

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [medsRes, dosesRes] = await Promise.all([
        medicineService.list(),
        medicineService.listToday(),
      ]);
      setMedicines(
        Array.isArray(medsRes?.data?.medicines) ? medsRes.data.medicines : []
      );
      setTodayDoses(
        Array.isArray(dosesRes?.data?.doses) ? dosesRes.data.doses : []
      );
    } catch (err) {
      console.error("Failed to load medicines:", err);
      setMedicines([]);
      setTodayDoses([]);
      setError("Unable to load your medicines.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────

  const people = useMemo(() => {
    const names = new Set();
    medicines.forEach((m) => names.add((m.personName || "Me").trim() || "Me"));
    todayDoses.forEach((d) => names.add((d.personName || "Me").trim() || "Me"));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [medicines, todayDoses]);

  const filteredMedicines = useMemo(() => {
    if (personFilter === "ALL") return medicines;
    return medicines.filter(
      (m) => (m.personName || "Me").trim() === personFilter
    );
  }, [medicines, personFilter]);

  const filteredDoses = useMemo(() => {
    if (personFilter === "ALL") return todayDoses;
    return todayDoses.filter(
      (d) => (d.personName || "Me").trim() === personFilter
    );
  }, [todayDoses, personFilter]);

  const sortedDoses = useMemo(() => {
    return [...filteredDoses].sort((a, b) => {
      const p = (a.personName || "Me").localeCompare(b.personName || "Me");
      if (p !== 0) return p;
      return (a.time || "").localeCompare(b.time || "");
    });
  }, [filteredDoses]);

  const stats = useMemo(() => {
    const dosesToday = filteredDoses.length;
    const takenToday = filteredDoses.filter((d) => d.taken).length;
    return {
      totalMedicines: filteredMedicines.length,
      dosesToday,
      takenToday,
      remaining: dosesToday - takenToday,
      people: people.length,
    };
  }, [filteredMedicines, filteredDoses, people]);

  const donePercent =
    stats.dosesToday > 0
      ? Math.round((stats.takenToday / stats.dosesToday) * 100)
      : 0;

  // ── Form helpers ──────────────────────────────────────────────────────

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (medicine) => {
    setForm({
      personName: medicine.personName || "Me",
      name: medicine.name || "",
      dosage: medicine.dosage || "",
      notes: medicine.notes || "",
      times: medicine.times?.length ? medicine.times : [""],
      frequency: medicine.frequency || "EVERYDAY",
      days: medicine.days || [],
      onceDate: medicine.onceDate || "",
    });
    setEditingId(medicine._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTimeChange = (index, value) => {
    setForm((prev) => {
      const times = [...prev.times];
      times[index] = value;
      return { ...prev, times };
    });
  };

  const addTimeField = () =>
    setForm((prev) => ({ ...prev, times: [...prev.times, ""] }));

  const removeTimeField = (index) =>
    setForm((prev) => {
      if (prev.times.length <= 1) return prev;
      return { ...prev, times: prev.times.filter((_, i) => i !== index) };
    });

  const setFrequency = (value) =>
    setForm((prev) => ({ ...prev, frequency: value }));

  const toggleDay = (value) =>
    setForm((prev) => {
      const has = prev.days.includes(value);
      return {
        ...prev,
        days: has ? prev.days.filter((d) => d !== value) : [...prev.days, value],
      };
    });

  // ── Submit / Delete ───────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const personName = form.personName.trim() || "Me";
    const name = form.name.trim();
    const times = form.times.map((t) => t.trim()).filter(Boolean);

    if (!name) { setError("Please enter the medicine name."); return; }
    if (!times.length) { setError("Please add at least one time."); return; }
    if (form.frequency === "CUSTOM_DAYS" && !form.days.length) {
      setError("Please select at least one day."); return;
    }
    if (form.frequency === "ONE_TIME" && !form.onceDate) {
      setError("Please pick a date for the one-time reminder."); return;
    }

    setSaving(true);
    setError("");

    const payload = {
      personName, name,
      dosage: form.dosage.trim(),
      notes: form.notes.trim(),
      times,
      frequency: form.frequency,
      days: form.frequency === "CUSTOM_DAYS" ? form.days : [],
      onceDate: form.frequency === "ONE_TIME" ? form.onceDate : null,
    };

    try {
      if (editingId) {
        await medicineService.update(editingId, payload);
      } else {
        await medicineService.create(payload);
      }
      resetForm();
      await load(true);
    } catch (err) {
      console.error("Failed to save medicine:", err);
      setError("Unable to save this medicine.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medicine and its reminders?")) return;
    setBusyMedId(id);
    setError("");
    try {
      await medicineService.remove(id);
      if (editingId === id) resetForm();
      await load(true);
    } catch (err) {
      console.error("Failed to delete medicine:", err);
      setError("Unable to delete this medicine.");
    } finally {
      setBusyMedId(null);
    }
  };

  // ── Dose toggle ───────────────────────────────────────────────────────

  const handleToggleDose = async (dose) => {
    const key = `${dose.medicineId}-${dose.time}`;
    setBusyDoseKey(key);
    setError("");
    try {
      if (dose.taken) {
        await medicineService.markUntaken(dose.medicineId, dose.time);
      } else {
        await medicineService.markTaken(dose.medicineId, dose.time);
      }
      await load();
    } catch (err) {
      console.error("Failed to update dose:", err);
      setError("Unable to update this dose.");
    } finally {
      setBusyDoseKey(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title="Medicines"
        subtitle="Track your medicines and daily dose reminders."
      />

      <div className="medicines-page">
        <div className="med-layout">
          {/* ── LEFT SIDEBAR ── */}
          <div className="med-sidebar">
            {/* Calendar card */}
            <div className="med-sidebar-card">
              <div className="med-sidebar-card__header">
                <div>
                  <span className="med-section-label">Schedule</span>
                  <h3 className="med-sidebar-card__title">Dose Calendar</h3>
                </div>
                <div className="med-sidebar-icon">
                  <CalendarDays size={18} />
                </div>
              </div>
              <MiniDoseCalendar medicines={medicines} />
            </div>

            {/* Stats card */}
            <div className="med-sidebar-card">
              <div className="med-sidebar-card__header">
                <div>
                  <span className="med-section-label">Summary</span>
                  <h3 className="med-sidebar-card__title">Overview</h3>
                </div>
                <div className="med-sidebar-icon">
                  <Pill size={18} />
                </div>
              </div>
              <div className="med-stats-list">
                <div className="med-stat-row">
                  <span className="med-stat-row__icon">
                    <Users size={14} />
                  </span>
                  <span className="med-stat-row__label">People</span>
                  <strong className="med-stat-row__value">{stats.people}</strong>
                </div>
                <div className="med-stat-row">
                  <span className="med-stat-row__icon">
                    <Pill size={14} />
                  </span>
                  <span className="med-stat-row__label">Medicines</span>
                  <strong className="med-stat-row__value">
                    {stats.totalMedicines}
                  </strong>
                </div>
                <div className="med-stat-row">
                  <span className="med-stat-row__icon">
                    <ListChecks size={14} />
                  </span>
                  <span className="med-stat-row__label">Doses today</span>
                  <strong className="med-stat-row__value">
                    {stats.dosesToday}
                  </strong>
                </div>
                <div className="med-stat-row med-stat-row--green">
                  <span className="med-stat-row__icon">
                    <Check size={14} />
                  </span>
                  <span className="med-stat-row__label">Taken</span>
                  <strong className="med-stat-row__value">
                    {stats.takenToday}
                  </strong>
                </div>
                <div className="med-stat-row med-stat-row--orange">
                  <span className="med-stat-row__icon">
                    <Clock3 size={14} />
                  </span>
                  <span className="med-stat-row__label">Remaining</span>
                  <strong className="med-stat-row__value">
                    {stats.remaining}
                  </strong>
                </div>
              </div>
            </div>

            {/* Person filter */}
            {people.length > 1 && (
              <div className="med-sidebar-card">
                <div className="med-sidebar-card__header">
                  <div>
                    <span className="med-section-label">Filter</span>
                    <h3 className="med-sidebar-card__title">By Person</h3>
                  </div>
                  <div className="med-sidebar-icon">
                    <Users size={18} />
                  </div>
                </div>
                <div className="med-pf-list">
                  <button
                    className={`med-pf-btn ${personFilter === "ALL" ? "active" : ""}`}
                    onClick={() => setPersonFilter("ALL")}
                  >
                    Everyone
                  </button>
                  {people.map((person) => (
                    <button
                      key={person}
                      className={`med-pf-btn ${personFilter === person ? "active" : ""}`}
                      onClick={() => setPersonFilter(person)}
                    >
                      <span className="med-pf-avatar">{getInitials(person)}</span>
                      {person}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div className="med-content">
            {/* Top bar */}
            <div className="med-topbar">
              <div>
                <div className="medicines-hero__eyebrow">
                  <Pill size={13} />
                  Health · Reminders
                </div>
                <h1 className="med-topbar__title">Never miss a dose.</h1>
                <p className="med-topbar__sub">
                  Track medicines for yourself or anyone you look after, and
                  check off doses as they're taken.
                </p>
              </div>
              <div className="med-topbar__actions">
                <button
                  type="button"
                  className="medicines-refresh-btn"
                  onClick={() => load(true)}
                  disabled={refreshing}
                >
                  <RefreshCw
                    size={15}
                    className={refreshing ? "todo-spin" : ""}
                  />
                  {refreshing ? "Refreshing" : "Refresh"}
                </button>
                <button
                  type="button"
                  className="export-btn"
                  disabled={loading || !filteredMedicines.length}
                  onClick={() => {
                    const rows = filteredMedicines.map((m) => ({
                      Person: m.personName || "Me",
                      Medicine: m.name,
                      Dosage: m.dosage || "",
                      Frequency: m.frequency || "EVERYDAY",
                      Times: (m.times || []).join(" | "),
                      Notes: m.notes || "",
                    }));
                    exportToPdf(
                      `medicines_${new Date().toISOString().slice(0, 10)}.pdf`,
                      "Medicines",
                      "Medicine list with dosage, schedule and reminder times.",
                      rows
                    );
                  }}
                >
                  <Download size={15} />
                  Export PDF
                </button>
              </div>
            </div>

            {error && (
              <div className="todo-error">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            {/* ── Today's Doses ── */}
            <section className="med-panel">
              <div className="med-panel__head">
                <div>
                  <span className="med-section-label">Today</span>
                  <h2 className="med-panel__title">Today's Doses</h2>
                  <p className="med-panel__sub">
                    Check off each dose as you take it.
                  </p>
                </div>

                {stats.dosesToday > 0 ? (
                  <div className="med-progress-wrap">
                    <div className="med-progress-ring">
                      <svg viewBox="0 0 40 40" className="med-ring-svg">
                        <circle
                          className="med-ring-track"
                          cx="20" cy="20" r="16"
                          fill="none" strokeWidth="4"
                        />
                        <circle
                          className="med-ring-fill"
                          cx="20" cy="20" r="16"
                          fill="none" strokeWidth="4"
                          strokeDasharray={`${donePercent} 100`}
                          strokeDashoffset="25"
                          pathLength="100"
                        />
                      </svg>
                      <span className="med-ring-pct">{donePercent}%</span>
                    </div>
                    <div className="med-progress-text">
                      <strong>{stats.takenToday}</strong> of{" "}
                      <strong>{stats.dosesToday}</strong> taken
                    </div>
                  </div>
                ) : (
                  <div className="med-panel-icon">
                    <Clock3 size={20} />
                  </div>
                )}
              </div>

              {loading ? (
                <div className="todo-loading">
                  <div className="todo-loader" />
                  <span>Loading...</span>
                </div>
              ) : sortedDoses.length ? (
                <div className="med-doses-grid">
                  {sortedDoses.map((dose) => {
                    const key = `${dose.medicineId}-${dose.time}`;
                    return (
                      <article
                        key={key}
                        className={`med-dose-card ${dose.taken ? "taken" : ""}`}
                      >
                        <button
                          type="button"
                          className={`med-dose-check ${dose.taken ? "checked" : ""}`}
                          onClick={() => handleToggleDose(dose)}
                          disabled={busyDoseKey === key}
                          aria-label={
                            dose.taken ? "Mark as not taken" : "Mark as taken"
                          }
                        >
                          {dose.taken && <Check size={14} />}
                        </button>
                        <div className="med-dose-info">
                          <strong className="med-dose-name">{dose.name}</strong>
                          <div className="med-dose-meta">
                            <span className="med-person-badge">
                              {dose.personName || "Me"}
                            </span>
                            {dose.dosage && (
                              <span className="med-dosage-badge">
                                {dose.dosage}
                              </span>
                            )}
                            <span className="med-time-chip">
                              <Clock3 size={11} />
                              {formatTime12(dose.time)}
                            </span>
                          </div>
                        </div>
                        {dose.taken && (
                          <span className="med-done-tag">✓ Done</span>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="todo-empty">
                  <div className="todo-empty-icon">
                    <Pill size={25} />
                  </div>
                  <strong>No doses scheduled today</strong>
                  <span>Add a medicine below to start tracking reminders.</span>
                </div>
              )}
            </section>

            {/* ── Add / Edit Medicine ── */}
            <section className="med-panel med-form-panel">
              <div className="med-panel__head">
                <div>
                  <span className="med-section-label">
                    {editingId ? "Editing" : "New medicine"}
                  </span>
                  <h2 className="med-panel__title">
                    {editingId ? "Update medicine" : "Add a medicine"}
                  </h2>
                  <p className="med-panel__sub">
                    Set who it's for, the dose, times, and how often it repeats.
                  </p>
                </div>
                <div className="med-panel-icon">
                  <Plus size={20} />
                </div>
              </div>

              <form className="med-form" onSubmit={handleSubmit}>
                <div className="med-form-row">
                  <div className="med-field">
                    <label>Who is this for?</label>
                    <input
                      type="text"
                      list="med-person-suggestions"
                      placeholder="e.g. Me, Mom, Dad"
                      value={form.personName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, personName: e.target.value }))
                      }
                    />
                    <datalist id="med-person-suggestions">
                      {people.map((person) => (
                        <option key={person} value={person} />
                      ))}
                    </datalist>
                  </div>

                  <div className="med-field">
                    <label>Medicine name</label>
                    <input
                      type="text"
                      placeholder="e.g. Metformin"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="med-form-row">
                  <div className="med-field">
                    <label>Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg, 2 tablets"
                      value={form.dosage}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, dosage: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="med-field">
                  <label>Times per day</label>
                  <div className="med-times-list">
                    {form.times.map((time, index) => (
                      <div className="med-time-row" key={index}>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) =>
                            handleTimeChange(index, e.target.value)
                          }
                        />
                        {form.times.length > 1 && (
                          <button
                            type="button"
                            className="med-time-remove"
                            onClick={() => removeTimeField(index)}
                            aria-label="Remove this time"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="med-add-time-btn"
                    onClick={addTimeField}
                  >
                    <Plus size={13} />
                    Add another time
                  </button>
                </div>

                <div className="med-field">
                  <label>Frequency</label>
                  <div className="med-freq-row">
                    {[
                      { key: "EVERYDAY", label: "Every day" },
                      { key: "CUSTOM_DAYS", label: "Particular days" },
                      { key: "ONE_TIME", label: "One-time" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        className={`med-freq-option ${form.frequency === key ? "active" : ""}`}
                        onClick={() => setFrequency(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.frequency === "CUSTOM_DAYS" && (
                  <div className="med-field">
                    <label>Repeat on</label>
                    <div className="med-days-row">
                      {WEEKDAYS.map((day) => {
                        const active = form.days.includes(day.value);
                        return (
                          <button
                            type="button"
                            key={day.value}
                            className={`med-day-toggle ${active ? "active" : ""}`}
                            onClick={() => toggleDay(day.value)}
                            aria-pressed={active}
                            aria-label={day.label}
                            title={day.label}
                          >
                            {day.short}
                          </button>
                        );
                      })}
                    </div>
                    <span className="med-days-hint">{formatDays(form.days)}</span>
                  </div>
                )}

                {form.frequency === "ONE_TIME" && (
                  <div className="med-field">
                    <label>Date</label>
                    <input
                      type="date"
                      value={form.onceDate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, onceDate: e.target.value }))
                      }
                    />
                  </div>
                )}

                <div className="med-field">
                  <label>Notes (optional)</label>
                  <textarea
                    placeholder="e.g. take after food"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={2}
                  />
                </div>

                <div className="med-form-actions">
                  <button
                    type="submit"
                    className="todo-add-btn"
                    disabled={saving}
                  >
                    <Plus size={15} />
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Medicine"
                        : "Add Medicine"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="med-cancel-btn"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* ── Medicine List ── */}
            <section className="med-panel">
              <div className="med-panel__head">
                <div>
                  <span className="med-section-label">Management</span>
                  <h2 className="med-panel__title">Your Medicines</h2>
                  <p className="med-panel__sub">
                    Edit dosage, times and frequency, or remove a medicine.
                  </p>
                </div>
                <div className="med-panel-icon">
                  <Pill size={20} />
                </div>
              </div>

              {filteredMedicines.length ? (
                <div className="med-medicine-grid">
                  {filteredMedicines.map((medicine) => (
                    <article className="med-medicine-card" key={medicine._id}>
                      <div className="med-medicine-card__top">
                        <div className="med-medicine-card__avatar">
                          {getInitials(medicine.personName || "Me")}
                        </div>
                        <div className="med-medicine-card__header">
                          <strong className="med-medicine-card__name">
                            {medicine.name}
                          </strong>
                          <span className="med-person-badge">
                            {medicine.personName || "Me"}
                          </span>
                        </div>
                      </div>

                      <div className="med-medicine-card__body">
                        {medicine.dosage && (
                          <span className="med-dosage-badge">
                            {medicine.dosage}
                          </span>
                        )}

                        <div className="med-times-chips">
                          {(medicine.times || []).map((t) => (
                            <span className="med-time-chip" key={t}>
                              <Clock3 size={11} />
                              {formatTime12(t)}
                            </span>
                          ))}
                        </div>

                        <span className="med-days-badge">
                          {formatSchedule(medicine)}
                        </span>

                        {medicine.notes && (
                          <p className="med-notes">{medicine.notes}</p>
                        )}
                      </div>

                      <div className="med-medicine-card__actions">
                        <button
                          type="button"
                          className="todo-action-btn"
                          onClick={() => startEdit(medicine)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="todo-action-btn delete"
                          disabled={busyMedId === medicine._id}
                          onClick={() => handleDelete(medicine._id)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="todo-empty">
                  <div className="todo-empty-icon">
                    <Pill size={25} />
                  </div>
                  <strong>No medicines yet</strong>
                  <span>Add your first medicine above.</span>
                </div>
              )}
            </section>
          </div>
          {/* end .med-content */}
        </div>
        {/* end .med-layout */}
      </div>
    </>
  );
}