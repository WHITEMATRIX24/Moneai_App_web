// src/pages/health/VitalSignsPage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Activity,
  HeartPulse,
  Droplets,
  Wind,
  Thermometer,
  Gauge,
  Brain,
  Waves,
  Plus,
  History,
  RefreshCw,
} from "lucide-react";

import api from "../services/api.js";
import "./VitalSignsPage.css";



/* =========================================================
   VITAL SIGN DEFINITIONS
========================================================= */

const vitalSigns = [
  {
    id: "heart-rate",
    type: "HEART_RATE",
    title: "Heart Rate",
    description: "Monitor your heart rate measurements.",
    unit: "bpm",
    icon: HeartPulse,
  },
  {
    id: "blood-oxygen",
    type: "BLOOD_OXYGEN",
    title: "Blood Oxygen",
    description: "Track your blood oxygen saturation levels.",
    unit: "%",
    icon: Waves,
  },
  {
    id: "respiratory-rate",
    type: "RESPIRATORY_RATE",
    title: "Respiratory Rate",
    description: "Monitor your breathing rate.",
    unit: "breaths/min",
    icon: Wind,
  },
  {
    id: "body-temperature",
    type: "BODY_TEMPERATURE",
    title: "Body Temperature",
    description: "Track your body temperature.",
    unit: "°C",
    icon: Thermometer,
  },
  {
    id: "blood-pressure",
    type: "BLOOD_PRESSURE",
    title: "Blood Pressure",
    description: "Track your blood pressure readings.",
    unit: "mmHg",
    icon: Gauge,
  },
  {
    id: "stress-level",
    type: "STRESS_LEVEL",
    title: "Stress Level",
    description: "Monitor your stress-related measurements.",
    unit: "",
    icon: Brain,
  },
  {
    id: "hydration",
    type: "HYDRATION",
    title: "Hydration",
    description: "Track your hydration information.",
    unit: "ml",
    icon: Droplets,
  },
  {
    id: "irregular-heart-rhythm",
    type: "IRREGULAR_HEART_RHYTHM",
    title: "Irregular Heart Rhythm",
    description: "Monitor irregular heart rhythm detection.",
    unit: "",
    icon: Activity,
  },
];


/* =========================================================
   SUMMARY DEFINITIONS
========================================================= */

const summaryItems = [
  {
    id: "heart-rate",
    type: "HEART_RATE",
    title: "Heart Rate",
    unit: "bpm",
    icon: HeartPulse,
  },
  {
    id: "blood-oxygen",
    type: "BLOOD_OXYGEN",
    title: "Blood Oxygen",
    unit: "%",
    icon: Waves,
  },
  {
    id: "blood-pressure",
    type: "BLOOD_PRESSURE",
    title: "Blood Pressure",
    unit: "mmHg",
    icon: Gauge,
  },
  {
    id: "body-temperature",
    type: "BODY_TEMPERATURE",
    title: "Temperature",
    unit: "°C",
    icon: Thermometer,
  },
];


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatReadingDate(dateValue) {
  if (!dateValue) {
    return "Just now";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({ item, reading }) {
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
            ? `Recorded ${formatReadingDate(
                reading.recordedAt,
              )}`
            : "Latest reading"}
        </small>

      </div>

    </div>
  );
}


/* =========================================================
   VITAL CARD
========================================================= */

