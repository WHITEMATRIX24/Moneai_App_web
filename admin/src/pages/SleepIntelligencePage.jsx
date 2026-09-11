// src/pages/health/SleepIntelligencePage.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  MoonStar,
  Clock3,
  Star,
  Moon,
  BedDouble,
  Activity,
  Volume2,
  ShieldAlert,
  AlarmClock,
  Plus,
  History,
  TrendingUp,
  X,
  CheckCircle2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api.js";
import "./SleepIntelligencePage.css";



/* =========================================================
   SLEEP FEATURES
========================================================= */

const sleepFeatures = [

  {
    id: "sleep-duration",
    title: "Sleep Duration",
    description:
      "Track total sleep duration and patterns.",
    unit: "hours",
    feature: "SLEEP_DURATION",
    icon: Clock3,
  },

  {
    id: "sleep-quality",
    title: "Sleep Quality",
    description:
      "Monitor your overall sleep quality.",
    unit: "/100",
    feature: "SLEEP_QUALITY",
    icon: Star,
  },

  {
    id: "sleep-score",
    title: "Sleep Score",
    description:
      "Evaluate your sleep using an overall score.",
    unit: "/100",
    feature: "SLEEP_SCORE",
    icon: MoonStar,
  },

  {
    id: "rem-sleep",
    title: "REM Sleep Analysis",
    description:
      "Analyze REM sleep patterns and duration.",
    unit: "hours",
    feature: "REM_SLEEP",
    icon: Moon,
  },

  {
    id: "light-sleep",
    title: "Light Sleep Analysis",
    description:
      "Track light sleep stages and patterns.",
    unit: "hours",
    feature: "LIGHT_SLEEP",
    icon: Moon,
  },

  {
    id: "deep-sleep",
    title: "Deep Sleep Analysis",
    description:
      "Analyze deep sleep duration and patterns.",
    unit: "hours",
    feature: "DEEP_SLEEP",
    icon: BedDouble,
  },

  {
    id: "sleep-efficiency",
    title: "Sleep Efficiency",
    description:
      "Measure how efficiently you sleep.",
    unit: "%",
    feature: "SLEEP_EFFICIENCY",
    icon: Activity,
  },

  {
    id: "snoring",
    title: "Snoring Detection",
    description:
      "Detect and monitor snoring patterns.",
    unit: "events",
    feature: "SNORING",
    icon: Volume2,
  },

  {
    id: "sleep-apnea",
    title: "Sleep Apnea Risk Detection",
    description:
      "Identify potential sleep apnea risk indicators.",
    unit: "risk",
    feature: "SLEEP_APNEA",
    icon: ShieldAlert,
  },

  {
    id: "smart-wake",
    title: "Smart Wake Suggestions",
    description:
      "Suggest suitable wake-up times based on sleep.",
    unit: "hours",
    feature: "SMART_WAKE",
    icon: AlarmClock,
  },

];


/* =========================================================
   HELPERS
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
      data?.sleep,
    )
  ) {
    return data.sleep;
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


function getId(item) {

  return (
    item?._id ||
    item?.id ||
    null
  );

}


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


function toDateTimeLocal(value) {

  const date =
    value
      ? new Date(value)
      : new Date();

  const offset =
    date.getTimezoneOffset();

  const local =
    new Date(
      date.getTime() -
        offset * 60 * 1000,
    );

  return local
    .toISOString()
    .slice(0, 16);
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
   FEATURE CARD
========================================================= */

