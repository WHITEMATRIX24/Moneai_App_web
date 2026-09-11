// src/pages/health/HealthMonitoringAlertsPage.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Activity,
  BellRing,
  TriangleAlert,
  Gauge,
  TrendingUp,
  ShieldAlert,
  Plus,
  History,
  RefreshCw,
  CheckCircle2,
  X,
} from "lucide-react";

import api from "../services/api.js";
import "./HealthMonitoringAlertsPage.css";



/* =========================================================
   MONITORING DEFINITIONS

   These are ONLY definitions for what each card represents.
   The displayed values come from the database.
========================================================= */

const monitoringItems = [
  {
    id: "health-alerts",
    title: "Health Alerts",
    description:
      "Receive alerts when important health changes are detected.",
    icon: BellRing,
    type: "ALERT",
    category: "HEALTH_ALERT",
    alertType: "GENERAL",
    unit: "",
  },

  {
    id: "abnormal-reading",
    title: "Abnormal Reading Detection",
    description:
      "Identify unusual or unexpected health readings.",
    icon: TriangleAlert,
    type: "ALERT",
    category: "ABNORMAL_READING",
    alertType: "GENERAL",
    unit: "",
  },

  {
    id: "health-trends",
    title: "Health Trends",
    description:
      "Track health measurements and changes over time.",
    icon: TrendingUp,
    type: "METRIC",
    metricType: "HEART_RATE",
    unit: "bpm",
  },

  {
    id: "threshold-monitoring",
    title: "Threshold Monitoring",
    description:
      "Monitor health values against configured thresholds.",
    icon: Gauge,
    type: "ALERT",
    category: "THRESHOLD_MONITORING",
    alertType: "GENERAL",
    unit: "",
  },

  {
    id: "health-notifications",
    title: "Health Notifications",
    description:
      "Receive important notifications about your health.",
    icon: BellRing,
    type: "ALERT",
    category: "HEALTH_NOTIFICATION",
    alertType: "GENERAL",
    unit: "",
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
    year: "numeric",
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

  const localDate = new Date(
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
  const data = getResponseData(response);

  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}


function sortNewest(items, dateFields = []) {
  return [...items].sort((a, b) => {
    const aDate =
      dateFields
        .map((field) => a?.[field])
        .find(Boolean) || 0;

    const bDate =
      dateFields
        .map((field) => b?.[field])
        .find(Boolean) || 0;

    return (
      new Date(bDate).getTime() -
      new Date(aDate).getTime()
    );
  });
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({ item }) {
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
          {item.value}

          {item.unit && (
            <small className="health-summary-unit">
              {item.unit}
            </small>
          )}
        </strong>

        <small>
          {item.statusText}
        </small>
      </div>

    </div>
  );
}


/* =========================================================
   MONITORING CARD
========================================================= */

function MonitoringCard({
  item,
  status,
  onAdd,
  onHistory,
}) {
  const Icon = item.icon;

  return (
    <div className="health-vital-detail-card">

      {/* TOP */}

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


      {/* CONTENT */}

      <div className="health-vital-detail-card__content">

        <h3>
          {item.title}
        </h3>

        <p>
          {item.description}
        </p>

      </div>


      {/* READING */}

      <div className="health-vital-detail-card__reading">

        <div>

          <strong>
            {status?.value ?? "--"}
          </strong>

          {status?.unit && (
            <span>
              {status.unit}
            </span>
          )}

        </div>

        <small>
          {status
            ? `Updated ${status.displayDate}`
            : "No monitoring data yet"}
        </small>

      </div>


      {/* ACTION */}

      <button
        type="button"
        className="health-vital-add-btn"
        onClick={onAdd}
      >
        <Plus size={15} />

        {status
          ? "Update Status"
          : "Add Monitoring Data"}
      </button>

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function HealthMonitoringAlertsPage() {

  const navigate = useNavigate();


  /* =======================================================
     DATABASE DATA
  ======================================================= */

  const [metrics, setMetrics] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);


  /* =======================================================
     UI
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");


  /* =======================================================
     MODAL
  ======================================================= */

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [statusValue, setStatusValue] =
    useState("");

  const [statusDate, setStatusDate] =
    useState(
      toDateTimeLocal(new Date()),
    );

  const [statusUnit, setStatusUnit] =
    useState("");

  const [severity, setSeverity] =
    useState("MEDIUM");

  const [threshold, setThreshold] =
    useState("");


  /* =======================================================
     LOAD FROM DATABASE
  ======================================================= */

  const loadHealthData = useCallback(
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


        const [
          metricsResponse,
          alertsResponse,
        ] = await Promise.all([
          api.get("/health/metrics"),
          api.get("/health/alerts"),
        ]);


        const loadedMetrics =
          getArray(
            metricsResponse,
            "metrics",
          );


        const loadedAlerts =
          getArray(
            alertsResponse,
            "alerts",
          );


        /*
         * IMPORTANT:
         *
         * These arrays are received from
         * the backend/database.
         */

        setMetrics(
          loadedMetrics,
        );

        setAlerts(
          loadedAlerts,
        );

      } catch (error) {

        console.error(
          "Health monitoring load error:",
          error,
        );

        setErrorMessage(
          error?.response?.data?.message ||
          "Unable to load health monitoring data.",
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
    loadHealthData();
  }, [loadHealthData]);


  /* =========================================================
     LATEST STATUS FOR EACH CARD
========================================================= */

  const statuses = useMemo(() => {

    const result = {};


    monitoringItems.forEach((item) => {

      /* =====================================================
         HEALTH TRENDS / METRIC
      ===================================================== */

      if (item.type === "METRIC") {

        const itemMetrics =
          metrics.filter(
            (metric) =>
              metric.type ===
              item.metricType,
          );


        const sortedMetrics =
          sortNewest(
            itemMetrics,
            [
              "recordedAt",
              "createdAt",
            ],
          );


        const latest =
          sortedMetrics[0];


        if (latest) {

          result[item.id] = {

            value:
              latest.value,

            unit:
              latest.unit ||
              item.unit ||
              "",

            date:
              latest.recordedAt ||
              latest.createdAt,

            displayDate:
              formatDate(
                latest.recordedAt ||
                latest.createdAt,
              ),

            source:
              "metric",

            raw:
              latest,

          };

        }

        return;
      }


      /* =====================================================
         ALERT CARD
      ===================================================== */

      if (item.type === "ALERT") {

        const itemAlerts =
          alerts.filter(
            (alert) =>
              alert.category ===
              item.category,
          );


        const sortedAlerts =
          sortNewest(
            itemAlerts,
            [
              "triggeredAt",
              "createdAt",
            ],
          );


        const latestAlert =
          sortedAlerts[0];


        if (latestAlert) {

          result[item.id] = {

            value:
              latestAlert.value ??
              latestAlert.title ??
              "--",

            unit:
              latestAlert.unit ||
              "",

            date:
              latestAlert.triggeredAt ||
              latestAlert.createdAt,

            displayDate:
              formatDate(
                latestAlert.triggeredAt ||
                latestAlert.createdAt,
              ),

            source:
              "alert",

            raw:
              latestAlert,

          };

        }

      }

    });


    return result;

  }, [
    metrics,
    alerts,
  ]);


  /* =========================================================
     SUMMARY CARDS

     IMPORTANT:
     Health Trends = ACTUAL SAVED METRIC RECORDS.
     It is NOT hardcoded.
========================================================= */

  const summaryItems = useMemo(() => {

    const activeAlerts =
      alerts.filter(
        (alert) =>
          alert.status === "ACTIVE" ||
          alert.status === "ACKNOWLEDGED",
      );


    const abnormalReadings =
      alerts.filter(
        (alert) =>
          alert.category ===
          "ABNORMAL_READING",
      );


    /*
     * IMPORTANT FIX:
     *
     * Count actual metric records from
     * HealthMetric collection.
     *
     * Example:
     * 5 saved HEART_RATE records
     * = Health Trends shows 5
     *
     * Previously:
     * Set(metric.type).size
     * would show only 1.
     */

    const healthTrendCount =
      metrics.filter(
        (metric) =>
          metric?.type,
      ).length;


    const notifications =
      alerts.filter(
        (alert) =>
          alert.category ===
            "HEALTH_NOTIFICATION" &&
          alert.status !==
            "RESOLVED",
      );


    return [

      {
        id:
          "active-alerts",

        title:
          "Active Alerts",

        value:
          activeAlerts.length,

        unit:
          "",

        icon:
          ShieldAlert,

        statusText:
          activeAlerts.length > 0
            ? `${activeAlerts.length} active alert${
                activeAlerts.length === 1
                  ? ""
                  : "s"
              }`
            : "No active alerts",
      },


      {
        id:
          "abnormal-readings",

        title:
          "Abnormal Readings",

        value:
          abnormalReadings.length,

        unit:
          "",

        icon:
          TriangleAlert,

        statusText:
          abnormalReadings.length > 0
            ? `${abnormalReadings.length} abnormal reading${
                abnormalReadings.length === 1
                  ? ""
                  : "s"
              } detected`
            : "No abnormal readings",
      },


      {
        id:
          "health-trends",

        title:
          "Health Trends",

        value:
          healthTrendCount,

        unit:
          "",

        icon:
          TrendingUp,

        statusText:
          healthTrendCount > 0
            ? `${healthTrendCount} metric${
                healthTrendCount === 1
                  ? ""
                  : "s"
              } tracked`
            : "No trend data yet",
      },


      {
        id:
          "notifications",

        title:
          "Notifications",

        value:
          notifications.length,

        unit:
          "",

        icon:
          BellRing,

        statusText:
          notifications.length > 0
            ? `${notifications.length} health notification${
                notifications.length === 1
                  ? ""
                  : "s"
              }`
            : "No health notifications",
      },

    ];

  }, [
    alerts,
    metrics,
  ]);


  /* =========================================================
     OPEN ADD / UPDATE
========================================================= */

  const handleAdd = (item) => {

    const existing =
      statuses[item.id];


    setSelectedItem(item);


    setStatusValue(
      existing?.value !==
        undefined &&
      existing?.value !== null
        ? String(
            existing.value,
          )
        : "",
    );


    setStatusDate(
      toDateTimeLocal(
        existing?.date ||
        new Date(),
      ),
    );


    setStatusUnit(
      existing?.unit ||
      item.unit ||
      "",
    );


    setSeverity(
      existing?.raw?.severity ||
      "MEDIUM",
    );


    setThreshold(
      existing?.raw?.threshold !==
        undefined &&
      existing?.raw?.threshold !==
        null
        ? String(
            existing.raw.threshold,
          )
        : "",
    );


    setErrorMessage("");

  };


  /* =========================================================
     HERO ADD
========================================================= */

  const handleHeroAdd = () => {
    handleAdd(
      monitoringItems[0],
    );
  };


  /* =========================================================
     HISTORY
========================================================= */

  const handleHistory = (item) => {

    let history = [];


    /* =====================================================
       METRIC HISTORY
    ===================================================== */

    if (
      item.type ===
      "METRIC"
    ) {

      history =
        sortNewest(
          metrics.filter(
            (metric) =>
              metric.type ===
              item.metricType,
          ),
          [
            "recordedAt",
            "createdAt",
          ],
        );

    }


    /* =====================================================
       ALERT HISTORY
    ===================================================== */

    else {

      history =
        sortNewest(
          alerts.filter(
            (alert) =>
              alert.category ===
              item.category,
          ),
          [
            "triggeredAt",
            "createdAt",
          ],
        );

    }


    if (!history.length) {

      window.alert(
        `No ${item.title.toLowerCase()} data has been added yet.`,
      );

      return;
    }


    const latest =
      history[0];


    const latestDate =
      latest.recordedAt ||
      latest.triggeredAt ||
      latest.createdAt;


    const value =
      latest.value !==
        undefined &&
      latest.value !== null
        ? `${latest.value}${
            latest.unit
              ? ` ${latest.unit}`
              : ""
          }`
        : latest.title ||
          "Alert";


    window.alert(
      `${item.title}\n\n` +
      `Latest: ${value}\n` +
      `Updated: ${formatDate(
        latestDate,
      )}\n\n` +
      `${history.length} saved record${
        history.length === 1
          ? ""
          : "s"
      }.`,
    );

  };


  /* =========================================================
     SAVE
========================================================= */

  const handleSave = async () => {

    if (!selectedItem) {
      return;
    }


    /* =====================================================
       VALUE VALIDATION
    ===================================================== */

    if (
      statusValue === "" ||
      statusValue === null ||
      statusValue === undefined
    ) {

      setErrorMessage(
        "Please enter a value.",
      );

      return;
    }


    const numericValue =
      Number(statusValue);


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


    /* =====================================================
       SAVE
    ===================================================== */

    try {

      setSaving(true);
      setErrorMessage("");


      /* ===================================================
         METRIC
      =================================================== */

      if (
        selectedItem.type ===
        "METRIC"
      ) {

        await api.post(
          "/health/metrics",
          {
            type:
              selectedItem.metricType,

            value:
              numericValue,

            unit:
              statusUnit.trim() ||
              selectedItem.unit ||
              "unit",

            recordedAt:
              statusDate
                ? new Date(
                    statusDate,
                  ).toISOString()
                : new Date().toISOString(),
          },
        );

      }


      /* ===================================================
         ALERT
      =================================================== */

      else {

        let numericThreshold =
          null;


        if (
          threshold !== "" &&
          threshold !== null &&
          threshold !== undefined
        ) {

          numericThreshold =
            Number(threshold);


          if (
            !Number.isFinite(
              numericThreshold,
            )
          ) {

            setErrorMessage(
              "Please enter a valid threshold.",
            );

            return;
          }

        }


        const alertPayload = {

          /*
           * This category is now
           * stored in MongoDB by the
           * corrected backend model/controller.
           */

          category:
            selectedItem.category,

          type:
            selectedItem.alertType ||
            "GENERAL",

          severity,

          title:
            selectedItem.title,

          message:
            `${selectedItem.title}: ${numericValue}${
              statusUnit.trim()
                ? ` ${statusUnit.trim()}`
                : ""
            }`,

          value:
            numericValue,

          unit:
            statusUnit.trim(),

          threshold:
            numericThreshold,

          triggeredAt:
            statusDate
              ? new Date(
                  statusDate,
                ).toISOString()
              : new Date().toISOString(),

        };


        await api.post(
          "/health/alerts",
          alertPayload,
        );

      }


      /* ===================================================
         CLOSE
      =================================================== */

      closeModal();


      /* ===================================================
         IMPORTANT
         RELOAD FROM DATABASE
      =================================================== */

      await loadHealthData();

    } catch (error) {

      console.error(
        "Save health monitoring data error:",
        error,
      );

      setErrorMessage(
        error?.response?.data?.message ||
        "Failed to save monitoring data.",
      );

    } finally {

      setSaving(false);

    }

  };


  /* =========================================================
     REFRESH
========================================================= */

  const handleRefresh = async () => {

    await loadHealthData({
      showRefresh: true,
    });

  };


  /* =========================================================
     CLOSE MODAL
========================================================= */

  const closeModal = () => {

    setSelectedItem(null);

    setStatusValue("");

    setStatusDate(
      toDateTimeLocal(
        new Date(),
      ),
    );

    setStatusUnit("");

    setSeverity("MEDIUM");

    setThreshold("");

  };


  /* =========================================================
     RENDER
========================================================= */

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
            <ArrowLeft size={16} />

            Back to Health
          </button>


          <div className="notifications-eyebrow">

            <ShieldAlert size={14} />

            Health · Monitoring & Alerts

          </div>


          <h1>
            Health Monitoring & Alerts
          </h1>


          <p>
            Monitor health patterns,
            identify unusual readings
            and stay informed about
            important health changes.
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

            <Plus size={16} />

            Add Monitoring Data

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

          <TriangleAlert size={16} />

          <span>
            {errorMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setErrorMessage("")
            }
            aria-label="Close error"
          >
            <X size={15} />
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
              HEALTH MONITORING & ALERTS
            </span>

            <h2>
              Your Health Monitoring
            </h2>

            <p>
              Monitor health changes,
              alerts, trends and
              important notifications.
            </p>

          </div>


          <div className="health-history-icon">
            <Activity size={21} />
          </div>

        </div>


        {loading ? (

          <div className="health-monitoring-loading">

            <RefreshCw
              size={22}
              className="health-refresh-spinning"
            />

            <span>
              Loading health monitoring data...
            </span>

          </div>

        ) : (

          <div className="health-vitals-detail-grid">

            {monitoringItems.map(
              (item) => (

                <MonitoringCard
                  key={
                    item.id
                  }

                  item={
                    item
                  }

                  status={
                    statuses[
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
                  ADD MONITORING DATA
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

              <label htmlFor="monitoring-value">
                Status / Value
              </label>

              <input
                id="monitoring-value"
                type="number"
                value={
                  statusValue
                }
                onChange={(
                  event,
                ) =>
                  setStatusValue(
                    event.target
                      .value,
                  )
                }
                placeholder="Enter value"
                disabled={
                  saving
                }
              />


              <small>
                Enter the latest monitoring value.
              </small>


              <label htmlFor="monitoring-unit">
                Unit
              </label>

              <input
                id="monitoring-unit"
                type="text"
                value={
                  statusUnit
                }
                onChange={(
                  event,
                ) =>
                  setStatusUnit(
                    event.target
                      .value,
                  )
                }
                placeholder={
                  selectedItem.unit ||
                  "Enter unit"
                }
                disabled={
                  saving
                }
              />


              {/* ALERT FIELDS */}

              {selectedItem.type ===
                "ALERT" && (

                <>

                  <label htmlFor="monitoring-severity">
                    Severity
                  </label>

                  <select
                    id="monitoring-severity"
                    value={
                      severity
                    }
                    onChange={(
                      event,
                    ) =>
                      setSeverity(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      saving
                    }
                  >

                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="CRITICAL">
                      Critical
                    </option>

                  </select>


                  <label htmlFor="monitoring-threshold">
                    Threshold
                  </label>

                  <input
                    id="monitoring-threshold"
                    type="number"
                    value={
                      threshold
                    }
                    onChange={(
                      event,
                    ) =>
                      setThreshold(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Optional threshold"
                    disabled={
                      saving
                    }
                  />

                </>

              )}


              <label htmlFor="monitoring-date">
                Date & Time
              </label>

              <input
                id="monitoring-date"
                type="datetime-local"
                value={
                  statusDate
                }
                onChange={(
                  event,
                ) =>
                  setStatusDate(
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

                    Save Data

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