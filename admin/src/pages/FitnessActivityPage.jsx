// src/pages/health/FitnessActivityPage.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Activity,
  Footprints,
  Route,
  Flame,
  Timer,
  TrendingUp,
  Plus,
  History,
  RefreshCw,
  Dumbbell,
  X,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";

import api from "../services/api.js";
import "./FitnessActivityPage.css";



/* =========================================================
   FITNESS & ACTIVITY DEFINITIONS
========================================================= */

const fitnessItems = [
  {
    id: "steps",
    type: "STEPS",
    title: "Step Tracking",
    description:
      "Track your daily steps and movement.",
    unit: "steps",
    icon: Footprints,
  },

  {
    id: "distance",
    type: "DISTANCE",
    title: "Distance Tracking",
    description:
      "Track walking and running distance.",
    unit: "km",
    icon: Route,
  },

  {
    id: "calories",
    type: "CALORIES",
    title: "Calories Burned",
    description:
      "Track calories burned through physical activity.",
    unit: "kcal",
    icon: Flame,
  },

  {
    id: "active-minutes",
    type: "ACTIVE_MINUTES",
    title: "Active Minutes",
    description:
      "Track active minutes throughout the day.",
    unit: "min",
    icon: Timer,
  },

  {
    id: "activity-level",
    type: "ACTIVITY_LEVEL",
    title: "Activity Levels",
    description:
      "Understand your daily activity level.",
    unit: "",
    icon: Activity,
  },

  {
    id: "daily-movement",
    type: "DAILY_MOVEMENT",
    title: "Daily Movement",
    description:
      "Understand your overall daily movement patterns.",
    unit: "",
    icon: TrendingUp,
  },
];


/* =========================================================
   SUMMARY DEFINITIONS
========================================================= */

const summaryItems = [
  {
    id: "steps",
    type: "STEPS",
    title: "Steps",
    unit: "steps",
    icon: Footprints,
  },

  {
    id: "distance",
    type: "DISTANCE",
    title: "Distance",
    unit: "km",
    icon: Route,
  },

  {
    id: "calories",
    type: "CALORIES",
    title: "Calories",
    unit: "kcal",
    icon: Flame,
  },

  {
    id: "active-minutes",
    type: "ACTIVE_MINUTES",
    title: "Active Minutes",
    unit: "min",
    icon: Timer,
  },
];


/* =========================================================
   HELPERS
========================================================= */

function getId(item) {
  return item?._id || item?.id || null;
}


