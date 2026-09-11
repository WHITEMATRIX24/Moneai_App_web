// src/pages/health/MentalHealthWellnessPage.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BrainCircuit,
  Brain,
  Smile,
  Headphones,
  Heart,
  Lightbulb,
  Plus,
  History,
  TrendingUp,
  X,
  Trash2,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api.js";
import "./MentalHealthWellnessPage.css";



/* =========================================================
   MENTAL HEALTH FEATURES
========================================================= */

const mentalHealthFeatures = [
  {
    id: "mood-tracking",
    title: "Mood Tracking",
    description:
      "Track your daily mood and emotional patterns.",
    icon: Smile,
    unit: "",
  },
  {
    id: "stress-tracking",
    title: "Stress Tracking",
    description:
      "Monitor stress levels and understand changes over time.",
    icon: Brain,
    unit: "",
  },
  {
    id: "mindfulness",
    title: "Mindfulness",
    description:
      "Track mindfulness activities and daily awareness.",
    icon: BrainCircuit,
    unit: "min",
  },
  {
    id: "meditation",
    title: "Meditation",
    description:
      "Track meditation sessions and build healthy habits.",
    icon: Headphones,
    unit: "min",
  },
  {
    id: "emotional-wellness",
    title: "Emotional Wellness",
    description:
      "Understand emotional wellness patterns over time.",
    icon: Heart,
    unit: "",
  },
  {
    id: "mental-wellness-insights",
    title: "Mental Wellness Insights",
    description:
      "Review insights based on your wellness patterns.",
    icon: Lightbulb,
    unit: "",
  },
];


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {

  if (!value) {
    return "--";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "--";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}


/* =========================================================
   DATE & TIME FORMAT
========================================================= */

function formatDateTime(value) {

  if (!value) {
    return "--";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "--";
  }

  return date.toLocaleString(
    "en-IN",
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
   FEATURE CARD
========================================================= */

function MentalHealthCard({
  feature,
  latest,
  onAdd,
  onHistory,
}) {

  const Icon =
    feature.icon;


  let reading =
    "--";

  let subtitle =
    "No data yet";


  if (latest) {

    reading =
      latest.value ||
      "--";

    subtitle =
      formatDateTime(
        latest.recordedAt,
      );

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
        Add Entry
      </button>

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function MentalHealthWellnessPage() {

  const navigate =
    useNavigate();


  /* =======================================================
     STATE
  ======================================================= */

  const [data, setData] =
    useState([]);

  const [
    selectedFeature,
    setSelectedFeature,
  ] = useState(null);

  const [
    historyFeature,
    setHistoryFeature,
  ] = useState(null);

  const [
    historyData,
    setHistoryData,
  ] = useState([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    entryValue,
    setEntryValue,
  ] = useState("");

  const [
    entryNotes,
    setEntryNotes,
  ] = useState("");

  const [
    entryDate,
    setEntryDate,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 16),
  );


  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/mental-health-wellness",
        );

      setData(
        response.data?.data || [],
      );

    } catch (err) {

      console.error(
        "Failed to load mental health data:",
        err,
      );

      setError(
        err.response?.data?.message ||
        "Failed to load mental health data.",
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
     LATEST ENTRY BY FEATURE
  ======================================================= */

  const latestByFeature =
    useMemo(() => {

      const result = {};

      for (
        const item of data
      ) {

        if (
          !result[
            item.featureType
          ]
        ) {

          result[
            item.featureType
          ] = item;

        }

      }

      return result;

    }, [data]);


  /* =======================================================
     SUMMARY DATA
  ======================================================= */

  const moodData =
    latestByFeature[
      "mood-tracking"
    ];

  const stressData =
    latestByFeature[
      "stress-tracking"
    ];

  const meditationData =
    latestByFeature[
      "meditation"
    ];

  const wellnessData =
    latestByFeature[
      "emotional-wellness"
    ];


  /* =======================================================
     TODAY MEDITATION TOTAL
  ======================================================= */

  const todayMeditation =
    useMemo(() => {

      const today =
        new Date();

      const year =
        today.getFullYear();

      const month =
        today.getMonth();

      const day =
        today.getDate();


      return data
        .filter(
          (item) => {

            if (
              item.featureType !==
              "meditation"
            ) {
              return false;
            }

            const date =
              new Date(
                item.recordedAt,
              );

            return (
              date.getFullYear() ===
                year &&
              date.getMonth() ===
                month &&
              date.getDate() ===
                day
            );

          },
        )
        .reduce(
          (
            total,
            item,
          ) => {

            const value =
              Number(
                item.numericValue ??
                item.value,
              );

            return Number.isNaN(value)
              ? total
              : total + value;

          },
          0,
        );

    }, [data]);


  /* =======================================================
     ADD ENTRY
  ======================================================= */

  const handleAddEntry = (
    feature,
  ) => {

    setError("");

    setEntryValue("");

    setEntryNotes("");

    setEntryDate(
      new Date()
        .toISOString()
        .slice(0, 16),
    );

    setSelectedFeature(
      feature,
    );
  };


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {

    setSelectedFeature(null);

    setEntryValue("");

    setEntryNotes("");

  };


  /* =======================================================
     SAVE ENTRY
  ======================================================= */

  const handleSave = async () => {

    if (
      !selectedFeature
    ) {
      return;
    }


    if (
      !entryValue.trim()
    ) {

      setError(
        "Please enter a value before saving.",
      );

      return;
    }


    try {

      setSaving(true);
      setError("");


      const isNumericFeature =
        selectedFeature.id ===
          "mindfulness" ||
        selectedFeature.id ===
          "meditation";


      await api.post(
        "/mental-health-wellness",
        {
          featureType:
            selectedFeature.id,

          value:
            entryValue.trim(),

          numericValue:
            isNumericFeature
              ? Number(entryValue)
              : null,

          recordedAt:
            entryDate,

          notes:
            entryNotes.trim(),
        },
      );


      closeModal();

      await loadData();

    } catch (err) {

      console.error(
        "Failed to save mental health entry:",
        err,
      );

      setError(
        err.response?.data?.message ||
        "Failed to save mental health entry.",
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

      setHistoryFeature(
        feature,
      );

      const response =
        await api.get(
          `/mental-health-wellness/history/${feature.id}`,
        );

      setHistoryData(
        response.data?.data || [],
      );

    } catch (err) {

      console.error(
        "Failed to load mental health history:",
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
     DELETE HISTORY ENTRY
  ======================================================= */

  const handleDelete = async (
    id,
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this entry?",
      );

    if (!confirmed) {
      return;
    }


    try {

      await api.delete(
        `/mental-health-wellness/${id}`,
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
        "Failed to delete entry:",
        err,
      );

      setError(
        err.response?.data?.message ||
        "Failed to delete entry.",
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

            <BrainCircuit size={14} />

            Health · Mental Health & Wellness

          </div>


          <h1>
            Mental Health & Wellness
          </h1>


          <p>
            Track your mood, stress,
            mindfulness, meditation
            and emotional wellness
            in one place.
          </p>

        </div>


        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={
              handleRefresh
            }
            disabled={loading}
          >

            <TrendingUp
              size={16}
            />

            {loading
              ? "Refreshing..."
              : "Refresh"}

          </button>


          <button
            type="button"
            className="create-notification-btn"
            onClick={() =>
              handleAddEntry(
                mentalHealthFeatures[0],
              )
            }
          >

            <Plus size={16} />

            Add Entry

          </button>

        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div
          style={{
            margin:
              "15px 0",
            padding:
              "12px 15px",
            borderRadius:
              "10px",
            background:
              "#fff3f3",
            color:
              "#c43d3d",
            fontSize:
              "13px",
            fontWeight:
              700,
          }}
        >
          {error}
        </div>

      )}


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">


        {/* MOOD */}

        <div className="summary-card">

          <div className="summary-icon">
            <Smile size={20} />
          </div>

          <div>

            <span>
              Mood
            </span>

            <strong>
              {moodData?.value ||
                "--"}
            </strong>

            <small>
              Latest entry
            </small>

          </div>

        </div>


        {/* STRESS */}

        <div className="summary-card">

          <div className="summary-icon">
            <Brain size={20} />
          </div>

          <div>

            <span>
              Stress
            </span>

            <strong>
              {stressData?.value ||
                "--"}
            </strong>

            <small>
              Latest level
            </small>

          </div>

        </div>


        {/* MEDITATION */}

        <div className="summary-card">

          <div className="summary-icon">
            <Headphones size={20} />
          </div>

          <div>

            <span>
              Meditation
            </span>

            <strong>

              {todayMeditation}

              <small className="health-summary-unit">
                min
              </small>

            </strong>

            <small>
              Today
            </small>

          </div>

        </div>


        {/* WELLNESS */}

        <div className="summary-card">

          <div className="summary-icon">
            <Heart size={20} />
          </div>

          <div>

            <span>
              Wellness
            </span>

            <strong>
              {wellnessData?.value ||
                "--"}
            </strong>

            <small>
              Latest insight
            </small>

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="health-main-card">


        {/* HEADER */}

        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              MENTAL HEALTH & WELLNESS
            </span>

            <h2>
              Your Mental Wellness
            </h2>

            <p>
              Record and monitor your
              emotional and mental
              wellness information.
            </p>

          </div>


          <div className="health-history-icon">

            <BrainCircuit
              size={21}
            />

          </div>

        </div>


        {/* FEATURE GRID */}

        <div className="health-vitals-detail-grid">

          {mentalHealthFeatures.map(
            (feature) => (

              <MentalHealthCard
                key={feature.id}
                feature={feature}
                latest={
                  latestByFeature[
                    feature.id
                  ]
                }
                onAdd={() =>
                  handleAddEntry(
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

      </section>


      {/* =====================================================
          ADD ENTRY MODAL
      ===================================================== */}

      {selectedFeature && (

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
                  ADD WELLNESS ENTRY
                </span>

                <h2>
                  {selectedFeature.title}
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeModal
                }
                className="health-modal-close"
                title="Close"
              >

                <X size={18} />

              </button>

            </div>


            {/* BODY */}

            <div className="health-modal__body">

              <label>
                Entry
              </label>


              <input
                type={
                  selectedFeature.unit
                    ? "number"
                    : "text"
                }
                min={
                  selectedFeature.unit
                    ? "0"
                    : undefined
                }
                step={
                  selectedFeature.unit
                    ? "1"
                    : undefined
                }
                value={
                  entryValue
                }
                placeholder={
                  selectedFeature.id ===
                  "mood-tracking"
                    ? "Enter your mood"
                    : selectedFeature.id ===
                      "stress-tracking"
                    ? "Enter stress level"
                    : selectedFeature.id ===
                      "emotional-wellness"
                    ? "Enter emotional wellness status"
                    : selectedFeature.id ===
                      "mental-wellness-insights"
                    ? "Enter wellness insight"
                    : selectedFeature.unit
                    ? `Enter value in ${selectedFeature.unit}`
                    : "Enter your entry"
                }
                onChange={(
                  event,
                ) =>
                  setEntryValue(
                    event.target.value,
                  )
                }
              />


              {selectedFeature.unit && (

                <small>
                  Unit:{" "}
                  {
                    selectedFeature.unit
                  }
                </small>

              )}


              <label>
                Date & Time
              </label>


              <input
                type="datetime-local"
                value={
                  entryDate
                }
                onChange={(
                  event,
                ) =>
                  setEntryDate(
                    event.target.value,
                  )
                }
              />


              <label>
                Notes
              </label>


              <textarea
                rows={4}
                value={
                  entryNotes
                }
                placeholder="Add any additional notes..."
                onChange={(
                  event,
                ) =>
                  setEntryNotes(
                    event.target.value,
                  )
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

                {saving
                  ? "Saving..."
                  : "Save Entry"}

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
            setHistoryFeature(
              null,
            )
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
                  WELLNESS HISTORY
                </span>

                <h2>
                  {historyFeature.title}
                </h2>

              </div>


              <button
                type="button"
                className="health-modal-close"
                onClick={() =>
                  setHistoryFeature(
                    null,
                  )
                }
              >
                <X size={18} />
              </button>

            </div>


            {/* HISTORY */}

            <div
              className="health-modal__body"
              style={{
                maxHeight:
                  "430px",
                overflowY:
                  "auto",
              }}
            >

              {historyLoading ? (

                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "35px 10px",
                    color:
                      "#8797aa",
                  }}
                >
                  Loading history...
                </div>

              ) : historyData.length ===
                0 ? (

                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "35px 10px",
                    color:
                      "#8797aa",
                  }}
                >

                  <History
                    size={30}
                    style={{
                      marginBottom:
                        "10px",
                    }}
                  />

                  <div
                    style={{
                      fontWeight:
                        800,
                      color:
                        "#19334f",
                      marginBottom:
                        "5px",
                    }}
                  >
                    No history yet
                  </div>

                  <small>
                    Add an entry to
                    create your history.
                  </small>

                </div>

              ) : (

                historyData.map(
                  (item) => (

                    <div
                      key={
                        item._id
                      }
                      style={{
                        border:
                          "1px solid #e8edf3",
                        borderRadius:
                          "12px",
                        padding:
                          "14px",
                        marginBottom:
                          "10px",
                        background:
                          "#fbfcfe",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap:
                            "10px",
                          alignItems:
                            "flex-start",
                        }}
                      >

                        <div>

                          <strong
                            style={{
                              display:
                                "block",
                              color:
                                "#19334f",
                              marginBottom:
                                "5px",
                            }}
                          >
                            {item.value}
                            {historyFeature.unit
                              ? ` ${historyFeature.unit}`
                              : ""}
                          </strong>


                          <div
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#718196",
                            }}
                          >
                            {formatDateTime(
                              item.recordedAt,
                            )}
                          </div>


                          {item.notes && (

                            <div
                              style={{
                                marginTop:
                                  "8px",
                                fontSize:
                                  "12px",
                                color:
                                  "#6f8094",
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
                          title="Delete"
                          style={{
                            border:
                              "1px solid #f0d6d6",
                            background:
                              "#fff",
                            color:
                              "#c94a4a",
                            borderRadius:
                              "8px",
                            width:
                              "32px",
                            height:
                              "32px",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            cursor:
                              "pointer",
                            flexShrink:
                              0,
                          }}
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


            {/* FOOTER */}

            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setHistoryFeature(
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