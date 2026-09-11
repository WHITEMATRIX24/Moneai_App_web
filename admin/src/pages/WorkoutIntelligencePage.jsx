// src/pages/health/WorkoutIntelligencePage.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Activity,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  Flame,
  History,
  ListChecks,
  Plus,
  RefreshCw,
  Target,
  Timer,
  TrendingUp,
  X,
  Zap,
  TriangleAlert,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../services/api.js";
import "./WorkoutIntelligencePage.css";



/* =========================================================
   WORKOUT FEATURES
========================================================= */

const workoutFeatures = [
  {
    id: "workout-tracking",
    title: "Workout Tracking",
    description:
      "Track completed workouts and exercise sessions.",
    icon: Dumbbell,
    feature: "WORKOUT_TRACKING",
  },

  {
    id: "workout-performance",
    title: "Workout Performance",
    description:
      "Monitor workout performance and progress.",
    icon: BarChart3,
    feature: "WORKOUT_PERFORMANCE",
  },

  {
    id: "workout-history",
    title: "Workout History",
    description:
      "Review previous workout sessions and activity.",
    icon: CalendarCheck,
    feature: "WORKOUT_HISTORY",
  },

  {
    id: "exercise-intensity",
    title: "Exercise Intensity",
    description:
      "Monitor exercise intensity during workouts.",
    icon: Zap,
    feature: "EXERCISE_INTENSITY",
  },

  {
    id: "workout-goals",
    title: "Workout Goals",
    description:
      "Set and monitor personal workout goals.",
    icon: Target,
    feature: "WORKOUT_GOALS",
  },

  {
    id: "workout-insights",
    title: "Workout Insights",
    description:
      "Understand workout patterns and performance trends.",
    icon: ListChecks,
    feature: "WORKOUT_INSIGHTS",
  },
];


/* =========================================================
   ID HELPER
========================================================= */