function VitalCard({
  vital,
  reading,
  onAdd,
  onHistory,
}) {
  const Icon = vital.icon;

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
          title={`View ${vital.title} history`}
        >
          <History size={15} />
        </button>

      </div>


      {/* CONTENT */}

      <div className="health-vital-detail-card__content">

        <h3>
          {vital.title}
        </h3>

        <p>
          {vital.description}
        </p>

      </div>


      {/* READING */}

      <div className="health-vital-detail-card__reading">

        <div>

          <strong>
            {reading?.value ?? "--"}
          </strong>

          {vital.unit && (
            <span>
              {vital.unit}
            </span>
          )}

        </div>

        <small>
          {reading
            ? `Recorded ${formatReadingDate(
                reading.recordedAt,
              )}`
            : "No reading yet"}
        </small>

      </div>


      {/* ADD BUTTON */}

      <button
        type="button"
        className="health-vital-add-btn"
        onClick={onAdd}
      >

        <Plus size={15} />

        Add Reading

      </button>

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function VitalSignsPage() {

  const navigate = useNavigate();


  /* =======================================================
     READINGS
  ======================================================= */

  const [readings, setReadings] =
    useState({});


  /* =======================================================
     HISTORY
  ======================================================= */

  const [history, setHistory] =
    useState([]);


  /* =======================================================
     SELECTED VITAL
  ======================================================= */

  const [selectedVital, setSelectedVital] =
    useState(null);


  /* =======================================================
     FORM VALUES
  ======================================================= */

  const [readingValue, setReadingValue] =
    useState("");


  const [readingDate, setReadingDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 16),
    );


  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);


  const [saving, setSaving] =
    useState(false);


  const [error, setError] =
    useState("");


  /* =======================================================
     FETCH HEALTH METRICS
  ======================================================= */

  const fetchReadings = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/health/metrics",
        );

      const metrics =
        response.data?.metrics || [];


      /* -----------------------------------------------
         KEEP ONLY VITAL SIGN METRICS
      ----------------------------------------------- */

      const vitalMetrics =
        metrics.filter((metric) =>
          vitalSigns.some(
            (vital) =>
              vital.type === metric.type,
          ),
        );


      /* -----------------------------------------------
         LATEST READING PER VITAL
      ----------------------------------------------- */

      const latestReadings = {};


      for (const metric of vitalMetrics) {

        if (
          !latestReadings[metric.type]
        ) {
          latestReadings[metric.type] =
            metric;
        }

      }


      setReadings(
        latestReadings,
      );

      setHistory(
        vitalMetrics,
      );

    } catch (err) {

      console.error(
        "Failed to load vital signs:",
        err,
      );

      setError(
        err.response?.data?.message ||
          "Failed to load vital signs.",
      );

    } finally {

      setLoading(false);

    }
  };


  /* =======================================================
     LOAD ON PAGE OPEN
  ======================================================= */

  useEffect(() => {

    fetchReadings();

  }, []);


  /* =======================================================
     OPEN ADD READING
  ======================================================= */

  const handleAddReading = (vital) => {

    const existingReading =
      readings[vital.type];


    setSelectedVital(vital);

    setReadingValue(
      existingReading?.value !== undefined
        ? String(existingReading.value)
        : "",
    );


    setReadingDate(
      existingReading?.recordedAt
        ? new Date(
            existingReading.recordedAt,
          )
            .toISOString()
            .slice(0, 16)
        : new Date()
            .toISOString()
            .slice(0, 16),
    );

  };


  /* =======================================================
     HERO ADD READING
  ======================================================= */

  const handleHeroAddReading = () => {

    handleAddReading(
      vitalSigns[0],
    );

  };


  /* =======================================================
     HISTORY
  ======================================================= */

  const handleHistory = (vital) => {

    const vitalHistory =
      history.filter(
        (metric) =>
          metric.type === vital.type,
      );


    if (
      vitalHistory.length === 0
    ) {

      alert(
        `No ${vital.title.toLowerCase()} readings have been added yet.`,
      );

      return;

    }


    const historyText =
      vitalHistory
        .map(
          (metric) =>
            `${metric.value} ${
              metric.unit
            } — ${formatReadingDate(
              metric.recordedAt,
            )}`,
        )
        .join("\n");


    alert(
      `${vital.title} History\n\n${historyText}`,
    );

  };


  /* =======================================================
     SAVE READING
  ======================================================= */

  const handleSaveReading = async () => {

    if (!selectedVital) {
      return;
    }


    /* -----------------------------------------------
       VALIDATION
    ----------------------------------------------- */

    if (
      readingValue === "" ||
      readingValue === null ||
      readingValue === undefined
    ) {

      alert(
        "Please enter a reading.",
      );

      return;

    }


    const numericValue =
      Number(readingValue);


    if (
      !Number.isFinite(
        numericValue,
      )
    ) {

      alert(
        "Please enter a valid number.",
      );

      return;

    }


    if (
      selectedVital.type ===
      "BLOOD_PRESSURE"
    ) {

      alert(
        "Blood pressure will be handled with separate systolic and diastolic values in the next improvement.",
      );

      return;

    }


    try {

      setSaving(true);
      setError("");


      const response =
        await api.post(
          "/health/metrics",
          {
            type:
              selectedVital.type,

            value:
              numericValue,

            unit:
              selectedVital.unit,

            recordedAt:
              readingDate
                ? new Date(
                    readingDate,
                  ).toISOString()
                : new Date().toISOString(),
          },
        );


      const savedMetric =
        response.data?.metric;


      if (!savedMetric) {

        throw new Error(
          "Invalid response from server",
        );

      }


      /* -----------------------------------------------
         UPDATE LATEST READING
      ----------------------------------------------- */

      setReadings(
        (previous) => ({
          ...previous,

          [savedMetric.type]:
            savedMetric,
        }),
      );


      /* -----------------------------------------------
         UPDATE HISTORY
      ----------------------------------------------- */

      setHistory(
        (previous) => [
          savedMetric,
          ...previous,
        ],
      );


      /* -----------------------------------------------
         CLOSE MODAL
      ----------------------------------------------- */

      setSelectedVital(null);
      setReadingValue("");

    } catch (err) {

      console.error(
        "Failed to save vital reading:",
        err,
      );

      const message =
        err.response?.data?.message ||
        "Failed to save reading.";

      setError(message);

      alert(message);

    } finally {

      setSaving(false);

    }
  };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {

    await fetchReadings();

  };


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {

    if (saving) {
      return;
    }

    setSelectedVital(null);
    setReadingValue("");

  };


  /* =======================================================
     PAGE
  ======================================================= */

  return (

    <div className="health-page health-vitals-page">


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

            <HeartPulse size={14} />

            Health · Vital Signs

          </div>


          {/* TITLE */}

          <h1>
            Vital Signs
          </h1>


          {/* DESCRIPTION */}

          <p>
            Monitor your essential health measurements
            and vital signs in one place.
          </p>

        </div>


        {/* ACTIONS */}

        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "health-refresh-spinning"
                  : ""
              }
            />

            {loading
              ? "Loading..."
              : "Refresh"}

          </button>


          <button
            type="button"
            className="create-notification-btn"
            onClick={handleHeroAddReading}
          >

            <Plus size={16} />

            Add Reading

          </button>

        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div
          className="health-error-message"
          role="alert"
        >
          {error}
        </div>

      )}


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">

        {summaryItems.map(
          (item) => (

            <SummaryCard
              key={item.id}
              item={item}
              reading={
                readings[item.type]
              }
            />

          ),
        )}

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
              VITAL SIGNS MONITORING
            </span>

            <h2>
              Your Vital Signs
            </h2>

            <p>
              Record and monitor your essential health
              measurements.
            </p>

          </div>


          <div className="health-history-icon">

            <Activity size={21} />

          </div>

        </div>


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (

          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              color: "#8797aa",
            }}
          >
            Loading vital signs...
          </div>

        ) : (

          /* =================================================
             VITAL GRID
          ================================================= */

          <div className="health-vitals-detail-grid">

            {vitalSigns.map(
              (vital) => (

                <VitalCard
                  key={vital.id}
                  vital={vital}
                  reading={
                    readings[vital.type]
                  }
                  onAdd={() =>
                    handleAddReading(
                      vital,
                    )
                  }
                  onHistory={() =>
                    handleHistory(
                      vital,
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

      {selectedVital && (

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


            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="health-modal__header">

              <div>

                <span>
                  ADD HEALTH READING
                </span>

                <h2>
                  {selectedVital.title}
                </h2>

              </div>


              <button
                type="button"
                onClick={closeModal}
                className="health-modal-close"
                aria-label="Close"
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div className="health-modal__body">

              <label htmlFor="health-reading">
                Reading
              </label>

              <input
                id="health-reading"
                type="number"
                step="any"
                value={readingValue}
                onChange={(event) =>
                  setReadingValue(
                    event.target.value,
                  )
                }
                placeholder={
                  selectedVital.unit
                    ? `Enter value in ${selectedVital.unit}`
                    : "Enter reading"
                }
                disabled={saving}
                autoFocus
              />


              {selectedVital.unit && (

                <small>
                  Unit: {selectedVital.unit}
                </small>

              )}


              <label htmlFor="health-reading-date">
                Date & Time
              </label>

              <input
                id="health-reading-date"
                type="datetime-local"
                value={readingDate}
                onChange={(event) =>
                  setReadingDate(
                    event.target.value,
                  )
                }
                disabled={saving}
              />

            </div>


            {/* =================================================
                MODAL FOOTER
            ================================================= */}

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

    </div>
  );
}