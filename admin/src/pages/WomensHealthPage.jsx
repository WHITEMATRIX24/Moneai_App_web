// src/pages/health/WomensHealthPage.jsx

import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Activity,
  Baby,
  CalendarCheck,
  CalendarHeart,
  Clock3,
  Heart,
  History,
  LineChart,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../services/api.js";
import "./WomensHealthPage.css";



/* =========================================================
   WOMEN'S HEALTH FEATURES
========================================================= */

const womenHealthFeatures = [
  {
    id: "menstrual-cycle",
    title: "Menstrual Cycle Tracking",
    description:
      "Track menstrual cycles, periods and cycle history.",
    icon: CalendarHeart,
    unit: "",
  },
  {
    id: "cycle-predictions",
    title: "Cycle Predictions",
    description:
      "View estimated upcoming cycle and period dates.",
    icon: CalendarCheck,
    unit: "",
  },
  {
    id: "ovulation",
    title: "Ovulation Tracking",
    description:
      "Track estimated ovulation dates and patterns.",
    icon: Target,
    unit: "",
  },
  {
    id: "fertility",
    title: "Fertility Tracking",
    description:
      "Track fertility-related information and patterns.",
    icon: Heart,
    unit: "",
  },
  {
    id: "pregnancy",
    title: "Pregnancy Tracking",
    description:
      "Track pregnancy-related information and progress.",
    icon: Baby,
    unit: "",
  },
  {
    id: "women-insights",
    title: "Women's Health Insights",
    description:
      "Understand women's health patterns and trends.",
    icon: Sparkles,
    unit: "",
  },
];


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(value) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


/* =========================================================
   FEATURE CARD
========================================================= */