function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function toDateTimeLocal(value) {
  const date = value
    ? new Date(value)
    : new Date();

  if (Number.isNaN(date.getTime())) {
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


function getResponseData(response) {
  return response?.data || {};
}


function getArray(response, key) {
  const data =
    getResponseData(response);

  if (
    Array.isArray(data?.[key])
  ) {
    return data[key];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  item,
  reading,
}) {
  const Icon = item.icon;

  return (
    <div className="summary-card">

      <div className="summary-icon">
        <Icon size={20} />
      </div>

      <div>

        <span>
          {item.title}
        </span>

        <strong>

          {reading?.value ?? "--"}

          <small className="health-summary-unit">
            {item.unit}
          </small>

        </strong>

        <small>
          {reading
            ? `Updated ${formatDate(
                reading.recordedAt,
              )}`
            : "No reading yet"}
        </small>

      </div>

    </div>
  );
}


/* =========================================================
   FITNESS CARD
========================================================= */

function FitnessCard({
  item,
  reading,
  onAdd,
  onHistory,
}) {
  const Icon = item.icon;

  return (
    <div className="health-vital-detail-card">

      <div className="health-vital-detail-card__top">

        <div className="health-vital-detail-card__icon">
          <Icon size={21} />
        </div>

        <button
          type="button"
          className="health-vital-history-btn"
          onClick={onHistory}
          title={`View ${item.title} history`}
        >
          <History size={15} />
        </button>

      </div>


      <div className="health-vital-detail-card__content">

        <h3>
          {item.title}
        </h3>

        <p>
          {item.description}
        </p>

      </div>


      <div className="health-vital-detail-card__reading">

        <div>

          <strong>
            {reading?.value ?? "--"}
          </strong>

          {item.unit && (
            <span>
              {reading?.unit ||
                item.unit}
            </span>
          )}

        </div>

        <small>
          {reading
            ? `Recorded ${formatDate(
                reading.recordedAt,
              )}`
            : "No reading yet"}
        </small>

      </div>


      <button
        type="button"
        className="health-vital-add-btn"
        onClick={onAdd}
      >

        <Plus size={15} />

        {reading
          ? "Update Activity"
          : "Add Activity Data"}

      </button>

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function FitnessActivityPage() {

  const navigate =
    useNavigate();


  /* =======================================================
     DATABASE DATA
  ======================================================= */

  const [
    activities,
    setActivities,
  ] = useState([]);


  /* =======================================================
     UI
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


  /* =======================================================
     MODAL
  ======================================================= */

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(null);

  const [
    readingValue,
    setReadingValue,
  ] = useState("");

  const [
    readingDate,
    setReadingDate,
  ] = useState(
    toDateTimeLocal(
      new Date(),
    ),
  );


  /* =======================================================
     LOAD DATABASE DATA
  ======================================================= */

  const loadActivities =
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


          const response =
            await api.get(
              "/fitness-activity",
            );


          const loadedActivities =
            getArray(
              response,
              "activities",
            );


          setActivities(
            loadedActivities,
          );

        } catch (error) {

          console.error(
            "Fitness activity load error:",
            error,
          );

          setErrorMessage(
            error?.response?.data
              ?.message ||
              "Unable to load fitness activity data.",
          );

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      [],
    );


  /* =======================================================
     LOAD ON PAGE OPEN
  ======================================================= */

  useEffect(() => {

    loadActivities();

  }, [loadActivities]);


  /* =======================================================
     LATEST READING FOR EACH TYPE
  ======================================================= */

  const readings =
    useMemo(() => {

      const result = {};


      fitnessItems.forEach(
        (item) => {

          const matching =
            activities
              .filter(
                (activity) =>
                  activity.type ===
                  item.type,
              )
              .sort(
                (a, b) =>
                  new Date(
                    b.recordedAt ||
                      b.createdAt ||
                      0,
                  ) -
                  new Date(
                    a.recordedAt ||
                      a.createdAt ||
                      0,
                  ),
              );


          if (matching.length > 0) {

            result[item.id] =
              matching[0];

          }

        },
      );


      return result;

    }, [activities]);


  /* =======================================================
     OPEN ADD / UPDATE
  ======================================================= */

  const handleAdd = (
    item,
  ) => {

    const existing =
      readings[item.id];


    setSelectedItem(item);


    setReadingValue(
      existing?.value !==
        undefined &&
      existing?.value !== null
        ? String(
            existing.value,
          )
        : "",
    );


    setReadingDate(
      toDateTimeLocal(
        existing?.recordedAt ||
          new Date(),
      ),
    );


    setErrorMessage("");

  };


  /* =======================================================
     HERO ADD
  ======================================================= */

  const handleHeroAdd =
    () => {

      handleAdd(
        fitnessItems[0],
      );

    };


  /* =======================================================
     HISTORY
  ======================================================= */

  const handleHistory = (
    item,
  ) => {

    const history =
      activities
        .filter(
          (activity) =>
            activity.type ===
            item.type,
        )
        .sort(
          (a, b) =>
            new Date(
              b.recordedAt ||
                b.createdAt ||
                0,
            ) -
            new Date(
              a.recordedAt ||
                a.createdAt ||
                0,
            ),
        );


    if (
      history.length === 0
    ) {

      window.alert(
        `No ${item.title.toLowerCase()} readings have been added yet.`,
      );

      return;

    }


    const historyText =
      history
        .map(
          (
            record,
            index,
          ) =>
            `${index + 1}. ${
              record.value
            }${
              record.unit
                ? ` ${record.unit}`
                : ""
            } — ${formatDate(
              record.recordedAt ||
                record.createdAt,
            )}`,
        )
        .join("\n");


    window.alert(
      `${item.title} History\n\n${historyText}`,
    );

  };


  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async () => {

      if (!selectedItem) {
        return;
      }


      if (
        readingValue === "" ||
        readingValue ===
          null ||
        readingValue ===
          undefined
      ) {

        setErrorMessage(
          "Please enter a reading.",
        );

        return;

      }


      const numericValue =
        Number(
          readingValue,
        );


      if (
        !Number.isFinite(
          numericValue,
        )
      ) {

        setErrorMessage(
          "Please enter a valid numeric value.",
        );

        return;

      }


      let parsedDate =
        new Date();


      if (readingDate) {

        parsedDate =
          new Date(
            readingDate,
          );


        if (
          Number.isNaN(
            parsedDate.getTime(),
          )
        ) {

          setErrorMessage(
            "Please enter a valid date and time.",
          );

          return;

        }

      }


      try {

        setSaving(true);
        setErrorMessage("");


        /* =================================================
           SAVE TO MONGODB
        ================================================= */

        const response =
          await api.post(
            "/fitness-activity",
            {
              type:
                selectedItem.type,

              value:
                numericValue,

              unit:
                selectedItem.unit ||
                "",

              recordedAt:
                parsedDate.toISOString(),
            },
          );


        const savedActivity =
          response?.data
            ?.activity;


        if (
          savedActivity
        ) {

          /*
           * Add the database record
           * immediately to local state.
           *
           * This is only UI synchronization.
           * The actual data is already
           * stored in MongoDB.
           */

          setActivities(
            (previous) => [
              savedActivity,
              ...previous.filter(
                (activity) =>
                  getId(
                    activity,
                  ) !==
                  getId(
                    savedActivity,
                  ),
              ),
            ],
          );

        } else {

          /*
           * If backend does not return
           * the created record, get it
           * directly from MongoDB again.
           */

          await loadActivities();

        }


        closeModal();


      } catch (error) {

        console.error(
          "Save fitness activity error:",
          error,
        );


        setErrorMessage(
          error?.response?.data
            ?.message ||
            "Failed to save fitness activity.",
        );

      } finally {

        setSaving(false);

      }

    };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async () => {

      await loadActivities({
        showRefresh: true,
      });

    };


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal =
    () => {

      setSelectedItem(
        null,
      );

      setReadingValue(
        "",
      );

      setReadingDate(
        toDateTimeLocal(
          new Date(),
        ),
      );

    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="health-page health-vitals-page">


      {/* ===================================================
          HERO
      =================================================== */}

      <section className="health-notifications-hero">

        <div className="notifications-hero__content">

          <button
            type="button"
            className="health-back-btn"
            onClick={() =>
              navigate(
                "/health",
              )
            }
          >

            <ArrowLeft
              size={16}
            />

            Back to Health

          </button>


          <div className="notifications-eyebrow">

            <Dumbbell
              size={14}
            />

            Health · Fitness & Activity

          </div>


          <h1>
            Fitness & Activity Tracking
          </h1>


          <p>
            Track your daily movement,
            activity levels, distance,
            calories and active minutes.
          </p>

        </div>


        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
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


          <button
            type="button"
            className="create-notification-btn"
            onClick={
              handleHeroAdd
            }
          >

            <Plus
              size={16}
            />

            Add Activity Data

          </button>

        </div>

      </section>


      {/* ===================================================
          ERROR
      =================================================== */}

      {errorMessage && (

        <div
          className="health-error-message"
          role="alert"
        >

          <TriangleAlert
            size={16}
          />

          <span>
            {errorMessage}
          </span>


          <button
            type="button"
            onClick={() =>
              setErrorMessage(
                "",
              )
            }
            aria-label="Close error"
          >

            <X
              size={15}
            />

          </button>

        </div>

      )}


      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="health-summary-notification-grid">

        {summaryItems.map(
          (item) => (

            <SummaryCard
              key={
                item.id
              }
              item={
                item
              }
              reading={
                readings[
                  item.id
                ]
              }
            />

          ),
        )}

      </div>


      {/* ===================================================
          MAIN CARD
      =================================================== */}

      <section className="health-main-card">


        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              FITNESS & ACTIVITY TRACKING
            </span>

            <h2>
              Your Fitness & Activity
            </h2>

            <p>
              Record and monitor your daily movement
              and physical activity.
            </p>

          </div>


          <div className="health-history-icon">

            <Activity
              size={21}
            />

          </div>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="health-monitoring-loading">

            <RefreshCw
              size={22}
              className="health-refresh-spinning"
            />

            <span>
              Loading fitness activity data...
            </span>

          </div>

        ) : (

          <div className="health-vitals-detail-grid">

            {fitnessItems.map(
              (item) => (

                <FitnessCard
                  key={
                    item.id
                  }

                  item={
                    item
                  }

                  reading={
                    readings[
                      item.id
                    ]
                  }

                  onAdd={() =>
                    handleAdd(
                      item,
                    )
                  }

                  onHistory={() =>
                    handleHistory(
                      item,
                    )
                  }
                />

              ),
            )}

          </div>

        )}

      </section>


      {/* ===================================================
          MODAL
      =================================================== */}

      {selectedItem && (

        <div
          className="health-modal-overlay"
          onClick={
            closeModal
          }
        >

          <div
            className="health-modal"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >


            {/* HEADER */}

            <div className="health-modal__header">

              <div>

                <span>
                  ADD ACTIVITY DATA
                </span>

                <h2>
                  {
                    selectedItem.title
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeModal
                }
                className="health-modal-close"
                aria-label="Close"
              >

                ×

              </button>

            </div>


            {/* BODY */}

            <div className="health-modal__body">

              <label htmlFor="fitness-reading">

                Reading

              </label>


              <input
                id="fitness-reading"
                type="number"
                value={
                  readingValue
                }
                onChange={(
                  event,
                ) =>
                  setReadingValue(
                    event.target
                      .value,
                  )
                }
                placeholder={
                  selectedItem.unit
                    ? `Enter value in ${selectedItem.unit}`
                    : "Enter reading"
                }
                disabled={
                  saving
                }
              />


              {selectedItem.unit && (

                <small>

                  Unit:{" "}
                  {
                    selectedItem.unit
                  }

                </small>

              )}


              <label htmlFor="fitness-reading-date">

                Date & Time

              </label>


              <input
                id="fitness-reading-date"
                type="datetime-local"
                value={
                  readingDate
                }
                onChange={(
                  event,
                ) =>
                  setReadingDate(
                    event.target
                      .value,
                  )
                }
                disabled={
                  saving
                }
              />

            </div>


            {/* FOOTER */}

            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >

                Cancel

              </button>


              <button
                type="button"
                className="health-modal-save"
                onClick={
                  handleSave
                }
                disabled={
                  saving
                }
              >

                {saving ? (

                  <>

                    <RefreshCw
                      size={15}
                      className="health-refresh-spinning"
                    />

                    Saving...

                  </>

                ) : (

                  <>

                    <CheckCircle2
                      size={15}
                    />

                    Save Activity

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );
}