function SleepFeatureCard({
  feature,
  reading,
  onAdd,
  onHistory,
}) {

  const Icon =
    feature.icon;


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
          title="View history"
        >

          <History size={15} />

        </button>

      </div>


      <div className="health-vital-detail-card__content">

        <h3>
          {feature.title}
        </h3>

        <p>
          {feature.description}
        </p>

      </div>


      <div className="health-vital-detail-card__reading">

        {reading ? (

          <>

            <div>

              <strong>
                {reading.value}
              </strong>

              <span>
                {" "}
                {reading.unit ||
                  feature.unit}
              </span>

            </div>

            <small>
              Recorded{" "}
              {formatDate(
                reading.recordedAt ||
                reading.createdAt,
              )}
            </small>

          </>

        ) : (

          <>

            <div>

              <strong>
                --
              </strong>

              <span>
                {feature.unit}
              </span>

            </div>

            <small>
              No data yet
            </small>

          </>

        )}

      </div>


      <button
        type="button"
        className="health-vital-add-btn"
        onClick={onAdd}
      >

        <Plus size={15} />

        Add Data

      </button>

    </div>

  );
}


/* =========================================================
   PAGE
========================================================= */

export default function SleepIntelligencePage() {

  const navigate =
    useNavigate();


  /* =======================================================
     DATA
  ======================================================= */

  const [
    sleepRecords,
    setSleepRecords,
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


  const [
    value,
    setValue,
  ] = useState("");


  const [
    dateTime,
    setDateTime,
  ] = useState(
    toDateTimeLocal(
      new Date(),
    ),
  );


  /* =======================================================
     LOAD
  ======================================================= */

  const loadSleepData =
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
            "GET /sleep-intelligence",
          );


          const response =
            await api.get(
              "/sleep-intelligence",
            );


          console.log(
            "Sleep GET response:",
            response?.data,
          );


          const records =
            getArray(response);


          setSleepRecords(
            records,
          );

        } catch (error) {

          console.error(
            "Load sleep data error:",
            error,
          );


          setErrorMessage(
            error?.response
              ?.data
              ?.message ||
            "Unable to load sleep data.",
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

    loadSleepData();

  }, [
    loadSleepData,
  ]);


  /* =======================================================
     SORT
  ======================================================= */

  const sortedRecords =
    useMemo(() => {

      return [
        ...sleepRecords,
      ].sort(
        (a, b) => {

          const aDate =
            new Date(
              a.recordedAt ||
              a.createdAt ||
              0,
            ).getTime();

          const bDate =
            new Date(
              b.recordedAt ||
              b.createdAt ||
              0,
            ).getTime();

          return bDate - aDate;

        },
      );

    }, [
      sleepRecords,
    ]);


  /* =======================================================
     LATEST BY FEATURE
  ======================================================= */

  const latestByFeature =
    useMemo(() => {

      const result = {};

      for (
        const feature of
        sleepFeatures
      ) {

        const record =
          sortedRecords.find(
            (item) =>
              item.feature ===
              feature.feature,
          );


        if (record) {

          result[
            feature.id
          ] =
            record;

        }

      }

      return result;

    }, [
      sortedRecords,
    ]);


  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary =
    useMemo(() => {

      const duration =
        latestByFeature[
          "sleep-duration"
        ];

      const score =
        latestByFeature[
          "sleep-score"
        ];

      const deep =
        latestByFeature[
          "deep-sleep"
        ];

      const efficiency =
        latestByFeature[
          "sleep-efficiency"
        ];


      return {

        duration:
          duration?.value ??
          "--",

        score:
          score?.value ??
          "--",

        deep:
          deep?.value ??
          "--",

        efficiency:
          efficiency?.value ??
          "--",

      };

    }, [
      latestByFeature,
    ]);


  /* =======================================================
     ADD
  ======================================================= */

  const handleAdd =
    (feature) => {

      setSelectedFeature(
        feature,
      );

      setValue("");

      setDateTime(
        toDateTimeLocal(
          new Date(),
        ),
      );

      setErrorMessage("");
      setSuccessMessage("");

    };


  /* =======================================================
     CLOSE
  ======================================================= */

  const handleClose =
    () => {

      if (saving) {
        return;
      }

      setSelectedFeature(
        null,
      );

      setValue("");

      setErrorMessage("");

    };


  /* =======================================================
     HISTORY
  ======================================================= */

  const handleHistory =
    (feature) => {

      const history =
        sortedRecords.filter(
          (record) =>
            record.feature ===
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

        `Value: ${
          latest.value
        } ${
          latest.unit ||
          feature.unit
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
        }.`

      );

    };


  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async (event) => {

      event?.preventDefault();
      event?.stopPropagation();


      if (
        !selectedFeature ||
        saving
      ) {
        return;
      }


      setErrorMessage("");
      setSuccessMessage("");


      /* ===================================================
         VALUE
      =================================================== */

      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {

        setErrorMessage(
          "Please enter a value.",
        );

        return;
      }


      const numericValue =
        Number(value);


      if (
        !Number.isFinite(
          numericValue,
        ) ||
        numericValue < 0
      ) {

        setErrorMessage(
          "Please enter a valid value.",
        );

        return;
      }


      /* ===================================================
         DATE
      =================================================== */

      const date =
        dateTime
          ? new Date(
              dateTime,
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

        value:
          numericValue,

        unit:
          selectedFeature.unit,

        recordedAt:
          date.toISOString(),

      };


      console.log(
        "====================================",
      );

      console.log(
        "POST /sleep-intelligence",
      );

      console.log(
        "Sleep payload:",
        payload,
      );

      console.log(
        "====================================",
      );


      /* ===================================================
         POST
      =================================================== */

      try {

        setSaving(true);


        const response =
          await api.post(
            "/sleep-intelligence",
            payload,
          );


        console.log(
          "Sleep POST response:",
          response?.data,
        );


        const savedSleep =
          response?.data?.sleep;


        if (
          !savedSleep ||
          typeof savedSleep !==
            "object"
        ) {

          throw new Error(
            "The server did not return the saved sleep record.",
          );

        }


        /* =================================================
           UPDATE STATE IMMEDIATELY
        ================================================= */

        setSleepRecords(
          (previous) => {

            const savedId =
              getId(
                savedSleep,
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
              savedSleep,
              ...withoutDuplicate,
            ];

          },
        );


        /* =================================================
           SUCCESS
        ================================================= */

        setSuccessMessage(
          "Sleep data saved successfully.",
        );


        setValue("");

        setSelectedFeature(
          null,
        );


      } catch (error) {

        console.error(
          "Save sleep data error:",
          error,
        );


        console.error(
          "Sleep POST status:",
          error?.response?.status,
        );


        console.error(
          "Sleep POST response:",
          error?.response?.data,
        );


        setErrorMessage(
          error?.response
            ?.data
            ?.message ||
          error?.message ||
          "Failed to save sleep data.",
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

            <MoonStar size={14} />

            HEALTH · SLEEP INTELLIGENCE

          </div>


          <h1>
            Sleep Intelligence
          </h1>


          <p>
            Track your sleep patterns,
            understand sleep quality and
            monitor intelligent sleep insights.
          </p>

        </div>


        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={() =>
              loadSleepData({
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


          <button
            type="button"
            className="create-notification-btn"
            onClick={() =>
              handleAdd(
                sleepFeatures[0],
              )
            }
          >

            <Plus size={16} />

            Add Sleep Data

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
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">

        <SummaryCard
          icon={Clock3}
          title="Sleep Duration"
          value={summary.duration}
          unit="hrs"
          subtitle="Last sleep"
        />

        <SummaryCard
          icon={MoonStar}
          title="Sleep Score"
          value={summary.score}
          unit="/100"
          subtitle="Last sleep"
        />

        <SummaryCard
          icon={BedDouble}
          title="Deep Sleep"
          value={summary.deep}
          unit="hrs"
          subtitle="Last sleep"
        />

        <SummaryCard
          icon={Activity}
          title="Sleep Efficiency"
          value={summary.efficiency}
          unit="%"
          subtitle="Last sleep"
        />

      </div>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="health-main-card">

        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              SLEEP MONITORING
            </span>

            <h2>
              Your Sleep
            </h2>

            <p>
              Monitor sleep duration,
              quality, stages and
              intelligent sleep insights.
            </p>

          </div>


          <div className="health-history-icon">

            <MoonStar size={21} />

          </div>

        </div>


        {/* ===================================================
            GRID
        =================================================== */}

        {loading ? (

          <div className="health-monitoring-loading">

            <RefreshCw
              size={20}
              className="health-refresh-spinning"
            />

            Loading sleep data...

          </div>

        ) : (

          <div className="health-vitals-detail-grid">

            {sleepFeatures.map(
              (feature) => (

                <SleepFeatureCard
                  key={feature.id}
                  feature={feature}
                  reading={
                    latestByFeature[
                      feature.id
                    ]
                  }
                  onAdd={() =>
                    handleAdd(
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
          RECENT SLEEP DATA
      ===================================================== */}

      <section className="health-main-card">

        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              RECENT ACTIVITY
            </span>

            <h2>
              Saved Sleep Data
            </h2>

            <p>
              Your latest sleep records
              stored in the database.
            </p>

          </div>


          <CheckCircle2 size={22} />

        </div>


        {sortedRecords.length === 0 ? (

          <div className="health-monitoring-loading">

            <MoonStar size={20} />

            No sleep records saved yet.

          </div>

        ) : (

          <div className="health-workout-history-list">

            {sortedRecords
              .slice(0, 10)
              .map(
                (record) => (

                  <div
                    key={
                      getId(record) ||
                      `${record.feature}-${record.recordedAt}`
                    }
                    className="health-workout-history-item"
                  >

                    <div className="health-workout-history-item__icon">

                      <MoonStar size={18} />

                    </div>


                    <div className="health-workout-history-item__content">

                      <strong>

                        {sleepFeatures.find(
                          (feature) =>
                            feature.feature ===
                            record.feature,
                        )?.title ||
                          record.feature}

                      </strong>


                      <small>

                        {formatDate(
                          record.recordedAt ||
                          record.createdAt,
                        )}

                      </small>

                    </div>


                    <div className="health-workout-history-item__stats">

                      <span>

                        {record.value}

                        {" "}

                        {record.unit}

                      </span>

                    </div>

                  </div>

                ),
              )}

          </div>

        )}

      </section>


      {/* =====================================================
          MODAL
      ===================================================== */}

      {selectedFeature && (

        <div
          className="health-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              handleClose();

            }

          }}
        >

          <div
            className="health-modal"
            role="dialog"
            aria-modal="true"
          >


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="health-modal__header">

              <div>

                <span>
                  ADD SLEEP DATA
                </span>

                <h2>
                  {selectedFeature.title}
                </h2>

              </div>


              <button
                type="button"
                className="health-modal-close"
                onClick={
                  handleClose
                }
                disabled={saving}
              >

                <X size={18} />

              </button>

            </div>


            {/* =================================================
                FORM
            ================================================= */}

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


                <div className="health-form-group">

                  <label htmlFor="sleep-value">
                    Reading
                  </label>


                  <div className="health-input-with-unit">

                    <input
                      id="sleep-value"
                      type="number"
                      min="0"
                      step="0.1"
                      value={value}
                      onChange={(event) =>
                        setValue(
                          event.target.value,
                        )
                      }
                      placeholder={
                        `Enter value in ${selectedFeature.unit}`
                      }
                      disabled={saving}
                      autoFocus
                    />


                    <span>
                      {selectedFeature.unit}
                    </span>

                  </div>

                </div>


                <div className="health-form-group">

                  <label htmlFor="sleep-date-time">
                    Date & Time
                  </label>


                  <input
                    id="sleep-date-time"
                    type="datetime-local"
                    value={dateTime}
                    onChange={(event) =>
                      setDateTime(
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />

                </div>

              </div>


              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="health-modal__footer">

                <button
                  type="button"
                  className="health-modal-cancel"
                  onClick={
                    handleClose
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

                      Save Data

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