function WomenHealthCard({
  feature,
  latest,
  onAdd,
  onHistory,
}) {
  const Icon = feature.icon;

  let reading = "--";
  let subtitle = "No data yet";

  if (latest) {
    if (feature.id === "menstrual-cycle") {
      reading =
        latest.cycleDay
          ? `Day ${latest.cycleDay}`
          : "Recorded";

      subtitle = formatDate(
        latest.recordedDate,
      );
    } else if (
      feature.id === "cycle-predictions"
    ) {
      reading = latest.predictedPeriodDate
        ? formatDate(
            latest.predictedPeriodDate,
          )
        : "Recorded";

      subtitle = latest.predictedPeriodDate
        ? "Next period"
        : formatDate(
            latest.recordedDate,
          );
    } else if (
      feature.id === "ovulation"
    ) {
      reading = latest.ovulationDate
        ? formatDate(
            latest.ovulationDate,
          )
        : "Recorded";

      subtitle = latest.ovulationDate
        ? "Estimated date"
        : formatDate(
            latest.recordedDate,
          );
    } else if (
      feature.id === "fertility"
    ) {
      reading =
        latest.fertilityStatus ||
        "Recorded";

      subtitle = formatDate(
        latest.recordedDate,
      );
    } else if (
      feature.id === "pregnancy"
    ) {
      reading =
        latest.pregnancyWeek !== null &&
        latest.pregnancyWeek !== undefined
          ? `Week ${latest.pregnancyWeek}`
          : "Recorded";

      subtitle =
        latest.pregnancyStatus ||
        formatDate(
          latest.recordedDate,
        );
    } else if (
      feature.id === "women-insights"
    ) {
      reading = "Available";
      subtitle = formatDate(
        latest.recordedDate,
      );
    }
  }

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

        <div>
          <strong>
            {reading}
          </strong>

          {feature.unit && (
            <span>
              {feature.unit}
            </span>
          )}
        </div>

        <small>
          {subtitle}
        </small>

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

export default function WomensHealthPage() {

  const navigate = useNavigate();


  /* =======================================================
     STATE
  ======================================================= */

  const [data, setData] =
    useState([]);

  const [selectedFeature, setSelectedFeature] =
    useState(null);

  const [historyFeature, setHistoryFeature] =
    useState(null);

  const [historyData, setHistoryData] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    recordedDate:
      new Date()
        .toISOString()
        .slice(0, 10),

    notes: "",

    cycleDay: "",
    cycleLength: "",

    periodStartDate: "",
    periodEndDate: "",

    predictedPeriodDate: "",

    ovulationDate: "",

    fertilityStatus: "",

    pregnancyWeek: "",
    pregnancyStatus: "",
  });


  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/womens-health",
        );

      setData(
        response.data?.data || [],
      );

    } catch (err) {

      console.error(
        "Failed to load women's health data:",
        err,
      );

      setError(
        err.response?.data?.message ||
        "Failed to load women's health data.",
      );

    } finally {

      setLoading(false);

    }
  };


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadData();
  }, []);


  /* =======================================================
     FILTER
  ======================================================= */

  const filteredFeatures = useMemo(() => {

    const query =
      search
        .trim()
        .toLowerCase();

    if (!query) {
      return womenHealthFeatures;
    }

    return womenHealthFeatures.filter(
      (feature) =>
        feature.title
          .toLowerCase()
          .includes(query) ||
        feature.description
          .toLowerCase()
          .includes(query),
    );

  }, [search]);


  /* =======================================================
     LATEST RECORD BY FEATURE
  ======================================================= */

  const latestByFeature =
    useMemo(() => {

      const result = {};

      for (const item of data) {

        if (!result[item.featureType]) {
          result[item.featureType] =
            item;
        }

      }

      return result;

    }, [data]);


  /* =======================================================
     SUMMARY DATA
  ======================================================= */

  const cycleData =
    latestByFeature[
      "menstrual-cycle"
    ];

  const predictionData =
    latestByFeature[
      "cycle-predictions"
    ];

  const ovulationData =
    latestByFeature[
      "ovulation"
    ];

  const fertilityData =
    latestByFeature[
      "fertility"
    ];


  /* =======================================================
     ADD DATA
  ======================================================= */

  const handleAddData = (feature) => {

    setError("");

    setForm({
      recordedDate:
        new Date()
          .toISOString()
          .slice(0, 10),

      notes: "",

      cycleDay: "",
      cycleLength: "",

      periodStartDate: "",
      periodEndDate: "",

      predictedPeriodDate: "",

      ovulationDate: "",

      fertilityStatus: "",

      pregnancyWeek: "",
      pregnancyStatus: "",
    });

    setSelectedFeature(feature);
  };


  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleFormChange = (
    event,
  ) => {

    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = async () => {

    if (!selectedFeature) {
      return;
    }

    try {

      setSaving(true);
      setError("");

      await api.post(
        "/womens-health",
        {
          featureType:
            selectedFeature.id,

          ...form,

          cycleDay:
            form.cycleDay || null,

          cycleLength:
            form.cycleLength || null,

          pregnancyWeek:
            form.pregnancyWeek || null,

          periodStartDate:
            form.periodStartDate || null,

          periodEndDate:
            form.periodEndDate || null,

          predictedPeriodDate:
            form.predictedPeriodDate || null,

          ovulationDate:
            form.ovulationDate || null,
        },
      );

      setSelectedFeature(null);

      await loadData();

    } catch (err) {

      console.error(
        "Failed to save women's health data:",
        err,
      );

      setError(
        err.response?.data?.message ||
        "Failed to save women's health data.",
      );

    } finally {

      setSaving(false);

    }
  };


  /* =======================================================
     HISTORY
  ======================================================= */

  const handleHistory = async (
    feature,
  ) => {

    try {

      setHistoryLoading(true);
      setError("");

      setHistoryFeature(feature);

      const response =
        await api.get(
          `/womens-health/history/${feature.id}`,
        );

      setHistoryData(
        response.data?.data || [],
      );

    } catch (err) {

      console.error(
        "Failed to load women's health history:",
        err,
      );

      setHistoryData([]);

      setError(
        err.response?.data?.message ||
        "Failed to load history.",
      );

    } finally {

      setHistoryLoading(false);

    }
  };


  /* =======================================================
     DELETE HISTORY ITEM
  ======================================================= */

  const handleDelete = async (
    id,
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this record?",
      );

    if (!confirmed) {
      return;
    }

    try {

      await api.delete(
        `/womens-health/${id}`,
      );

      setHistoryData(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !== id,
          ),
      );

      await loadData();

    } catch (err) {

      console.error(
        "Failed to delete record:",
        err,
      );

      setError(
        err.response?.data?.message ||
        "Failed to delete record.",
      );
    }
  };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    await loadData();
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
            <CalendarHeart size={14} />
            Health · Women's Health
          </div>


          <h1>
            Women's Health Tracking
          </h1>


          <p>
            Track menstrual cycles, fertility,
            pregnancy and other women's health
            information in one place.
          </p>

        </div>


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
                  ? "health-spin"
                  : ""
              }
            />
            Refresh
          </button>


          <button
            type="button"
            className="create-notification-btn"
            onClick={() =>
              handleAddData(
                womenHealthFeatures[0],
              )
            }
          >
            <Plus size={16} />
            Add Data
          </button>

        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div
          style={{
            margin: "15px 0",
            padding: "12px 15px",
            borderRadius: "10px",
            background: "#fff3f3",
            color: "#c43d3d",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {error}
        </div>

      )}


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">


        {/* CYCLE */}

        <div className="summary-card">

          <div className="summary-icon">
            <CalendarHeart size={20} />
          </div>

          <div>

            <span>
              Cycle
            </span>

            <strong>
              {cycleData?.cycleDay
                ? `Day ${cycleData.cycleDay}`
                : "--"}
            </strong>

            <small>
              Current cycle
            </small>

          </div>

        </div>


        {/* NEXT PERIOD */}

        <div className="summary-card">

          <div className="summary-icon">
            <CalendarCheck size={20} />
          </div>

          <div>

            <span>
              Next Period
            </span>

            <strong>
              {predictionData?.predictedPeriodDate
                ? formatDate(
                    predictionData.predictedPeriodDate,
                  )
                : "--"}
            </strong>

            <small>
              Estimated date
            </small>

          </div>

        </div>


        {/* OVULATION */}

        <div className="summary-card">

          <div className="summary-icon">
            <Target size={20} />
          </div>

          <div>

            <span>
              Ovulation
            </span>

            <strong>
              {ovulationData?.ovulationDate
                ? formatDate(
                    ovulationData.ovulationDate,
                  )
                : "--"}
            </strong>

            <small>
              Estimated date
            </small>

          </div>

        </div>


        {/* FERTILITY */}

        <div className="summary-card">

          <div className="summary-icon">
            <Heart size={20} />
          </div>

          <div>

            <span>
              Fertility
            </span>

            <strong>
              {fertilityData?.fertilityStatus ||
                "--"}
            </strong>

            <small>
              Current status
            </small>

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="health-main-card">


        {/* TOOLBAR */}

        <div className="health-main-toolbar">

          <div className="health-search">

            <Activity size={17} />

            <input
              type="text"
              value={search}
              placeholder="Search women's health features..."
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

          </div>


          <button
            type="button"
            className="health-clear-btn"
            onClick={() =>
              setSearch("")
            }
          >
            Clear Search
          </button>

        </div>


        {/* HEADER */}

        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              WOMEN'S HEALTH MANAGEMENT
            </span>

            <h2>
              Women's Health
            </h2>

            <p>
              Record and monitor your women's
              health information and important
              health patterns.
            </p>

          </div>


          <div className="health-history-icon">
            <CalendarHeart size={21} />
          </div>

        </div>


        {/* FEATURE GRID */}

        <div className="health-vitals-detail-grid">

          {filteredFeatures.length === 0 ? (

            <div
              style={{
                gridColumn: "1 / -1",
                padding: "45px 20px",
                textAlign: "center",
                color: "#8797aa",
              }}
            >

              <CalendarHeart
                size={30}
                style={{
                  marginBottom: "10px",
                }}
              />

              <div
                style={{
                  fontWeight: 800,
                  color: "#19334f",
                  marginBottom: "5px",
                }}
              >
                No features found
              </div>

              <div
                style={{
                  fontSize: "12px",
                }}
              >
                Try a different search.
              </div>

            </div>

          ) : (

            filteredFeatures.map(
              (feature) => (

                <WomenHealthCard
                  key={feature.id}
                  feature={feature}
                  latest={
                    latestByFeature[
                      feature.id
                    ]
                  }
                  onAdd={() =>
                    handleAddData(
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
            )

          )}

        </div>

      </section>


      {/* =====================================================
          ADD DATA MODAL
      ===================================================== */}

      {selectedFeature && (

        <div
          className="health-modal-overlay"
          onClick={() =>
            setSelectedFeature(null)
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
                  ADD WOMEN'S HEALTH DATA
                </span>

                <h2>
                  {selectedFeature.title}
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedFeature(null)
                }
                className="health-modal-close"
              >
                ×
              </button>

            </div>


            {/* BODY */}

            <div className="health-modal__body">


              <label>
                Date
              </label>

              <input
                type="date"
                name="recordedDate"
                value={
                  form.recordedDate
                }
                onChange={
                  handleFormChange
                }
              />


              {/* MENSTRUAL CYCLE */}

              {selectedFeature.id ===
                "menstrual-cycle" && (
                <>
                  <label>
                    Cycle Day
                  </label>

                  <input
                    type="number"
                    name="cycleDay"
                    min="1"
                    max="100"
                    placeholder="Example: 12"
                    value={
                      form.cycleDay
                    }
                    onChange={
                      handleFormChange
                    }
                  />


                  <label>
                    Cycle Length
                  </label>

                  <input
                    type="number"
                    name="cycleLength"
                    min="1"
                    max="100"
                    placeholder="Example: 28"
                    value={
                      form.cycleLength
                    }
                    onChange={
                      handleFormChange
                    }
                  />


                  <label>
                    Period Start Date
                  </label>

                  <input
                    type="date"
                    name="periodStartDate"
                    value={
                      form.periodStartDate
                    }
                    onChange={
                      handleFormChange
                    }
                  />


                  <label>
                    Period End Date
                  </label>

                  <input
                    type="date"
                    name="periodEndDate"
                    value={
                      form.periodEndDate
                    }
                    onChange={
                      handleFormChange
                    }
                  />
                </>
              )}


              {/* CYCLE PREDICTIONS */}

              {selectedFeature.id ===
                "cycle-predictions" && (
                <>
                  <label>
                    Predicted Period Date
                  </label>

                  <input
                    type="date"
                    name="predictedPeriodDate"
                    value={
                      form.predictedPeriodDate
                    }
                    onChange={
                      handleFormChange
                    }
                  />
                </>
              )}


              {/* OVULATION */}

              {selectedFeature.id ===
                "ovulation" && (
                <>
                  <label>
                    Estimated Ovulation Date
                  </label>

                  <input
                    type="date"
                    name="ovulationDate"
                    value={
                      form.ovulationDate
                    }
                    onChange={
                      handleFormChange
                    }
                  />
                </>
              )}


              {/* FERTILITY */}

              {selectedFeature.id ===
                "fertility" && (
                <>
                  <label>
                    Fertility Status
                  </label>

                  <input
                    type="text"
                    name="fertilityStatus"
                    placeholder="Example: Fertile window"
                    value={
                      form.fertilityStatus
                    }
                    onChange={
                      handleFormChange
                    }
                  />
                </>
              )}


              {/* PREGNANCY */}

              {selectedFeature.id ===
                "pregnancy" && (
                <>
                  <label>
                    Pregnancy Week
                  </label>

                  <input
                    type="number"
                    name="pregnancyWeek"
                    min="0"
                    max="50"
                    placeholder="Example: 12"
                    value={
                      form.pregnancyWeek
                    }
                    onChange={
                      handleFormChange
                    }
                  />


                  <label>
                    Pregnancy Status
                  </label>

                  <input
                    type="text"
                    name="pregnancyStatus"
                    placeholder="Example: Ongoing"
                    value={
                      form.pregnancyStatus
                    }
                    onChange={
                      handleFormChange
                    }
                  />
                </>
              )}


              {/* NOTES */}

              <label>
                Notes
              </label>

              <textarea
                name="notes"
                placeholder="Enter relevant information..."
                rows={4}
                value={form.notes}
                onChange={
                  handleFormChange
                }
              />


              <small>
                Your women's health information
                will be securely saved to your
                health database.
              </small>

            </div>


            {/* FOOTER */}

            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setSelectedFeature(null)
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="health-modal-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Data"}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          HISTORY MODAL
      ===================================================== */}

      {historyFeature && (

        <div
          className="health-modal-overlay"
          onClick={() =>
            setHistoryFeature(null)
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
                  WOMEN'S HEALTH HISTORY
                </span>

                <h2>
                  {historyFeature.title}
                </h2>

              </div>


              <button
                type="button"
                className="health-modal-close"
                onClick={() =>
                  setHistoryFeature(null)
                }
              >
                ×
              </button>

            </div>


            <div
              className="health-modal__body"
              style={{
                maxHeight: "430px",
                overflowY: "auto",
              }}
            >

              {historyLoading ? (

                <div
                  style={{
                    textAlign: "center",
                    padding: "35px 10px",
                    color: "#8797aa",
                  }}
                >
                  Loading history...
                </div>

              ) : historyData.length === 0 ? (

                <div
                  style={{
                    textAlign: "center",
                    padding: "35px 10px",
                    color: "#8797aa",
                  }}
                >

                  <History
                    size={30}
                    style={{
                      marginBottom: "10px",
                    }}
                  />

                  <div
                    style={{
                      fontWeight: 800,
                      color: "#19334f",
                    }}
                  >
                    No history yet
                  </div>

                  <small>
                    Add data to create
                    your history.
                  </small>

                </div>

              ) : (

                historyData.map(
                  (item) => (

                    <div
                      key={item._id}
                      style={{
                        border:
                          "1px solid #e8edf3",
                        borderRadius: "12px",
                        padding: "14px",
                        marginBottom: "10px",
                        background:
                          "#fbfcfe",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "10px",
                          alignItems:
                            "flex-start",
                        }}
                      >

                        <div>

                          <strong
                            style={{
                              color:
                                "#19334f",
                              display:
                                "block",
                              marginBottom:
                                "5px",
                            }}
                          >
                            {formatDate(
                              item.recordedDate,
                            )}
                          </strong>


                          {item.cycleDay && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                marginBottom:
                                  "3px",
                              }}
                            >
                              Cycle Day:{" "}
                              {item.cycleDay}
                            </div>
                          )}


                          {item.cycleLength && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                marginBottom:
                                  "3px",
                              }}
                            >
                              Cycle Length:{" "}
                              {item.cycleLength} days
                            </div>
                          )}


                          {item.predictedPeriodDate && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                marginBottom:
                                  "3px",
                              }}
                            >
                              Predicted Period:{" "}
                              {formatDate(
                                item.predictedPeriodDate,
                              )}
                            </div>
                          )}


                          {item.ovulationDate && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                marginBottom:
                                  "3px",
                              }}
                            >
                              Ovulation:{" "}
                              {formatDate(
                                item.ovulationDate,
                              )}
                            </div>
                          )}


                          {item.fertilityStatus && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                marginBottom:
                                  "3px",
                              }}
                            >
                              Fertility:{" "}
                              {
                                item.fertilityStatus
                              }
                            </div>
                          )}


                          {item.pregnancyWeek !==
                            null &&
                            item.pregnancyWeek !==
                              undefined && (
                              <div
                                style={{
                                  fontSize:
                                    "12px",
                                  marginBottom:
                                    "3px",
                                }}
                              >
                                Pregnancy Week:{" "}
                                {
                                  item.pregnancyWeek
                                }
                              </div>
                            )}


                          {item.pregnancyStatus && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                marginBottom:
                                  "3px",
                              }}
                            >
                              Pregnancy Status:{" "}
                              {
                                item.pregnancyStatus
                              }
                            </div>
                          )}


                          {item.notes && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#6f8094",
                                marginTop:
                                  "8px",
                              }}
                            >
                              {item.notes}
                            </div>
                          )}

                        </div>


                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              item._id,
                            )
                          }
                          style={{
                            border:
                              "1px solid #f0d6d6",
                            background:
                              "#fff",
                            color:
                              "#c94a4a",
                            borderRadius:
                              "8px",
                            width: "32px",
                            height: "32px",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            cursor:
                              "pointer",
                            flexShrink: 0,
                          }}
                          title="Delete"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>

                      </div>

                    </div>

                  ),
                )

              )}

            </div>


            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setHistoryFeature(null)
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