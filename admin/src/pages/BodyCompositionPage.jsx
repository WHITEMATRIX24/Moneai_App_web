// src/pages/health/BodyCompositionPage.jsx

import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Scale,
  Ruler,
  Percent,
  PersonStanding,
  LineChart,
  Plus,
  History,
  TrendingUp,
  X,
  RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

// IMPORTANT:
// api.js is inside src/services/api.js
import api from "../services/api.js";
import "./BodyCompositionPage.css";



/* =========================================================
   BODY COMPOSITION DEFINITIONS
========================================================= */

const bodyMetrics = [
  {
    id: "weight",
    type: "WEIGHT",
    title: "Weight",
    description: "Track your body weight over time.",
    unit: "kg",
    icon: Scale,
  },
  {
    id: "bmi",
    type: "BMI",
    title: "BMI",
    description: "Track your body mass index.",
    unit: "",
    icon: Ruler,
  },
  {
    id: "body-fat",
    type: "BODY_FAT",
    title: "Body Fat",
    description: "Monitor your body fat percentage.",
    unit: "%",
    icon: Percent,
  },
  {
    id: "muscle-mass",
    type: "MUSCLE_MASS",
    title: "Muscle Mass",
    description: "Track your muscle mass measurements.",
    unit: "kg",
    icon: PersonStanding,
  },
  {
    id: "body-measurements",
    type: "BODY_MEASUREMENTS",
    title: "Body Measurements",
    description: "Track important body measurements.",
    unit: "cm",
    icon: Ruler,
  },
  {
    id: "composition-trends",
    type: null,
    title: "Body Composition Trends",
    description: "Understand changes in body composition.",
    unit: "",
    icon: LineChart,
  },
];


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(date) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}


/* =========================================================
   BODY METRIC CARD
========================================================= */

