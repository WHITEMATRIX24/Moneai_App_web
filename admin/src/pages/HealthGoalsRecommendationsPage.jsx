import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Target,
  Plus,
  RefreshCw,
  LineChart,
  Sparkles,
  Lightbulb,
  BarChart3,
  CheckCircle2,
  Trash2,
  X,
} from "lucide-react";

import api from "../services/api.js";
import "./HealthGoalsRecommendationsPage.css";


/* =========================================================
   GOAL DEFINITIONS
========================================================= */

const goalTypes = [
  {
    id: "weight",
    title: "Weight Goal",
    description: "Set and track your target weight.",
    icon: Target,
    placeholder: "Example: 65 kg",
  },
  {
    id: "fitness",
    title: "Fitness Goal",
    description: "Set activity and fitness targets.",
    icon: BarChart3,
    placeholder: "Example: 150 min/week",
  },
  {
    id: "sleep",
    title: "Sleep Goal",
    description: "Improve your sleep duration and quality.",
    icon: LineChart,
    placeholder: "Example: 8 hours/night",
  },
  {
    id: "nutrition",
    title: "Nutrition Goal",
    description: "Set healthy nutrition targets.",
    icon: Target,
    placeholder: "Example: 2000 kcal/day",
  },
  {
    id: "wellness",
    title: "Wellness Goal",
    description: "Improve your overall wellness.",
    icon: Sparkles,
    placeholder: "Example: 20 min/day",
  },
];

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="summary-card">
      <div className="summary-icon">
        <Icon size={20} />
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

/* =========================================================
   GOAL CARD
========================================================= */