function getId(item) {
  return (
    item?._id ||
    item?.id ||
    null
  );
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    [],
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


/* =========================================================
   DATETIME LOCAL
========================================================= */

function toDateTimeLocal(value) {
  const date =
    value
      ? new Date(value)
      : new Date();

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return new Date()
      .toISOString()
      .slice(0, 16);
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset * 60 * 1000,
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}


/* =========================================================
   RESPONSE ARRAY HELPER
========================================================= */

function getArray(response) {
  const data =
    response?.data;

  if (
    Array.isArray(data)
  ) {
    return data;
  }

  if (
    Array.isArray(
      data?.workouts,
    )
  ) {
    return data.workouts;
  }

  if (
    Array.isArray(
      data?.data,
    )
  ) {
    return data.data;
  }

  if (
    Array.isArray(
      data?.records,
    )
  ) {
    return data.records;
  }

  return [];
}


/* =========================================================
   INTENSITY FORMAT
========================================================= */

function formatIntensity(value) {
  if (!value) {
    return "--";
  }

  const text =
    String(value);

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}


/* =========================================================
   FEATURE CARD
========================================================= */

function WorkoutFeatureCard({
  feature,
  reading,
  onAdd,
  onHistory,
}) {
  const Icon =
    feature.icon;

  return (
    <div className="health-vital-detail-card">

      {/* ===================================================
          TOP
      =================================================== */}

      <div className="health-vital-detail-card__top">

        <div className="health-vital-detail-card__icon">
          <Icon size={21} />
        </div>

        <button
          type="button"
          className="health-vital-history-btn"
          onClick={onHistory}
          title={`View ${feature.title} history`}
        >
          <History size={15} />
        </button>

      </div>


      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="health-vital-detail-card__content">

        <h3>
          {feature.title}
        </h3>

        <p>
          {feature.description}
        </p>

      </div>


      {/* ===================================================
          READING
      =================================================== */}

      <div className="health-vital-detail-card__reading">

        <div>

          <strong>
            {reading
              ? reading.workoutName
              : "--"}
          </strong>

        </div>

        {reading ? (

          <>

            <small>

              {Number(
                reading.duration ?? 0,
              )}

              {" min · "}

              {Number(
                reading.calories ?? 0,
              )}

              {" kcal · "}

              {formatIntensity(
                reading.intensity,
              )}

            </small>

            <small>

              Recorded{" "}

              {formatDate(
                reading.recordedAt ||
                reading.createdAt,
              )}

            </small>

          </>

        ) : (

          <small>
            No data yet
          </small>

        )}

      </div>


      {/* ===================================================
          ACTION
      =================================================== */}

      <button
        type="button"
        className="health-vital-add-btn"
        onClick={onAdd}
      >

        <Plus size={15} />

        Add Activity

      </button>

    </div>
  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  title,
  value,
  unit,
  subtitle,
}) {
  return (
    <div className="summary-card">

      <div className="summary-icon">
        <Icon size={20} />
      </div>

      <div>

        <span>
          {title}
        </span>

        <strong>

          {value}

          {unit && (
            <small className="health-summary-unit">
              {unit}
            </small>
          )}

        </strong>

        <small>
          {subtitle}
        </small>

      </div>

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function WorkoutIntelligencePage() {

  const navigate =
    useNavigate();


  /* =======================================================
     DATABASE DATA
  ======================================================= */

  const [
    workouts,
    setWorkouts,
  ] = useState([]);


  /* =======================================================
     STATES
  ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /* =======================================================
     MODAL
  ======================================================= */

  const [
    selectedFeature,
    setSelectedFeature,
  ] = useState(null);


  /* =======================================================
     FORM
  ======================================================= */

  const [
    workoutName,
    setWorkoutName,
  ] = useState("");

  const [
    duration,
    setDuration,
  ] = useState("");

  const [
    calories,
    setCalories,
  ] = useState("");

  const [
    intensity,
    setIntensity,
  ] = useState("");

  const [
    recordedAt,
    setRecordedAt,
  ] = useState(
    toDateTimeLocal(
      new Date(),
    ),
  );


  /* =======================================================
     LOAD WORKOUTS
  ======================================================= */

  const loadWorkouts =
    useCallback(
      async ({
        showRefresh = false,
      } = {}) => {

        try {

          setErrorMessage("");

          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          console.log(
            "GET /workout-intelligence",
          );

          const response =
            await api.get(
              "/workout-intelligence",
            );

          console.log(
            "Workout GET response:",
            response?.data,
          );

          const loaded =
            getArray(response);

          console.log(
            "Loaded workout records:",
            loaded,
          );

          setWorkouts(
            Array.isArray(loaded)
              ? loaded
              : [],
          );

        } catch (error) {

          console.error(
            "Workout intelligence load error:",
            error,
          );

          console.error(
            "Workout GET error response:",
            error?.response?.data,
          );

          setErrorMessage(
            error?.response
              ?.data
              ?.message ||
            "Unable to load workout data.",
          );

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      [],
    );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    loadWorkouts();

  }, [
    loadWorkouts,
  ]);


  /* =======================================================
     SORT WORKOUTS
  ======================================================= */

  const sortedWorkouts =
    useMemo(() => {

      return [
        ...workouts,
      ].sort(
        (a, b) => {

          const dateA =
            new Date(
              a.recordedAt ||
              a.createdAt ||
              0,
            ).getTime();

          const dateB =
            new Date(
              b.recordedAt ||
              b.createdAt ||
              0,
            ).getTime();

          return dateB - dateA;
        },
      );

    }, [
      workouts,
    ]);


  /* =======================================================
     THIS WEEK
  ======================================================= */

  const weeklyWorkouts =
    useMemo(() => {

      const now =
        new Date();

      const start =
        new Date(now);

      start.setHours(
        0,
        0,
        0,
        0,
      );

      const day =
        start.getDay();

      const diff =
        day === 0
          ? 6
          : day - 1;

      start.setDate(
        start.getDate() -
        diff,
      );

      return workouts.filter(
        (workout) => {

          const date =
            new Date(
              workout.recordedAt ||
              workout.createdAt,
            );

          if (
            Number.isNaN(
              date.getTime(),
            )
          ) {
            return false;
          }

          return (
            date >= start &&
            date <= now
          );

        },
      );

    }, [
      workouts,
    ]);


  /* =======================================================
     SUMMARY
  ======================================================= */

  const weeklySummary =
    useMemo(() => {

      const workoutCount =
        weeklyWorkouts.length;

      const activeMinutes =
        weeklyWorkouts.reduce(
          (
            total,
            workout,
          ) =>
            total +
            Number(
              workout.duration ?? 0,
            ),
          0,
        );

      const caloriesBurned =
        weeklyWorkouts.reduce(
          (
            total,
            workout,
          ) =>
            total +
            Number(
              workout.calories ?? 0,
            ),
          0,
        );

      const sessions =
        workouts.length;

      const intensityValues = {
        low: 1,
        moderate: 2,
        high: 3,
      };

      const validIntensity =
        weeklyWorkouts.filter(
          (workout) =>
            intensityValues[
              String(
                workout.intensity ||
                "",
              ).toLowerCase()
            ],
        );

      let averageIntensity =
        0;

      if (
        validIntensity.length
      ) {

        const total =
          validIntensity.reduce(
            (
              sum,
              workout,
            ) =>
              sum +
              intensityValues[
                String(
                  workout.intensity ||
                  "",
                ).toLowerCase()
              ],
            0,
          );

        averageIntensity =
          total /
          validIntensity.length;
      }

      let performance =
        "No data";

      if (
        averageIntensity >=
        2.5
      ) {
        performance =
          "High";
      } else if (
        averageIntensity >=
        1.5
      ) {
        performance =
          "Moderate";
      } else if (
        averageIntensity > 0
      ) {
        performance =
          "Low";
      }

      return {
        workoutCount,
        activeMinutes,
        caloriesBurned,
        sessions,
        performance,
      };

    }, [
      workouts,
      weeklyWorkouts,
    ]);


  /* =======================================================
     LATEST BY FEATURE
  ======================================================= */

  const latestByFeature =
    useMemo(() => {

      const result = {};

      for (
        const feature of
        workoutFeatures
      ) {

        const matching =
          sortedWorkouts.filter(
            (workout) =>
              String(
                workout.feature ||
                "",
              ).toUpperCase() ===
              feature.feature,
          );

        if (
          matching.length
        ) {

          result[
            feature.id
          ] =
            matching[0];

        }

      }

      return result;

    }, [
      sortedWorkouts,
    ]);


  /* =======================================================
     PERFORMANCE DATA
  ======================================================= */

  const performanceData =
    useMemo(() => {

      const sessions =
        workouts.length;

      if (
        sessions === 0
      ) {

        return {
          sessions: 0,
          intensity: "No data",
          intensityValue: null,
          goalProgress: "No data",
          goalSubtitle:
            "No workout data yet",
          totalDuration: 0,
          totalCalories: 0,
        };

      }

      const intensityValues = {
        low: 1,
        moderate: 2,
        high: 3,
      };

      const intensityEntries =
        workouts
          .map(
            (workout) =>
              intensityValues[
                String(
                  workout.intensity ||
                  "",
                ).toLowerCase()
              ],
          )
          .filter(
            (value) =>
              Number.isFinite(value),
          );

      let averageIntensity =
        0;

      if (
        intensityEntries.length
      ) {

        averageIntensity =
          intensityEntries.reduce(
            (
              total,
              value,
            ) =>
              total + value,
            0,
          ) /
          intensityEntries.length;
      }

      let intensity =
        "No data";

      if (
        averageIntensity >=
        2.5
      ) {
        intensity =
          "High";
      } else if (
        averageIntensity >=
        1.5
      ) {
        intensity =
          "Moderate";
      } else if (
        averageIntensity > 0
      ) {
        intensity =
          "Low";
      }

      const totalDuration =
        workouts.reduce(
          (
            total,
            workout,
          ) =>
            total +
            Number(
              workout.duration ?? 0,
            ),
          0,
        );

      const totalCalories =
        workouts.reduce(
          (
            total,
            workout,
          ) =>
            total +
            Number(
              workout.calories ?? 0,
            ),
          0,
        );

      /*
       * There is no separate goal value in the
       * WorkoutIntelligence database model.
       *
       * Therefore Goal Progress is based on
       * recorded workout sessions instead of
       * inventing a goal value.
       */

      const goalProgress =
        `${sessions} session${
          sessions === 1
            ? ""
            : "s"
        }`;

      const goalSubtitle =
        `${totalDuration} min · ${totalCalories} kcal`;

      return {
        sessions,
        intensity,
        intensityValue:
          averageIntensity,
        goalProgress,
        goalSubtitle,
        totalDuration,
        totalCalories,
      };

    }, [
      workouts,
    ]);


  /* =======================================================
     ADD ACTIVITY
  ======================================================= */

  const handleAddActivity =
    (feature) => {

      setSelectedFeature(
        feature,
      );

      setWorkoutName(
        "",
      );

      setDuration(
        "",
      );

      setCalories(
        "",
      );

      setIntensity(
        "",
      );

      setRecordedAt(
        toDateTimeLocal(
          new Date(),
        ),
      );

      setErrorMessage("");
      setSuccessMessage("");

    };


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const handleCloseModal =
    () => {

      if (saving) {
        return;
      }

      setSelectedFeature(
        null,
      );

      setErrorMessage("");

    };


  /* =======================================================
     HISTORY
  ======================================================= */

  const handleHistory =
    (feature) => {

      const history =
        sortedWorkouts.filter(
          (workout) =>
            String(
              workout.feature ||
              "",
            ).toUpperCase() ===
            feature.feature,
        );

      if (
        history.length === 0
      ) {

        window.alert(
          `No ${feature.title.toLowerCase()} data has been saved yet.`,
        );

        return;
      }

      const latest =
        history[0];

      window.alert(
        `${feature.title}\n\n` +
        `Workout: ${
          latest.workoutName ||
          "--"
        }\n` +
        `Duration: ${
          latest.duration ?? 0
        } min\n` +
        `Calories: ${
          latest.calories ?? 0
        } kcal\n` +
        `Intensity: ${
          formatIntensity(
            latest.intensity,
          )
        }\n` +
        `Recorded: ${
          formatDate(
            latest.recordedAt ||
            latest.createdAt,
          )
        }\n\n` +
        `${history.length} saved record${
          history.length === 1
            ? ""
            : "s"
        }.`,
      );

    };


  /* =======================================================
     RESET FORM
  ======================================================= */

  const resetForm =
    () => {

      setWorkoutName("");

      setDuration("");

      setCalories("");

      setIntensity("");

      setRecordedAt(
        toDateTimeLocal(
          new Date(),
        ),
      );

    };


  /* =======================================================
     SAVE WORKOUT
  ======================================================= */

  const handleSave =
    async (event) => {

      /*
       * Prevent the browser from submitting
       * the form and reloading the page.
       */

      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (
        !selectedFeature ||
        saving
      ) {
        return;
      }


      /* ===================================================
         CLEAR OLD MESSAGES
      =================================================== */

      setErrorMessage("");
      setSuccessMessage("");


      /* ===================================================
         NAME
      =================================================== */

      const trimmedWorkoutName =
        workoutName.trim();

      if (
        !trimmedWorkoutName
      ) {

        setErrorMessage(
          "Please enter a workout name.",
        );

        return;
      }


      /* ===================================================
         DURATION
      =================================================== */

      if (
        duration === "" ||
        duration === null ||
        duration === undefined
      ) {

        setErrorMessage(
          "Please enter workout duration.",
        );

        return;
      }

      const numericDuration =
        Number(duration);

      if (
        !Number.isFinite(
          numericDuration,
        ) ||
        numericDuration < 0
      ) {

        setErrorMessage(
          "Please enter a valid duration.",
        );

        return;
      }


      /* ===================================================
         CALORIES
      =================================================== */

      if (
        calories === "" ||
        calories === null ||
        calories === undefined
      ) {

        setErrorMessage(
          "Please enter calories burned.",
        );

        return;
      }

      const numericCalories =
        Number(calories);

      if (
        !Number.isFinite(
          numericCalories,
        ) ||
        numericCalories < 0
      ) {

        setErrorMessage(
          "Please enter valid calories.",
        );

        return;
      }


      /* ===================================================
         INTENSITY
      =================================================== */

      if (
        ![
          "low",
          "moderate",
          "high",
        ].includes(
          String(
            intensity,
          ).toLowerCase(),
        )
      ) {

        setErrorMessage(
          "Please select exercise intensity.",
        );

        return;
      }


      /* ===================================================
         DATE
      =================================================== */

      const date =
        recordedAt
          ? new Date(
              recordedAt,
            )
          : new Date();

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {

        setErrorMessage(
          "Please enter a valid date.",
        );

        return;
      }


      /* ===================================================
         PAYLOAD
      =================================================== */

      const payload = {

        feature:
          selectedFeature.feature,

        workoutName:
          trimmedWorkoutName,

        duration:
          numericDuration,

        calories:
          numericCalories,

        intensity:
          String(
            intensity,
          ).toLowerCase(),

        recordedAt:
          date.toISOString(),

      };


      console.log(
        "====================================",
      );

      console.log(
        "POST /workout-intelligence",
      );

      console.log(
        "Workout payload:",
        payload,
      );

      console.log(
        "Selected feature:",
        selectedFeature,
      );

      console.log(
        "====================================",
      );


      /* ===================================================
         SAVE TO DATABASE
      =================================================== */

      try {

        setSaving(true);

        const response =
          await api.post(
            "/workout-intelligence",
            payload,
          );


        console.log(
          "Workout POST response:",
          response?.data,
        );


        const savedWorkout =
          response?.data?.workout;


        console.log(
          "Saved workout returned from server:",
          savedWorkout,
        );


        if (
          !savedWorkout ||
          typeof savedWorkout !==
            "object"
        ) {

          throw new Error(
            "The server did not return the saved workout.",
          );

        }


        /* =================================================
           UPDATE FRONTEND IMMEDIATELY
        ================================================= */

        setWorkouts(
          (previous) => {

            const savedId =
              getId(
                savedWorkout,
              );

            const withoutDuplicate =
              previous.filter(
                (item) => {

                  const existingId =
                    getId(item);

                  if (
                    !savedId ||
                    !existingId
                  ) {
                    return true;
                  }

                  return (
                    String(
                      existingId,
                    ) !==
                    String(
                      savedId,
                    )
                  );

                },
              );

            return [
              savedWorkout,
              ...withoutDuplicate,
            ];

          },
        );


        /* =================================================
           SUCCESS
        ================================================= */

        setSuccessMessage(
          "Workout saved successfully.",
        );


        /* =================================================
           RESET
        ================================================= */

        resetForm();

        setSelectedFeature(
          null,
        );


        /*
         * IMPORTANT:
         * Do NOT call loadWorkouts() here.
         *
         * The POST response already contains
         * the saved database record.
         *
         * Calling GET immediately can replace
         * the state with an empty response and
         * make the page show 0 again.
         */

      } catch (error) {

        console.error(
          "====================================",
        );

        console.error(
          "SAVE WORKOUT ERROR:",
          error,
        );

        console.error(
          "POST STATUS:",
          error?.response?.status,
        );

        console.error(
          "POST RESPONSE:",
          error?.response?.data,
        );

        console.error(
          "====================================",
        );


        setErrorMessage(
          error?.response
            ?.data
            ?.message ||
          error?.message ||
          "Failed to save workout data.",
        );

      } finally {

        setSaving(false);

      }

    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="health-page health-vitals-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="health-notifications-hero">

        <div className="notifications-hero__content">

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


          <div className="notifications-eyebrow">
            HEALTH · WORKOUT INTELLIGENCE
          </div>


          <h1>
            Workout Intelligence
          </h1>


          <p>
            Track workouts, intensity,
            performance and get smart
            insights from your saved
            workout data.
          </p>

        </div>


        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={() =>
              loadWorkouts({
                showRefresh: true,
              })
            }
            disabled={refreshing}
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "health-refresh-spinning"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {errorMessage && (

        <div className="health-error-message">

          <TriangleAlert size={17} />

          <span>
            {errorMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setErrorMessage("")
            }
          >
            <X size={15} />
          </button>

        </div>

      )}


      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {successMessage && (

        <div className="health-success-message">

          <CheckCircle2 size={17} />

          <span>
            {successMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
          >
            <X size={15} />
          </button>

        </div>

      )}


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="health-summary-notification-grid">

        <SummaryCard
          icon={Dumbbell}
          title="Workouts This Week"
          value={
            weeklySummary.workoutCount
          }
          subtitle="Recorded this week"
        />

        <SummaryCard
          icon={Timer}
          title="Active Time"
          value={
            weeklySummary.activeMinutes
          }
          unit="min"
          subtitle="This week's workout time"
        />

        <SummaryCard
          icon={Flame}
          title="Calories Burned"
          value={
            weeklySummary.caloriesBurned
          }
          unit="kcal"
          subtitle="This week's calories"
        />

        <SummaryCard
          icon={Activity}
          title="Performance"
          value={
            weeklySummary.performance
          }
          subtitle="Based on workout intensity"
        />

      </section>


      {/* =====================================================
          WORKOUT MODULES
      ===================================================== */}

      <section className="health-main-card">

        <div className="health-main-header">

          <div>

            <div className="notifications-eyebrow">
              WORKOUT MODULES
            </div>

            <h2>
              Workout Tracking & Intelligence
            </h2>

            <p>
              Save your workout activity
              and monitor each workout
              intelligence feature.
            </p>

          </div>

          <div>
            <strong>
              {workouts.length}
            </strong>

            <span>
              Total sessions
            </span>
          </div>

        </div>


        {loading ? (

          <div className="health-monitoring-loading">

            <RefreshCw
              size={20}
              className="health-refresh-spinning"
            />

            Loading workout data...

          </div>

        ) : (

          <div className="health-vitals-detail-grid">

            {workoutFeatures.map(
              (feature) => (

                <WorkoutFeatureCard
                  key={feature.id}
                  feature={feature}
                  reading={
                    latestByFeature[
                      feature.id
                    ]
                  }
                  onAdd={() =>
                    handleAddActivity(
                      feature,
                    )
                  }
                  onHistory={() =>
                    handleHistory(
                      feature,
                    )
                  }
                />

              ),
            )}

          </div>

        )}

      </section>


      {/* =====================================================
          PERFORMANCE
      ===================================================== */}

      <section className="health-main-card">

        <div className="health-main-header">

          <div>

            <div className="notifications-eyebrow">
              PERFORMANCE
            </div>

            <h2>
              Workout Progress
            </h2>

            <p>
              Performance insights calculated
              from your saved workout data.
            </p>

          </div>

          <TrendingUp size={22} />

        </div>


        <div className="health-summary-notification-grid">

          <SummaryCard
            icon={Activity}
            title="Exercise Sessions"
            value={
              performanceData.sessions
            }
            subtitle="Recorded sessions"
          />


          <SummaryCard
            icon={Zap}
            title="Intensity"
            value={
              performanceData.intensity
            }
            subtitle={
              performanceData.intensityValue !==
              null
                ? "Average saved workout intensity"
                : "No workout data"
            }
          />


          <SummaryCard
            icon={Target}
            title="Goal Progress"
            value={
              performanceData.goalProgress
            }
            subtitle={
              performanceData.goalSubtitle
            }
          />


          <SummaryCard
            icon={TrendingUp}
            title="Workout Performance"
            value={
              weeklySummary.performance
            }
            subtitle={
              weeklySummary.workoutCount > 0
                ? "This week's performance"
                : "No workout data this week"
            }
          />

        </div>

      </section>


      {/* =====================================================
          RECENT WORKOUTS
      ===================================================== */}

      <section className="health-main-card">

        <div className="health-main-header">

          <div>

            <div className="notifications-eyebrow">
              RECENT ACTIVITY
            </div>

            <h2>
              Saved Workouts
            </h2>

            <p>
              Your latest workout records
              stored in the database.
            </p>

          </div>

          <CheckCircle2 size={22} />

        </div>


        {sortedWorkouts.length === 0 ? (

          <div className="health-monitoring-loading">

            <Dumbbell size={20} />

            No workout records saved yet.

          </div>

        ) : (

          <div className="health-workout-history-list">

            {sortedWorkouts
              .slice(0, 10)
              .map(
                (workout) => (

                  <div
                    key={
                      getId(workout) ||
                      `${workout.workoutName}-${workout.recordedAt}`
                    }
                    className="health-workout-history-item"
                  >

                    <div className="health-workout-history-item__icon">
                      <Dumbbell size={18} />
                    </div>


                    <div className="health-workout-history-item__content">

                      <strong>
                        {workout.workoutName}
                      </strong>

                      <small>
                        {formatDate(
                          workout.recordedAt ||
                          workout.createdAt,
                        )}
                      </small>

                    </div>


                    <div className="health-workout-history-item__stats">

                      <span>
                        <Timer size={14} />

                        {Number(
                          workout.duration ?? 0,
                        )}{" "}
                        min
                      </span>

                      <span>
                        <Flame size={14} />

                        {Number(
                          workout.calories ?? 0,
                        )}{" "}
                        kcal
                      </span>

                      <span>
                        <Zap size={14} />

                        {formatIntensity(
                          workout.intensity,
                        )}
                      </span>

                    </div>

                  </div>

                ),
              )}

          </div>

        )}

      </section>


      {/* =====================================================
          ADD / SAVE MODAL
      ===================================================== */}

      {selectedFeature && (

        <div
          className="health-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseModal();
            }

          }}
        >

          <div
            className="health-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workout-modal-title"
          >

            {/* ===============================================
                HEADER
            =============================================== */}

            <div className="health-modal__header">

              <div>

                <div className="notifications-eyebrow">
                  ADD WORKOUT
                </div>

                <h2 id="workout-modal-title">
                  {selectedFeature.title}
                </h2>

                <p>
                  Enter your workout details
                  to save them to your account.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  handleCloseModal
                }
                disabled={saving}
              >
                <X size={18} />
              </button>

            </div>


            {/* ===============================================
                BODY
            =============================================== */}

            <form
              onSubmit={
                handleSave
              }
            >

              <div className="health-modal__body">

                {errorMessage && (

                  <div className="health-error-message">

                    <TriangleAlert
                      size={16}
                    />

                    <span>
                      {errorMessage}
                    </span>

                  </div>

                )}


                {/* WORKOUT NAME */}

                <div className="health-form-group">

                  <label htmlFor="workout-name">
                    Workout Name
                  </label>

                  <input
                    id="workout-name"
                    type="text"
                    value={
                      workoutName
                    }
                    onChange={(event) =>
                      setWorkoutName(
                        event.target.value,
                      )
                    }
                    placeholder="Example: Morning Run"
                    disabled={saving}
                    autoFocus
                  />

                </div>


                {/* DURATION */}

                <div className="health-form-row">

                  <div className="health-form-group">

                    <label htmlFor="workout-duration">
                      Duration
                    </label>

                    <div className="health-input-with-unit">

                      <input
                        id="workout-duration"
                        type="number"
                        min="0"
                        step="1"
                        value={
                          duration
                        }
                        onChange={(event) =>
                          setDuration(
                            event.target.value,
                          )
                        }
                        placeholder="30"
                        disabled={saving}
                      />

                      <span>
                        min
                      </span>

                    </div>

                  </div>


                  {/* CALORIES */}

                  <div className="health-form-group">

                    <label htmlFor="workout-calories">
                      Calories Burned
                    </label>

                    <div className="health-input-with-unit">

                      <input
                        id="workout-calories"
                        type="number"
                        min="0"
                        step="1"
                        value={
                          calories
                        }
                        onChange={(event) =>
                          setCalories(
                            event.target.value,
                          )
                        }
                        placeholder="250"
                        disabled={saving}
                      />

                      <span>
                        kcal
                      </span>

                    </div>

                  </div>

                </div>


                {/* INTENSITY */}

                <div className="health-form-group">

                  <label htmlFor="workout-intensity">
                    Exercise Intensity
                  </label>

                  <select
                    id="workout-intensity"
                    value={
                      intensity
                    }
                    onChange={(event) =>
                      setIntensity(
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  >

                    <option value="">
                      Select intensity
                    </option>

                    <option value="low">
                      Low
                    </option>

                    <option value="moderate">
                      Moderate
                    </option>

                    <option value="high">
                      High
                    </option>

                  </select>

                </div>


                {/* DATE */}

                <div className="health-form-group">

                  <label htmlFor="workout-recorded-at">
                    Recorded Date & Time
                  </label>

                  <input
                    id="workout-recorded-at"
                    type="datetime-local"
                    value={
                      recordedAt
                    }
                    onChange={(event) =>
                      setRecordedAt(
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />

                </div>

              </div>


              {/* =============================================
                  FOOTER
              ============================================= */}

              <div className="health-modal__footer">

                <button
                  type="button"
                  className="health-modal-cancel"
                  onClick={
                    handleCloseModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="health-modal-save"
                  disabled={
                    saving ||
                    !selectedFeature
                  }
                >

                  {saving ? (

                    <>
                      <RefreshCw
                        size={16}
                        className="health-refresh-spinning"
                      />

                      Saving...

                    </>

                  ) : (

                    <>
                      <CheckCircle2
                        size={16}
                      />

                      Save Workout

                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}