function BodyMetricCard({
  metric,
  latestReading,
  onAdd,
  onHistory,
}) {
  const Icon = metric.icon;

  const hasReading =
    latestReading &&
    latestReading.value !== undefined &&
    latestReading.value !== null;

  return (
    <div className="health-vital-detail-card">

      {/* TOP */}

      <div className="health-vital-detail-card__top">

        <div className="health-vital-detail-card__icon">
          <Icon size={21} />
        </div>

        {metric.type && (
          <button
            type="button"
            className="health-vital-history-btn"
            onClick={onHistory}
            title={`View ${metric.title} history`}
          >
            <History size={15} />
          </button>
        )}

      </div>


      {/* CONTENT */}

      <div className="health-vital-detail-card__content">

        <h3>
          {metric.title}
        </h3>

        <p>
          {metric.description}
        </p>

      </div>


      {/* READING */}

      <div className="health-vital-detail-card__reading">

        <div>

          <strong>
            {hasReading
              ? latestReading.value
              : "--"}
          </strong>

          {metric.unit && (
            <span>
              {metric.unit}
            </span>
          )}

        </div>

        <small>
          {hasReading
            ? `Last updated ${formatDate(
                latestReading.recordedAt ||
                  latestReading.createdAt,
              )}`
            : "No reading yet"}
        </small>

      </div>


      {/* ADD BUTTON */}

      {metric.type && (
        <button
          type="button"
          className="health-vital-add-btn"
          onClick={onAdd}
        >
          <Plus size={15} />
          Add Reading
        </button>
      )}

    </div>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function BodyCompositionPage() {

  const navigate = useNavigate();


  /* =======================================================
     STATE
  ======================================================= */

  const [metrics, setMetrics] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState("");

  const [selectedMetric, setSelectedMetric] =
    useState(null);

  const [readingValue, setReadingValue] =
    useState("");

  const [recordedAt, setRecordedAt] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [historyMetric, setHistoryMetric] =
    useState(null);


  /* =======================================================
     CURRENT DATETIME
  ======================================================= */

  const getCurrentDateTime = () => {
    const now = new Date();

    const offset =
      now.getTimezoneOffset();

    const localDate =
      new Date(
        now.getTime() -
          offset * 60 * 1000,
      );

    return localDate
      .toISOString()
      .slice(0, 16);
  };


  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadMetrics = async ({
    showRefresh = false,
  } = {}) => {

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");

      const response =
        await api.get(
          "/health/metrics",
        );

      const receivedMetrics =
        response?.data?.metrics;

      if (
        Array.isArray(
          receivedMetrics,
        )
      ) {
        setMetrics(
          receivedMetrics,
        );
      } else {
        setMetrics([]);
      }

    } catch (error) {

      console.error(
        "Load body composition data error:",
        error,
      );

      setPageError(
        error?.response?.data?.message ||
          "Failed to load body composition data.",
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  /* =======================================================
     LOAD WHEN PAGE OPENS
  ======================================================= */

  useEffect(() => {

    loadMetrics();

  }, []);


  /* =======================================================
     LATEST READING FOR EACH TYPE
  ======================================================= */

  const latestByType = useMemo(() => {

    const result = {};

    const sorted =
      [...metrics].sort(
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

    sorted.forEach((metric) => {

      if (
        metric?.type &&
        !result[metric.type]
      ) {
        result[metric.type] =
          metric;
      }

    });

    return result;

  }, [metrics]);


  /* =======================================================
     HISTORY
  ======================================================= */

  const history = useMemo(() => {

    if (!historyMetric?.type) {
      return [];
    }

    return metrics
      .filter(
        (metric) =>
          metric.type ===
          historyMetric.type,
      )
      .sort(
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
    metrics,
    historyMetric,
  ]);


  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary = [
    {
      title: "Weight",
      type: "WEIGHT",
      unit: "kg",
      icon: Scale,
    },
    {
      title: "BMI",
      type: "BMI",
      unit: "",
      icon: Ruler,
    },
    {
      title: "Body Fat",
      type: "BODY_FAT",
      unit: "%",
      icon: Percent,
    },
    {
      title: "Muscle Mass",
      type: "MUSCLE_MASS",
      unit: "kg",
      icon: PersonStanding,
    },
  ];


  /* =======================================================
     OPEN ADD READING
  ======================================================= */

  const handleAddReading = (
    metric,
  ) => {

    setSelectedMetric(metric);

    setReadingValue("");

    setRecordedAt(
      getCurrentDateTime(),
    );

    setPageError("");

  };


  /* =======================================================
     CLOSE ADD MODAL
  ======================================================= */

  const closeAddModal = () => {

    if (saving) {
      return;
    }

    setSelectedMetric(null);

    setReadingValue("");

    setPageError("");

  };


  /* =======================================================
     SAVE READING TO DATABASE
  ======================================================= */

  const handleSaveReading = async () => {

    if (!selectedMetric) {
      return;
    }


    /* =====================================================
       VALUE REQUIRED
    ===================================================== */

    if (
      readingValue === "" ||
      readingValue === null ||
      readingValue === undefined
    ) {

      setPageError(
        "Please enter a reading.",
      );

      return;
    }


    const numericValue =
      Number(readingValue);


    /* =====================================================
       NUMBER VALIDATION
    ===================================================== */

    if (
      !Number.isFinite(
        numericValue,
      )
    ) {

      setPageError(
        "Please enter a valid number.",
      );

      return;
    }


    /* =====================================================
       TYPE VALIDATION
    ===================================================== */

    if (!selectedMetric.type) {

      setPageError(
        "Invalid body composition metric.",
      );

      return;
    }


    /* =====================================================
       SAVE
    ===================================================== */

    try {

      setSaving(true);

      setPageError("");


      const cleanRecordedAt =
        recordedAt
          ? new Date(
              recordedAt,
            )
          : new Date();


      if (
        Number.isNaN(
          cleanRecordedAt.getTime(),
        )
      ) {

        setPageError(
          "Invalid date and time.",
        );

        setSaving(false);

        return;
      }


      const response =
        await api.post(
          "/health/metrics",
          {
            type:
              selectedMetric.type,

            value:
              numericValue,

            unit:
              selectedMetric.unit ||
              "value",

            recordedAt:
              cleanRecordedAt.toISOString(),
          },
        );


      /* =================================================
         ADD SAVED RECORD TO UI
      ================================================= */

      const savedMetric =
        response?.data?.metric;


      if (savedMetric) {

        setMetrics(
          (previous) => [
            savedMetric,
            ...previous,
          ],
        );

      } else {

        await loadMetrics();

      }


      /* =================================================
         CLOSE MODAL
      ================================================= */

      setSelectedMetric(null);

      setReadingValue("");

      setRecordedAt(
        getCurrentDateTime(),
      );


    } catch (error) {

      console.error(
        "Save body composition reading error:",
        error,
      );

      setPageError(
        error?.response?.data?.message ||
          "Failed to save health reading.",
      );

    } finally {

      setSaving(false);

    }

  };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {

    loadMetrics({
      showRefresh: true,
    });

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

            <Scale size={14} />

            Health · Body Composition

          </div>


          <h1>
            Health Metrics & Body Composition
          </h1>


          <p>
            Track your body measurements and
            understand changes in your body
            composition.
          </p>

        </div>


        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={handleRefresh}
            disabled={
              loading ||
              refreshing
            }
          >

            {refreshing ? (

              <RefreshCw
                size={16}
                className="health-spin"
              />

            ) : (

              <TrendingUp
                size={16}
              />

            )}

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>


          <button
            type="button"
            className="create-notification-btn"
            onClick={() =>
              handleAddReading(
                bodyMetrics[0],
              )
            }
          >

            <Plus size={16} />

            Add Reading

          </button>

        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {pageError &&
        !selectedMetric && (

          <div
            className="health-error-message"
            style={{
              marginBottom: "18px",
              padding: "12px 15px",
              borderRadius: "10px",
              background:
                "#fff1f1",
              border:
                "1px solid #ffd2d2",
              color:
                "#b42318",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >

            {pageError}

          </div>

        )}


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="health-summary-notification-grid">

        {summary.map((item) => {

          const Icon =
            item.icon;

          const latest =
            latestByType[
              item.type
            ];

          return (

            <div
              className="summary-card"
              key={item.type}
            >

              <div className="summary-icon">

                <Icon size={20} />

              </div>


              <div>

                <span>
                  {item.title}
                </span>


                <strong>

                  {loading
                    ? "--"
                    : latest?.value ??
                      "--"}

                  {item.unit && (

                    <small className="health-summary-unit">
                      {item.unit}
                    </small>

                  )}

                </strong>


                <small>

                  {latest

                    ? `Updated ${formatDate(
                        latest.recordedAt ||
                          latest.createdAt,
                      )}`

                    : "No reading yet"}

                </small>

              </div>

            </div>

          );

        })}

      </div>


      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <section className="health-main-card">


        {/* HEADER */}

        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              BODY COMPOSITION MONITORING
            </span>

            <h2>
              Your Body Composition
            </h2>

            <p>
              Record and monitor your body
              measurements and composition
              metrics.
            </p>

          </div>


          <div className="health-history-icon">

            <Scale size={21} />

          </div>

        </div>


        {/* LOADING */}

        {loading ? (

          <div
            style={{
              padding:
                "50px 20px",
              textAlign:
                "center",
              color:
                "#8797aa",
            }}
          >

            Loading body composition
            data...

          </div>

        ) : (

          <div className="health-vitals-detail-grid">

            {bodyMetrics.map(
              (metric) => (

                <BodyMetricCard
                  key={metric.id}
                  metric={metric}
                  latestReading={
                    metric.type
                      ? latestByType[
                          metric.type
                        ]
                      : null
                  }
                  onAdd={() =>
                    handleAddReading(
                      metric,
                    )
                  }
                  onHistory={() =>
                    setHistoryMetric(
                      metric,
                    )
                  }
                />

              ),
            )}

          </div>

        )}

      </section>


      {/* =====================================================
          ADD READING MODAL
      ===================================================== */}

      {selectedMetric && (

        <div
          className="health-modal-overlay"
          onClick={
            closeAddModal
          }
        >

          <div
            className="health-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* MODAL HEADER */}

            <div className="health-modal__header">

              <div>

                <span>
                  ADD BODY READING
                </span>

                <h2>
                  {selectedMetric.title}
                </h2>

              </div>


              <button
                type="button"
                className="health-modal-close"
                onClick={
                  closeAddModal
                }
                disabled={saving}
              >

                <X size={18} />

              </button>

            </div>


            {/* MODAL BODY */}

            <div className="health-modal__body">

              {pageError && (

                <div
                  style={{
                    marginBottom:
                      "14px",
                    padding:
                      "10px 12px",
                    borderRadius:
                      "8px",
                    background:
                      "#fff1f1",
                    border:
                      "1px solid #ffd2d2",
                    color:
                      "#b42318",
                    fontSize:
                      "12px",
                    fontWeight:
                      600,
                  }}
                >

                  {pageError}

                </div>

              )}


              <label>
                Reading
              </label>


              <input
                type="number"
                step="any"
                value={
                  readingValue
                }
                placeholder={
                  selectedMetric.unit
                    ? `Enter value in ${selectedMetric.unit}`
                    : "Enter reading"
                }
                onChange={(event) =>
                  setReadingValue(
                    event.target.value,
                  )
                }
                disabled={saving}
                autoFocus
              />


              {selectedMetric.unit && (

                <small>
                  Unit:{" "}
                  {selectedMetric.unit}
                </small>

              )}


              <label>
                Date & Time
              </label>


              <input
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


            {/* MODAL FOOTER */}

            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={
                  closeAddModal
                }
                disabled={saving}
              >

                Cancel

              </button>


              <button
                type="button"
                className="health-modal-save"
                onClick={
                  handleSaveReading
                }
                disabled={saving}
              >

                {saving
                  ? "Saving..."
                  : "Save Reading"}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          HISTORY MODAL
      ===================================================== */}

      {historyMetric && (

        <div
          className="health-modal-overlay"
          onClick={() =>
            setHistoryMetric(
              null,
            )
          }
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
                  READING HISTORY
                </span>

                <h2>
                  {historyMetric.title}
                </h2>

              </div>


              <button
                type="button"
                className="health-modal-close"
                onClick={() =>
                  setHistoryMetric(
                    null,
                  )
                }
              >

                <X size={18} />

              </button>

            </div>


            {/* HISTORY */}

            <div className="health-modal__body">

              {history.length ===
              0 ? (

                <div
                  style={{
                    padding:
                      "25px 0",
                    textAlign:
                      "center",
                    color:
                      "#8797aa",
                  }}
                >

                  No readings
                  recorded yet.

                </div>

              ) : (

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: "10px",
                    maxHeight:
                      "350px",
                    overflowY:
                      "auto",
                  }}
                >

                  {history.map(
                    (item) => (

                      <div
                        key={
                          item._id
                        }
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          padding:
                            "12px 14px",
                          border:
                            "1px solid #e8edf3",
                          borderRadius:
                            "10px",
                        }}
                      >

                        <div>

                          <strong
                            style={{
                              fontSize:
                                "16px",
                              color:
                                "#19334f",
                            }}
                          >

                            {
                              item.value
                            }{" "}

                            {
                              item.unit
                            }

                          </strong>


                          <div
                            style={{
                              marginTop:
                                "3px",
                              fontSize:
                                "11px",
                              color:
                                "#8797aa",
                            }}
                          >

                            {formatDate(
                              item.recordedAt ||
                                item.createdAt,
                            )}

                          </div>

                        </div>

                      </div>

                    ),
                  )}

                </div>

              )}

            </div>


            {/* FOOTER */}

            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setHistoryMetric(
                    null,
                  )
                }
              >

                Close

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}