function GoalCard({
  goal,
  savedGoal,
  onAdd,
  onDelete,
}) {
  const Icon = goal.icon;

  const hasGoal = Boolean(savedGoal);

  const progress = hasGoal
    ? Math.max(
        0,
        Math.min(
          100,
          Number(savedGoal.progress) || 0,
        ),
      )
    : 0;

  return (
    <div className="health-vital-detail-card">
      <div className="health-vital-detail-card__top">
        <div className="health-vital-detail-card__icon">
          <Icon size={21} />
        </div>

        {hasGoal && (
          <button
            type="button"
            className="health-history-icon"
            onClick={() =>
              onDelete(savedGoal._id)
            }
            title="Delete goal"
            aria-label="Delete goal"
            style={{
              border: "none",
              cursor: "pointer",
            }}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="health-vital-detail-card__content">
        <h3>{goal.title}</h3>

        <p>{goal.description}</p>
      </div>

      <div className="health-vital-detail-card__reading">
        <div>
          <strong>
            {hasGoal
              ? savedGoal.targetValue
              : "--"}
          </strong>
        </div>

        <small>
          {hasGoal
            ? savedGoal.status ===
              "completed"
              ? "Goal completed"
              : `${progress}% progress`
            : "No goal set yet"}
        </small>

        {hasGoal && (
          <div
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "999px",
              background:
                "rgba(25, 51, 79, 0.08)",
              marginTop: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: "999px",
                background:
                  "currentColor",
                transition:
                  "width 0.3s ease",
              }}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        className="health-vital-add-btn"
        onClick={onAdd}
      >
        <Plus size={15} />

        {hasGoal
          ? "Update Goal"
          : "Set Goal"}
      </button>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function HealthGoalsRecommendationsPage() {
  const navigate = useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

  const [savedGoals, setSavedGoals] =
    useState({});

  const [recommendations, setRecommendations] =
    useState([]);

  const [selectedGoal, setSelectedGoal] =
    useState(null);

  const [goalValue, setGoalValue] =
    useState("");

  const [currentValue, setCurrentValue] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [historyOpen, setHistoryOpen] =
    useState(false);

  const [history, setHistory] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  /* =======================================================
     LOAD GOALS
  ======================================================= */

  const loadGoals = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/health-goals",
      );

      const goals =
        response?.data?.goals || [];

      const goalMap = {};

      goals.forEach((goal) => {
        goalMap[goal.goalType] = goal;
      });

      setSavedGoals(goalMap);
    } catch (error) {
      console.error(
        "Failed to load health goals:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD RECOMMENDATIONS
  ======================================================= */

  const loadRecommendations =
    async () => {
      try {
        const response =
          await api.get(
            "/health-goals/recommendations",
          );

        setRecommendations(
          response?.data?.recommendations ||
            [],
        );
      } catch (error) {
        console.error(
          "Failed to load recommendations:",
          error,
        );

        setRecommendations([]);
      }
    };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const loadData = async () => {
      await loadGoals();
      await loadRecommendations();
    };

    loadData();
  }, []);

  /* =======================================================
     ADD / UPDATE GOAL
  ======================================================= */

  const handleAddGoal = (goal) => {
    const existing =
      savedGoals[goal.id];

    setSelectedGoal(goal);

    setGoalValue(
      existing?.targetValue || "",
    );

    setCurrentValue(
      existing?.currentValue || "",
    );

    setNotes(existing?.notes || "");
  };

  /* =======================================================
     SAVE GOAL
  ======================================================= */

  const handleSaveGoal = async () => {
    if (!selectedGoal) {
      return;
    }

    if (
      goalValue === "" ||
      goalValue === null ||
      goalValue === undefined ||
      String(goalValue).trim() === ""
    ) {
      alert("Please enter a goal value.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/health-goals", {
        goalType: selectedGoal.id,
        targetValue: String(
          goalValue,
        ).trim(),
        currentValue: String(
          currentValue || "",
        ).trim(),
        notes: String(notes || "").trim(),
      });

      await loadGoals();
      await loadRecommendations();

      closeModal();
    } catch (error) {
      console.error(
        "Failed to save health goal:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to save health goal.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE GOAL
  ======================================================= */

  const handleDeleteGoal = async (
    goalId,
  ) => {
    if (!goalId) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/health-goals/${goalId}`,
      );

      await loadGoals();
      await loadRecommendations();
    } catch (error) {
      console.error(
        "Failed to delete health goal:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to delete health goal.",
      );
    }
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    setSelectedGoal(null);
    setGoalValue("");
    setCurrentValue("");
    setNotes("");
  };

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        loadGoals(),
        loadRecommendations(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     HISTORY
  ======================================================= */

  const handleOpenHistory =
    async () => {
      try {
        setHistoryOpen(true);
        setHistoryLoading(true);

        const response =
          await api.get(
            "/health-goals/history",
          );

        setHistory(
          response?.data?.history || [],
        );
      } catch (error) {
        console.error(
          "Failed to load goal history:",
          error,
        );

        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

  /* =======================================================
     SUMMARY
  ======================================================= */

  const activeGoals = useMemo(() => {
    return Object.values(savedGoals).filter(
      (goal) =>
        goal.status !== "completed",
    );
  }, [savedGoals]);

  const completedGoals = useMemo(() => {
    return Object.values(savedGoals).filter(
      (goal) =>
        goal.status === "completed",
    );
  }, [savedGoals]);

  const overallProgress = useMemo(() => {
    const goals =
      Object.values(savedGoals);

    if (!goals.length) {
      return 0;
    }

    const total = goals.reduce(
      (sum, goal) =>
        sum +
        (Number(goal.progress) || 0),
      0,
    );

    return Math.round(
      total / goals.length,
    );
  }, [savedGoals]);

  /* =======================================================
     HELPERS
  ======================================================= */

  const getGoalTitle = (goalType) => {
    return (
      goalTypes.find(
        (goal) => goal.id === goalType,
      )?.title || "Health Goal"
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "--";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "--";
    }

    return parsed.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="health-page health-goals-page">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="health-notifications-hero">
        <div className="notifications-hero__content">
          {/* BACK */}

          <button
            type="button"
            className="health-back-btn"
            onClick={() =>
              navigate("/health")
            }
          >
            <ArrowLeft size={16} />

            Back to Health
          </button>

          {/* EYEBROW */}

          <div className="notifications-eyebrow">
            <Target size={14} />

            Health · Goals &
            Recommendations
          </div>

          {/* TITLE */}

          <h1>
            Health Goals & Personalized
            Recommendations
          </h1>

          {/* DESCRIPTION */}

          <p>
            Set your health goals, monitor
            your progress and receive
            personalized recommendations
            based on your health information.
          </p>
        </div>

        {/* ACTIONS */}

        <div className="notifications-hero__actions">
          <button
            type="button"
            className="notification-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              style={{
                animation: refreshing
                  ? "spin 1s linear infinite"
                  : "none",
              }}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </section>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">
        <SummaryCard
          icon={Target}
          title="Active Goals"
          value={
            loading
              ? "..."
              : activeGoals.length
          }
          subtitle="Goals in progress"
        />

        <SummaryCard
          icon={LineChart}
          title="Goal Progress"
          value={
            loading
              ? "..."
              : `${overallProgress}%`
          }
          subtitle="Overall progress"
        />

        <SummaryCard
          icon={CheckCircle2}
          title="Completed"
          value={
            loading
              ? "..."
              : completedGoals.length
          }
          subtitle="Goals completed"
        />

        <SummaryCard
          icon={Sparkles}
          title="Recommendations"
          value={
            loading
              ? "..."
              : recommendations.length
          }
          subtitle="Personalized insights"
        />
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="health-main-card">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="health-main-header">
          <div>
            <span className="section-kicker">
              HEALTH GOALS
            </span>

            <h2>
              Set Your Health Goals
            </h2>

            <p>
              Choose an area of your health
              and create a personal goal to
              work toward.
            </p>
          </div>

          <button
            type="button"
            className="health-history-icon"
            onClick={handleOpenHistory}
            title="View goal history"
            aria-label="View goal history"
          >
            <LineChart size={21} />
          </button>
        </div>

        {/* ===================================================
            GOALS GRID
        =================================================== */}

        <div className="health-vitals-detail-grid">
          {goalTypes.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              savedGoal={
                savedGoals[goal.id]
              }
              onAdd={() =>
                handleAddGoal(goal)
              }
              onDelete={
                handleDeleteGoal
              }
            />
          ))}
        </div>

        {/* ===================================================
            PERSONALIZED RECOMMENDATIONS
        =================================================== */}

        <div
          style={{
            marginTop: "28px",
            padding: "24px",
            borderRadius: "18px",
            border:
              "1px solid rgba(25, 51, 79, 0.08)",
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <div className="health-history-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <span className="section-kicker">
                PERSONALIZED INSIGHTS
              </span>

              <h2
                style={{
                  margin: "3px 0 0",
                }}
              >
                Personalized
                Recommendations
              </h2>
            </div>
          </div>

          {recommendations.length ===
          0 ? (
            <p
              style={{
                margin: 0,
                color: "#8797aa",
                lineHeight: 1.7,
              }}
            >
              Set a health goal to
              receive personalized
              recommendations based on
              your goals.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
                marginTop: "20px",
              }}
            >
              {recommendations.map(
                (recommendation) => (
                  <div
                    key={
                      recommendation.id
                    }
                    style={{
                      padding: "18px",
                      borderRadius: "14px",
                      background:
                        "#faf8f4",
                    }}
                  >
                    <Lightbulb size={19} />

                    <h3
                      style={{
                        margin:
                          "10px 0 5px",
                      }}
                    >
                      {
                        recommendation.title
                      }
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color:
                          "#8797aa",
                        lineHeight: 1.6,
                      }}
                    >
                      {
                        recommendation.text
                      }
                    </p>

                    <small
                      style={{
                        display: "block",
                        marginTop:
                          "12px",
                        color:
                          "#8797aa",
                      }}
                    >
                      {
                        recommendation.progress
                      }
                      % progress
                    </small>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          SET GOAL MODAL
      ===================================================== */}

      {selectedGoal && (
        <div
          className="health-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="health-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div className="health-modal__header">
              <div>
                <span>
                  SET HEALTH GOAL
                </span>

                <h2>
                  {selectedGoal.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="health-modal-close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}

            <div className="health-modal__body">
              <label htmlFor="goal-value">
                Goal Target
              </label>

              <input
                id="goal-value"
                type="text"
                value={goalValue}
                onChange={(event) =>
                  setGoalValue(
                    event.target.value,
                  )
                }
                placeholder={
                  selectedGoal.placeholder
                }
              />

              <small>
                Enter the target you want
                to achieve.
              </small>

              <label
                htmlFor="current-value"
                style={{
                  marginTop: "16px",
                }}
              >
                Current Value
              </label>

              <input
                id="current-value"
                type="text"
                value={currentValue}
                onChange={(event) =>
                  setCurrentValue(
                    event.target.value,
                  )
                }
                placeholder="Optional"
              />

              <small>
                You can update your current
                value later.
              </small>

              <label
                htmlFor="goal-notes"
                style={{
                  marginTop: "16px",
                }}
              >
                Notes
              </label>

              <textarea
                id="goal-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                placeholder="Optional notes"
                rows={3}
                style={{
                  width: "100%",
                  resize: "vertical",
                }}
              />
            </div>

            {/* FOOTER */}

            <div className="health-modal__footer">
              <button
                type="button"
                className="health-modal-cancel"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="health-modal-save"
                onClick={handleSaveGoal}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Goal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          HISTORY MODAL
      ===================================================== */}

      {historyOpen && (
        <div
          className="health-modal-overlay"
          onClick={() =>
            setHistoryOpen(false)
          }
        >
          <div
            className="health-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="health-modal__header">
              <div>
                <span>
                  GOAL HISTORY
                </span>

                <h2>
                  Health Goal History
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setHistoryOpen(false)
                }
                className="health-modal-close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="health-modal__body">
              {historyLoading ? (
                <p
                  style={{
                    color: "#8797aa",
                  }}
                >
                  Loading goal history...
                </p>
              ) : history.length ===
                0 ? (
                <p
                  style={{
                    color: "#8797aa",
                  }}
                >
                  No health goal history
                  available.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "12px",
                  }}
                >
                  {history.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        padding: "15px",
                        borderRadius:
                          "12px",
                        background:
                          "#faf8f4",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "12px",
                        }}
                      >
                        <strong>
                          {getGoalTitle(
                            item.goalType,
                          )}
                        </strong>

                        <small
                          style={{
                            color:
                              "#8797aa",
                          }}
                        >
                          {formatDate(
                            item.recordedAt,
                          )}
                        </small>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "8px",
                          color:
                            "#8797aa",
                          fontSize:
                            "13px",
                        }}
                      >
                        Target:{" "}
                        <strong>
                          {
                            item.targetValue
                          }
                        </strong>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "5px",
                          color:
                            "#8797aa",
                          fontSize:
                            "13px",
                        }}
                      >
                        Progress:{" "}
                        <strong>
                          {
                            item.progress
                          }
                          %
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="health-modal__footer">
              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setHistoryOpen(false)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}