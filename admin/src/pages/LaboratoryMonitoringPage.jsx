import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  FlaskConical,
  TestTube,
  Droplets,
  HeartPulse,
  Activity,
  History,
  LineChart,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../services/api.js";
import "./LaboratoryMonitoringPage.css";



/* =========================================================
   LABORATORY TEST DEFINITIONS
========================================================= */

const laboratoryTests = [
  {
    id: "glucose",
    title: "Glucose",
    description:
      "Monitor blood glucose laboratory results.",
    unit: "mg/dL",
    icon: Droplets,
  },

  {
    id: "cholesterol",
    title: "Cholesterol",
    description:
      "Track cholesterol laboratory results.",
    unit: "mg/dL",
    icon: FlaskConical,
  },

  {
    id: "vitamin-levels",
    title: "Vitamin Levels",
    description:
      "Monitor vitamin-related laboratory results.",
    unit: "",
    icon: TestTube,
  },

  {
    id: "kidney-function",
    title: "Kidney Function",
    description:
      "Track kidney function laboratory results.",
    unit: "",
    icon: Activity,
  },
];


/* =========================================================
   HELPERS
========================================================= */

const formatDateTime = (date) => {
  if (!date) {
    return "Not specified";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "Not specified";
  }

  return parsed.toLocaleString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
};


const formatNumber = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "--";
  }

  const number =
    Number(value);

  if (
    Number.isNaN(number)
  ) {
    return "--";
  }

  return Number.isInteger(
    number
  )
    ? String(number)
    : number.toFixed(2);
};


/* =========================================================
   LAB CARD
========================================================= */

