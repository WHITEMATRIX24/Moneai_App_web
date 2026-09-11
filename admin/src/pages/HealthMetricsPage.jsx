// src/pages/health/HealthMetricsPage.jsx

import { useState } from "react";

import {
  ArrowLeft,
  Activity,
  BarChart3,
  Calendar,
  History,
  LineChart,
  Percent,
  PersonStanding,
  Plus,
  Ruler,
  Scale,
  TrendingUp,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import "./HealthMetricsPage.css";



/* =========================================================
   HEALTH METRIC DEFINITIONS
========================================================= */

const healthMetrics = [
  {
    id: "weight",
    title: "Weight",
    description: "Track your body weight measurements over time.",
    unit: "kg",
    icon: Scale,
  },
  {
    id: "bmi",
    title: "BMI",
    description: "Track your body mass index measurements.",
    unit: "",
    icon: Ruler,
  },
  {
    id: "body-fat",
    title: "Body Fat",
    description: "Monitor your body fat percentage.",
    unit: "%",
    icon: Percent,
  },
  {
    id: "muscle-mass",
    title: "Muscle Mass",
    description: "Track your muscle mass measurements.",
    unit: "kg",
    icon: PersonStanding,
  },
  {
    id: "body-measurements",
    title: "Body Measurements",
    description: "Track important body measurements.",
    unit: "cm",
    icon: Ruler,
  },
  {
    id: "body-composition-trends",
    title: "Body Composition Trends",
    description: "Understand changes in your body composition over time.",
    unit: "",
    icon: LineChart,
  },
];


/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  metric,
  onAdd,
  onHistory,
}) {
  const Icon = metric.icon;

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
          title="View history"
        >
          <History size={15} />
        </button>

      </div>


      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="health-vital-detail-card__content">

        <h3>
          {metric.title}
        </h3>

        <p>
          {metric.description}
        </p>

      </div>


      {/* ===================================================
          READING
      =================================================== */}

      <div className="health-vital-detail-card__reading">

        <div>

          <strong>
            --
          </strong>

          {metric.unit && (
            <span>
              {metric.unit}
            </span>
          )}

        </div>

        <small>
          No reading yet
        </small>

      </div>


      {/* ===================================================
          ADD BUTTON
      =================================================== */}

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

export default function HealthMetricsPage() {

  const navigate = useNavigate();

  const [selectedMetric, setSelectedMetric] =
    useState(null);

  const [reading, setReading] =
    useState("");

  const [dateTime, setDateTime] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 16)
    );


  /* =======================================================
     ADD READING
  ======================================================= */

  const handleAddReading = (metric) => {

    setSelectedMetric(metric);

    setReading("");

    setDateTime(
      new Date()
        .toISOString()
        .slice(0, 16)
    );

  };


  /* =======================================================
     HISTORY
  ======================================================= */

  const handleHistory = (metric) => {

    alert(
      `${metric.title} history will be connected to the database in the next step.`
    );

  };


  /* =======================================================
     SAVE READING
  ======================================================= */

  const handleSaveReading = () => {

    if (!reading.trim()) {

      alert(
        "Please enter a reading."
      );

      return;

    }

    alert(
      `${selectedMetric.title} reading will be saved to the database in the next step.`
    );

    setSelectedMetric(null);

    setReading("");

  };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {

    /*
      Do not reload the browser.

      Reloading the entire page can cause the Vite
      application to temporarily show a blank screen
      and can unnecessarily reset the application.

      This can later be replaced with an API request.
    */

    console.log(
      "Health metrics refresh requested."
    );

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

            <Ruler size={14} />

            Health · Metrics & Body Composition

          </div>


          {/* TITLE */}
          <h1>
            Health Metrics & Body Composition
          </h1>


          {/* DESCRIPTION */}
          <p>
            Track body measurements, body composition
            and important health metrics in one place.
          </p>

        </div>


        {/* HERO ACTIONS */}

        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={handleRefresh}
          >

            <TrendingUp size={16} />

            Refresh

          </button>


          <button
            type="button"
            className="create-notification-btn"
            onClick={() =>
              handleAddReading(
                healthMetrics[0]
              )
            }
          >

            <Plus size={16} />

            Add Reading

          </button>

        </div>

      </section>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">


        <SummaryCard
          icon={Scale}
          title="Weight"
          value="--"
          unit="kg"
          subtitle="Latest reading"
        />


        <SummaryCard
          icon={Ruler}
          title="BMI"
          value="--"
          unit=""
          subtitle="Latest reading"
        />


        <SummaryCard
          icon={Percent}
          title="Body Fat"
          value="--"
          unit="%"
          subtitle="Latest reading"
        />


        <SummaryCard
          icon={PersonStanding}
          title="Muscle Mass"
          value="--"
          unit="kg"
          subtitle="Latest reading"
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
              BODY COMPOSITION MONITORING
            </span>

            <h2>
              Your Health Metrics
            </h2>

            <p>
              Record and monitor your body measurements
              and composition over time.
            </p>

          </div>


          <div className="health-history-icon">

            <Activity size={21} />

          </div>

        </div>


        {/* ===================================================
            METRICS GRID
        =================================================== */}

        <div className="health-vitals-detail-grid">

          {healthMetrics.map(
            (metric) => (

              <MetricCard
                key={metric.id}
                metric={metric}
                onAdd={() =>
                  handleAddReading(metric)
                }
                onHistory={() =>
                  handleHistory(metric)
                }
              />

            )
          )}

        </div>

      </section>


      {/* =====================================================
          TRENDS INFORMATION
      ===================================================== */}

      <section
        className="health-main-card"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              BODY COMPOSITION
            </span>

            <h2>
              Composition Trends
            </h2>

            <p>
              Your body composition trends will appear
              here as measurements are added.
            </p>

          </div>


          <div className="health-history-icon">

            <BarChart3 size={21} />

          </div>

        </div>


        <div
          style={{
            minHeight: "220px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            textAlign: "center",
            padding: "30px",
          }}
        >

          <div
            className="health-vital-detail-card__icon"
            style={{
              marginBottom: "14px",
            }}
          >

            <LineChart size={24} />

          </div>


          <h3
            style={{
              margin: "0 0 7px",
              color: "#19334f",
              fontSize: "16px",
              fontWeight: 800,
            }}
          >
            No composition data yet
          </h3>


          <p
            style={{
              margin: 0,
              color: "#8797aa",
              fontSize: "13px",
              maxWidth: "450px",
              lineHeight: 1.6,
            }}
          >
            Add weight, BMI, body fat or muscle mass
            readings to start seeing your body composition
            trends.
          </p>

        </div>

      </section>


      {/* =====================================================
          ADD READING MODAL
      ===================================================== */}

      {selectedMetric && (

        <div
          className="health-modal-overlay"
          onClick={() =>
            setSelectedMetric(null)
          }
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
                  {selectedMetric.title}
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedMetric(null)
                }
                className="health-modal-close"
              >
                ×
              </button>

            </div>


            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div className="health-modal__body">


              <label>
                Reading
              </label>


              <input
                type="number"
                step="any"
                value={reading}
                placeholder={
                  selectedMetric.unit
                    ? `Enter value in ${selectedMetric.unit}`
                    : "Enter reading"
                }
                onChange={(event) =>
                  setReading(
                    event.target.value
                  )
                }
              />


              {selectedMetric.unit && (

                <small>
                  Unit: {selectedMetric.unit}
                </small>

              )}


              <label>
                Date & Time
              </label>


              <div
                style={{
                  position: "relative",
                  width: "100%",
                }}
              >

                <Calendar
                  size={16}
                  style={{
                    position: "absolute",
                    left: "13px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    pointerEvents: "none",
                    opacity: 0.65,
                  }}
                />

                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(event) =>
                    setDateTime(
                      event.target.value
                    )
                  }
                  style={{
                    paddingLeft: "40px",
                  }}
                />

              </div>

            </div>


            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setSelectedMetric(null)
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="health-modal-save"
                onClick={
                  handleSaveReading
                }
              >
                Save Reading
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}