function LaboratoryCard({
  test,
  latestResult,
  count,
  onAdd,
  onHistory,
}) {
  const Icon = test.icon;

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
          {test.title}
        </h3>

        <p>
          {test.description}
        </p>

      </div>

      <div className="health-vital-detail-card__reading">

        <div>

          <strong>
            {formatNumber(
              latestResult?.result
            )}
          </strong>

          {test.unit && (
            <span>
              {test.unit}
            </span>
          )}

        </div>

        <small>
          {latestResult
            ? formatDateTime(
                latestResult.recordedAt
              )
            : "No result yet"}
        </small>

      </div>

      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          color: "#8797aa",
        }}
      >
        {count}{" "}
        {count === 1
          ? "record"
          : "records"}
      </div>

      <button
        type="button"
        className="health-vital-add-btn"
        onClick={onAdd}
      >
        <Plus size={15} />

        Add Result

      </button>

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function LaboratoryMonitoringPage() {

  const navigate =
    useNavigate();

  const [
    selectedTest,
    setSelectedTest,
  ] = useState(null);

  const [
    results,
    setResults,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    resultValue,
    setResultValue,
  ] = useState("");

  const [
    recordedAt,
    setRecordedAt,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 16)
  );

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    historyTest,
    setHistoryTest,
  ] = useState(null);


  /* =======================================================
     MESSAGES
  ======================================================= */

  const showMessage = (
    message,
    type = "success"
  ) => {
    if (
      type === "success"
    ) {
      setSuccess(message);
      setError("");
    } else {
      setError(message);
      setSuccess("");
    }

    window.setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3000);
  };


  /* =======================================================
     LOAD RESULTS
  ======================================================= */

  const loadResults =
    async (
      showLoader = true
    ) => {
      try {

        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const response =
          await api.get(
            "/laboratory-monitoring"
          );

        setResults(
          response.data?.results ||
            []
        );

      } catch (err) {

        console.error(
          "Load laboratory results error:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Failed to load laboratory results"
        );

      } finally {

        if (showLoader) {
          setLoading(false);
        }

      }
    };


  useEffect(() => {
    loadResults();
  }, []);


  /* =======================================================
     LATEST RESULT
  ======================================================= */

  const getLatestResult =
    (testType) => {

      return results
        .filter(
          (item) =>
            item.testType ===
            testType
        )
        .sort(
          (a, b) =>
            new Date(
              b.recordedAt
            ) -
            new Date(
              a.recordedAt
            )
        )[0];
    };


  /* =======================================================
     TEST COUNT
  ======================================================= */

  const getTestCount =
    (testType) => {

      return results.filter(
        (item) =>
          item.testType ===
          testType
      ).length;
    };


  /* =======================================================
     SUMMARY
  ======================================================= */

  const glucoseLatest =
    getLatestResult(
      "glucose"
    );

  const cholesterolLatest =
    getLatestResult(
      "cholesterol"
    );

  const vitaminLatest =
    getLatestResult(
      "vitamin-levels"
    );


  /* =======================================================
     TREND
  ======================================================= */

  const getTrend =
    (testType) => {

      const history =
        results
          .filter(
            (item) =>
              item.testType ===
              testType
          )
          .sort(
            (a, b) =>
              new Date(
                a.recordedAt
              ) -
              new Date(
                b.recordedAt
              )
          );

      if (
        history.length < 2
      ) {
        return null;
      }

      const previous =
        Number(
          history[
            history.length - 2
          ].result
        );

      const latest =
        Number(
          history[
            history.length - 1
          ].result
        );

      if (
        latest > previous
      ) {
        return "Increasing";
      }

      if (
        latest < previous
      ) {
        return "Decreasing";
      }

      return "Stable";
    };


  /* =======================================================
     HISTORY
  ======================================================= */

  const historyResults =
    useMemo(() => {

      if (!historyTest) {
        return [];
      }

      return results
        .filter(
          (item) =>
            item.testType ===
            historyTest.id
        )
        .sort(
          (a, b) =>
            new Date(
              b.recordedAt
            ) -
            new Date(
              a.recordedAt
            )
        );

    }, [
      results,
      historyTest,
    ]);


  /* =======================================================
     ADD RESULT
  ======================================================= */

  const handleAddResult =
    (test) => {

      setSelectedTest(
        test
      );

      setResultValue("");

      setRecordedAt(
        new Date()
          .toISOString()
          .slice(0, 16)
      );

      setNotes("");
    };


  /* =======================================================
     SAVE RESULT
  ======================================================= */

  const handleSave =
    async () => {

      if (
        resultValue ===
        ""
      ) {
        showMessage(
          "Please enter a laboratory result",
          "error"
        );

        return;
      }

      const numericValue =
        Number(
          resultValue
        );

      if (
        Number.isNaN(
          numericValue
        )
      ) {
        showMessage(
          "Result must be a valid number",
          "error"
        );

        return;
      }

      try {

        setSaving(true);

        const response =
          await api.post(
            "/laboratory-monitoring",
            {
              testType:
                selectedTest.id,

              result:
                numericValue,

              recordedAt,

              notes:
                notes.trim(),
            }
          );

        const savedResult =
          response.data?.result;

        if (savedResult) {

          setResults(
            (previous) => [
              savedResult,
              ...previous,
            ]
          );

        } else {

          await loadResults(
            false
          );

        }

        setSelectedTest(
          null
        );

        showMessage(
          "Laboratory result saved successfully"
        );

      } catch (err) {

        console.error(
          "Save laboratory result error:",
          err
        );

        showMessage(
          err.response?.data
            ?.message ||
            "Failed to save laboratory result",
          "error"
        );

      } finally {

        setSaving(false);

      }
    };


  /* =======================================================
     DELETE RESULT
  ======================================================= */

  const handleDelete =
    async (result) => {

      const confirmed =
        window.confirm(
          "Delete this laboratory result?"
        );

      if (!confirmed) {
        return;
      }

      try {

        await api.delete(
          `/laboratory-monitoring/${result._id}`
        );

        setResults(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !==
                result._id
            )
        );

        showMessage(
          "Laboratory result deleted successfully"
        );

      } catch (err) {

        console.error(
          "Delete laboratory result error:",
          err
        );

        showMessage(
          err.response?.data
            ?.message ||
            "Failed to delete laboratory result",
          "error"
        );
      }
    };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async () => {

      try {

        setRefreshing(true);

        await loadResults(
          false
        );

        showMessage(
          "Laboratory data refreshed"
        );

      } finally {

        setRefreshing(false);

      }
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

            <FlaskConical size={14} />

            Health · Laboratory Monitoring

          </div>


          <h1>
            Laboratory Monitoring
          </h1>


          <p>
            Monitor laboratory results and
            track important health markers
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
            disabled={
              refreshing
            }
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "spin"
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
              handleAddResult(
                laboratoryTests[0]
              )
            }
          >

            <Plus size={16} />

            Add Result

          </button>

        </div>

      </section>


      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {success && (

        <div
          style={{
            marginBottom:
              "16px",
            padding:
              "12px 14px",
            border:
              "1px solid rgba(34,197,94,.25)",
            borderRadius:
              "10px",
          }}
        >
          {success}
        </div>

      )}


      {error && (

        <div
          style={{
            marginBottom:
              "16px",
            padding:
              "12px 14px",
            border:
              "1px solid rgba(239,68,68,.25)",
            borderRadius:
              "10px",
          }}
        >
          {error}
        </div>

      )}


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">

        <div className="summary-card">

          <div className="summary-icon">
            <Droplets size={20} />
          </div>

          <div>

            <span>
              Glucose
            </span>

            <strong>
              {formatNumber(
                glucoseLatest?.result
              )}

              <small className="health-summary-unit">
                mg/dL
              </small>
            </strong>

            <small>
              Latest result
            </small>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <FlaskConical size={20} />
          </div>

          <div>

            <span>
              Cholesterol
            </span>

            <strong>
              {formatNumber(
                cholesterolLatest?.result
              )}

              <small className="health-summary-unit">
                mg/dL
              </small>
            </strong>

            <small>
              Latest result
            </small>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <TestTube size={20} />
          </div>

          <div>

            <span>
              Vitamin Levels
            </span>

            <strong>
              {formatNumber(
                vitaminLatest?.result
              )}
            </strong>

            <small>
              Latest result
            </small>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <HeartPulse size={20} />
          </div>

          <div>

            <span>
              Lab Results
            </span>

            <strong>
              {results.length}
            </strong>

            <small>
              Total recorded
            </small>

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="health-main-card">

        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              LABORATORY MONITORING
            </span>

            <h2>
              Your Laboratory Results
            </h2>

            <p>
              Record, review and monitor
              your laboratory measurements
              and health markers.
            </p>

          </div>


          <div className="health-history-icon">

            <FlaskConical size={21} />

          </div>

        </div>


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

            <RefreshCw
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
              }}
            >
              Loading laboratory results...
            </div>

          </div>

        ) : (

          <div className="health-vitals-detail-grid">

            {laboratoryTests.map(
              (test) => (

                <LaboratoryCard
                  key={
                    test.id
                  }

                  test={
                    test
                  }

                  latestResult={
                    getLatestResult(
                      test.id
                    )
                  }

                  count={
                    getTestCount(
                      test.id
                    )
                  }

                  onAdd={() =>
                    handleAddResult(
                      test
                    )
                  }

                  onHistory={() =>
                    setHistoryTest(
                      test
                    )
                  }
                />

              )
            )}

          </div>

        )}


        {/* ===================================================
            LAB TRENDS
        =================================================== */}

        <div
          style={{
            marginTop:
              "30px",
          }}
        >

          <div className="health-main-header">

            <div>

              <span className="section-kicker">
                LAB TRENDS
              </span>

              <h2>
                Result Trends
              </h2>

              <p>
                Compare your latest
                laboratory result with
                the previous recorded
                result.
              </p>

            </div>

            <LineChart
              size={21}
            />

          </div>


          <div
            className="health-vitals-detail-grid"
          >

            {laboratoryTests
              .filter(
                (test) =>
                  test.id !==
                  "kidney-function"
              )
              .map(
                (test) => {

                  const latest =
                    getLatestResult(
                      test.id
                    );

                  const trend =
                    getTrend(
                      test.id
                    );

                  return (

                    <div
                      key={
                        test.id
                      }
                      className="health-vital-detail-card"
                    >

                      <div
                        className="health-vital-detail-card__top"
                      >

                        <div
                          className="health-vital-detail-card__icon"
                        >
                          <LineChart
                            size={21}
                          />
                        </div>

                      </div>


                      <div
                        className="health-vital-detail-card__content"
                      >

                        <h3>
                          {
                            test.title
                          }
                        </h3>

                        <p>
                          Current trend
                        </p>

                      </div>


                      <div
                        className="health-vital-detail-card__reading"
                      >

                        <strong>
                          {trend ||
                            "Not enough data"}
                        </strong>

                        <small>
                          {latest
                            ? `Latest: ${formatNumber(
                                latest.result
                              )}${
                                test.unit
                                  ? ` ${test.unit}`
                                  : ""
                              }`
                            : "No results yet"}
                        </small>

                      </div>

                    </div>

                  );
                }
              )}

          </div>

        </div>

      </section>


      {/* =====================================================
          ADD RESULT MODAL
      ===================================================== */}

      {selectedTest && (

        <div
          className="health-modal-overlay"
          onClick={() => {

            if (!saving) {
              setSelectedTest(
                null
              );
            }

          }}
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
                  ADD LABORATORY RESULT
                </span>

                <h2>
                  {
                    selectedTest.title
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedTest(
                    null
                  )
                }
                className="health-modal-close"
                disabled={
                  saving
                }
              >
                ×
              </button>

            </div>


            <div className="health-modal__body">

              <label>
                Result
              </label>

              <input
                type="number"
                step="any"
                value={
                  resultValue
                }
                onChange={(
                  event
                ) =>
                  setResultValue(
                    event.target
                      .value
                  )
                }
                placeholder={
                  selectedTest.unit
                    ? `Enter value in ${selectedTest.unit}`
                    : "Enter result"
                }
                autoFocus
              />


              {selectedTest.unit && (

                <small>
                  Unit:{" "}
                  {
                    selectedTest.unit
                  }
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
                onChange={(
                  event
                ) =>
                  setRecordedAt(
                    event.target
                      .value
                  )
                }
              />


              <label>
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target
                      .value
                  )
                }
                placeholder="Add optional notes..."
                rows="3"
              />

            </div>


            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setSelectedTest(
                    null
                  )
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
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Plus
                      size={15}
                    />

                    Save Result
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          HISTORY MODAL
      ===================================================== */}

      {historyTest && (

        <div
          className="health-modal-overlay"
          onClick={() =>
            setHistoryTest(
              null
            )
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
                  LABORATORY HISTORY
                </span>

                <h2>
                  {
                    historyTest.title
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setHistoryTest(
                    null
                  )
                }
                className="health-modal-close"
              >
                ×
              </button>

            </div>


            <div
              className="health-modal__body"
              style={{
                maxHeight:
                  "55vh",
                overflowY:
                  "auto",
              }}
            >

              {historyResults.length ===
              0 ? (

                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "30px 10px",
                    color:
                      "#8797aa",
                  }}
                >

                  <History
                    size={30}
                    style={{
                      marginBottom:
                        "8px",
                    }}
                  />

                  <div>
                    No laboratory results yet.
                  </div>

                </div>

              ) : (

                <div
                  style={{
                    display:
                      "grid",
                    gap:
                      "12px",
                  }}
                >

                  {historyResults.map(
                    (item) => (

                      <div
                        key={
                          item._id
                        }
                        style={{
                          border:
                            "1px solid #e2e8f0",
                          borderRadius:
                            "12px",
                          padding:
                            "14px",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap:
                              "12px",
                          }}
                        >

                          <div>

                            <strong
                              style={{
                                fontSize:
                                  "20px",
                              }}
                            >
                              {
                                formatNumber(
                                  item.result
                                )
                              }{" "}

                              {item.unit && (
                                <span
                                  style={{
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      500,
                                  }}
                                >
                                  {
                                    item.unit
                                  }
                                </span>
                              )}

                            </strong>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#8797aa",
                                marginTop:
                                  "5px",
                              }}
                            >
                              {
                                formatDateTime(
                                  item.recordedAt
                                )
                              }
                            </div>

                          </div>


                          <button
                            type="button"
                            className="health-icon-btn"
                            onClick={() =>
                              handleDelete(
                                item
                              )
                            }
                            title="Delete result"
                          >
                            <Trash2
                              size={15}
                            />
                          </button>

                        </div>


                        {item.notes && (

                          <p
                            style={{
                              marginTop:
                                "10px",
                              fontSize:
                                "13px",
                              color:
                                "#64748b",
                            }}
                          >
                            {
                              item.notes
                            }
                          </p>

                        )}

                      </div>

                    )
                  )}

                </div>

              )}

            </div>


            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setHistoryTest(
                    null
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