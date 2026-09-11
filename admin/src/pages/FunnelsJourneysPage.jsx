import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getFeatureUsageAnalytics,
  getFeatureFunnel,
} from "../services/superAdminAnalytics.service.js";


/* ==========================================================================
   PERIODS
========================================================================== */

const PERIODS = [
  {
    value: 1,
    label: "Today",
  },
  {
    value: 7,
    label: "Last 7 Days",
  },
  {
    value: 30,
    label: "Last 30 Days",
  },
  {
    value: 90,
    label: "Last 90 Days",
  },
];


/* ==========================================================================
   HELPERS
========================================================================== */

function toNumber(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


function formatNumber(value) {
  return toNumber(value).toLocaleString();
}


function formatPercent(value) {
  return `${toNumber(value).toFixed(1)}%`;
}


/* ==========================================================================
   NORMALIZE FEATURES
========================================================================== */

function normalizeFeatures(result = {}) {
  const data =
    result?.data &&
    typeof result.data === "object"
      ? result.data
      : result;


  const features =
    Array.isArray(data?.features)
      ? data.features
      : Array.isArray(data?.featureUsage)
        ? data.featureUsage
        : [];


  return features.map(
    (item) => ({
      feature:
        item?.feature ??
        item?.name ??
        item?._id ??
        "",

      module:
        item?.module ??
        item?.moduleName ??
        "—",
    })
  ).filter(
    (item) =>
      item.feature
  );
}


/* ==========================================================================
   NORMALIZE FUNNEL
========================================================================== */

function normalizeFunnel(result = {}) {
  const data =
    result?.data &&
    typeof result.data === "object"
      ? result.data
      : result;


  const funnel =
    Array.isArray(data?.funnel)
      ? data.funnel
      : [];


  return funnel.map(
    (item, index) => ({
      step:
        item?.step ??
        `Step ${index + 1}`,

      users:
        toNumber(
          item?.users
        ),

      events:
        toNumber(
          item?.events
        ),
    })
  );
}


/* ==========================================================================
   PAGE
========================================================================== */

export default function FunnelsJourneysPage() {
  const navigate =
    useNavigate();


  const [
    days,
    setDays,
  ] = useState(30);


  const [
    features,
    setFeatures,
  ] = useState([]);


  const [
    selectedFeature,
    setSelectedFeature,
  ] = useState("");


  const [
    funnel,
    setFunnel,
  ] = useState([]);


  const [
    loadingFeatures,
    setLoadingFeatures,
  ] = useState(true);


  const [
    loadingFunnel,
    setLoadingFunnel,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================================
     LOAD FEATURES
  ========================================================================= */

  const loadFeatures =
    useCallback(
      async () => {
        try {
          setLoadingFeatures(true);
          setError("");


          const result =
            await getFeatureUsageAnalytics(
              days
            );


          const availableFeatures =
            normalizeFeatures(
              result
            );


          setFeatures(
            availableFeatures
          );


          /*
           * Preserve current feature if
           * it still exists.
           */
          setSelectedFeature(
            (current) => {
              const exists =
                availableFeatures.some(
                  (item) =>
                    item.feature ===
                    current
                );


              if (exists) {
                return current;
              }


              return (
                availableFeatures[0]
                  ?.feature || ""
              );
            }
          );

        } catch (err) {
          console.error(
            "Feature List Error:",
            err
          );


          setError(
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load features."
          );


          setFeatures([]);
          setSelectedFeature("");

        } finally {
          setLoadingFeatures(false);
        }
      },
      [days]
    );


  /* =========================================================================
     LOAD FUNNEL
  ========================================================================= */

  const loadFunnel =
    useCallback(
      async () => {
        if (!selectedFeature) {
          setFunnel([]);
          return;
        }


        try {
          setLoadingFunnel(true);
          setError("");


          const result =
            await getFeatureFunnel(
              selectedFeature,
              days
            );


          setFunnel(
            normalizeFunnel(
              result
            )
          );

        } catch (err) {
          console.error(
            "Funnel Analytics Error:",
            err
          );


          setError(
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load funnel analytics."
          );


          setFunnel([]);

        } finally {
          setLoadingFunnel(false);
        }
      },
      [
        selectedFeature,
        days,
      ]
    );


  /* =========================================================================
     INITIAL / PERIOD LOAD
  ========================================================================= */

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);


  /* =========================================================================
     FUNNEL LOAD
  ========================================================================= */

  useEffect(() => {
    loadFunnel();
  }, [loadFunnel]);


  /* =========================================================================
     FUNNEL METRICS
  ========================================================================= */

  const firstStep =
    funnel[0] || null;


  const lastStep =
    funnel.length > 0
      ? funnel[funnel.length - 1]
      : null;


  const entryUsers =
    firstStep?.users || 0;


  const completedUsers =
    lastStep?.users || 0;


  const conversionRate =
    entryUsers > 0
      ? (
          completedUsers /
          entryUsers
        ) *
        100
      : 0;


  const totalEvents =
    funnel.reduce(
      (sum, item) =>
        sum + item.events,
      0
    );


  const totalSteps =
    funnel.length;


  const largestDropOff =
    useMemo(() => {
      if (
        funnel.length < 2
      ) {
        return null;
      }


      let largest = null;


      for (
        let index = 1;
        index < funnel.length;
        index += 1
      ) {
        const previous =
          funnel[index - 1];


        const current =
          funnel[index];


        const dropOff =
          Math.max(
            previous.users -
              current.users,
            0
          );


        const rate =
          previous.users > 0
            ? (
                dropOff /
                previous.users
              ) *
              100
            : 0;


        if (
          !largest ||
          dropOff >
            largest.users
        ) {
          largest = {
            step:
              current.step,

            users:
              dropOff,

            rate,
          };
        }
      }


      return largest;
    }, [funnel]);


  /* =========================================================================
     REFRESH
  ========================================================================= */

  const refresh =
    async () => {
      await loadFeatures();

      /*
       * loadFeatures may change the selected
       * feature only when necessary.
       *
       * Explicit funnel reload is also
       * performed for the currently selected
       * feature.
       */
      await loadFunnel();
    };


  /* =========================================================================
     RENDER
  ========================================================================= */

  return (
    <div className="super-admin-dashboard">

      {/* ====================================================================
          HEADER
      ==================================================================== */}

      <div className="page-heading">

        <div>

          <button
            type="button"
            className="page-back-button"
            onClick={() =>
              navigate(
                "/super-admin"
              )
            }
          >
            <ArrowLeft
              size={16}
            />

            Dashboard
          </button>


          <h1>
            Funnels & Journeys
          </h1>


          <p>
            Analyze feature journeys,
            conversion steps and user
            drop-off across MONE AI.
          </p>

        </div>


        <div className="dashboard-actions">

          <div className="dashboard-date-control">

            <CalendarDays
              size={16}
            />

            <select
              value={days}
              onChange={(event) =>
                setDays(
                  Number(
                    event.target.value
                  )
                )
              }
            >

              {PERIODS.map(
                (period) => (
                  <option
                    key={
                      period.value
                    }
                    value={
                      period.value
                    }
                  >
                    {period.label}
                  </option>
                )
              )}

            </select>

          </div>


          <button
            type="button"
            onClick={refresh}
            disabled={
              loadingFeatures ||
              loadingFunnel
            }
          >

            <RefreshCcw
              size={16}
              className={
                loadingFeatures ||
                loadingFunnel
                  ? "refresh-spinning"
                  : ""
              }
            />

            Refresh

          </button>

        </div>

      </div>


      {/* ====================================================================
          ERROR
      ==================================================================== */}

      {error && (

        <div className="analytics-error">

          <strong>
            Funnel analytics unavailable
          </strong>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ====================================================================
          FEATURE SELECTOR
      ==================================================================== */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Funnel Selection
            </h2>

            <p>
              Select a feature to analyze
              its user journey.
            </p>

          </div>

        </div>


        <div className="panel">

          <div className="funnel-selector">

            <label htmlFor="funnel-feature">

              Feature

            </label>


            {loadingFeatures ? (

              <div className="funnel-loading">
                Loading features...
              </div>

            ) : features.length === 0 ? (

              <div className="funnel-no-features">
                No features available for
                this period.
              </div>

            ) : (

              <select
                id="funnel-feature"
                value={
                  selectedFeature
                }
                onChange={(event) =>
                  setSelectedFeature(
                    event.target.value
                  )
                }
              >

                {features.map(
                  (item) => (

                    <option
                      key={`${item.module}-${item.feature}`}
                      value={
                        item.feature
                      }
                    >
                      {item.module !== "—"
                        ? `${item.module} — ${item.feature}`
                        : item.feature}
                    </option>

                  )
                )}

              </select>

            )}

          </div>

        </div>

      </section>


      {/* ====================================================================
          FUNNEL OVERVIEW
      ==================================================================== */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Funnel Overview
            </h2>

            <p>
              Conversion and activity
              indicators for the selected
              feature.
            </p>

          </div>

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <UsersRound
                size={18}
              />
            }
            label="Users Entered"
            value={
              loadingFunnel
                ? "—"
                : formatNumber(
                    entryUsers
                  )
            }
            description="Users at the first funnel step"
          />


          <MetricCard
            icon={
              <CheckCircle2
                size={18}
              />
            }
            label="Completed Users"
            value={
              loadingFunnel
                ? "—"
                : formatNumber(
                    completedUsers
                  )
            }
            description="Users reaching the final step"
          />


          <MetricCard
            icon={
              <TrendingDown
                size={18}
              />
            }
            label="Conversion Rate"
            value={
              loadingFunnel
                ? "—"
                : formatPercent(
                    conversionRate
                  )
            }
            description="Final users / entry users"
          />


          <MetricCard
            icon={
              <Activity
                size={18}
              />
            }
            label="Funnel Events"
            value={
              loadingFunnel
                ? "—"
                : formatNumber(
                    totalEvents
                  )
            }
            description="Total events across steps"
          />

        </div>

      </section>


      {/* ====================================================================
          FUNNEL STEPS
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Funnel Steps
            </h2>

            <p>
              User progression through the
              selected feature journey.
            </p>

          </div>


          <BarChart3
            size={20}
          />

        </div>


        {loadingFunnel ? (

          <div className="analytics-empty">

            <Activity
              size={28}
            />

            <strong>
              Loading funnel data...
            </strong>

          </div>

        ) : funnel.length === 0 ? (

          <div className="analytics-empty">

            <BarChart3
              size={28}
            />

            <strong>
              No funnel data available.
            </strong>

            <span>
              Funnel steps will appear when
              events are recorded for the
              selected feature.
            </span>

          </div>

        ) : (

          <div className="funnel-steps">

            {funnel.map(
              (item, index) => {

                const previous =
                  index > 0
                    ? funnel[index - 1]
                    : null;


                const stepConversion =
                  previous &&
                  previous.users > 0
                    ? (
                        item.users /
                        previous.users
                      ) *
                      100
                    : index === 0
                      ? 100
                      : 0;


                const entryShare =
                  entryUsers > 0
                    ? (
                        item.users /
                        entryUsers
                      ) *
                      100
                    : 0;


                return (
                  <div
                    className="funnel-step"
                    key={`${item.step}-${index}`}
                  >

                    <div className="funnel-step-number">

                      {index + 1}

                    </div>


                    <div className="funnel-step-content">

                      <div className="funnel-step-header">

                        <div>

                          <strong>
                            {item.step}
                          </strong>

                          <span>
                            {
                              formatNumber(
                                item.events
                              )
                            }{" "}
                            events
                          </span>

                        </div>


                        <strong>
                          {
                            formatNumber(
                              item.users
                            )
                          }{" "}
                          users
                        </strong>

                      </div>


                      <div className="funnel-progress">

                        <div
                          className="funnel-progress-fill"
                          style={{
                            width:
                              `${Math.min(
                                entryShare,
                                100
                              )}%`,
                          }}
                        />

                      </div>


                      <div className="funnel-step-meta">

                        <span>
                          {
                            formatPercent(
                              entryShare
                            )
                          }{" "}
                          of entry users
                        </span>


                        <span>
                          {index === 0
                            ? "Entry step"
                            : `${formatPercent(
                                stepConversion
                              )} from previous step`}
                        </span>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </section>


      {/* ====================================================================
          JOURNEY INSIGHTS
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Journey Insights
            </h2>

            <p>
              Key observations from the
              selected feature journey.
            </p>

          </div>


          <TrendingUp
            size={20}
          />

        </div>


        <div className="dashboard-grid">

          <InsightCard
            icon={
              <BarChart3
                size={18}
              />
            }
            label="Funnel Steps"
            value={
              loadingFunnel
                ? "—"
                : formatNumber(
                    totalSteps
                  )
            }
            description="Tracked journey steps"
          />


          <InsightCard
            icon={
              <TrendingDown
                size={18}
              />
            }
            label="Largest Drop-Off"
            value={
              loadingFunnel
                ? "—"
                : largestDropOff
                  ? formatNumber(
                      largestDropOff.users
                    )
                  : "0"
            }
            description={
              largestDropOff
                ? `${formatPercent(
                    largestDropOff.rate
                  )} before ${largestDropOff.step}`
                : "No measurable drop-off"
            }
          />


          <InsightCard
            icon={
              <CheckCircle2
                size={18}
              />
            }
            label="Overall Conversion"
            value={
              loadingFunnel
                ? "—"
                : formatPercent(
                    conversionRate
                  )
            }
            description="Entry to final step"
          />

        </div>

      </section>


      {/* ====================================================================
          SCOPE
      ==================================================================== */}

      <div className="analytics-scope">

        <strong>
          Funnels & Journeys:
        </strong>

        <span>
          Feature-specific journey steps,
          users, events, conversion and
          drop-off analysis.
        </span>

      </div>

    </div>
  );
}


/* ==========================================================================
   METRIC CARD
========================================================================== */

function MetricCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="analytics-card">

      <div className="analytics-card-top">

        <span>
          {label}
        </span>


        <div className="analytics-card-icon">
          {icon}
        </div>

      </div>


      <strong>
        {value}
      </strong>


      <small>
        {description}
      </small>

    </div>
  );
}


/* ==========================================================================
   INSIGHT CARD
========================================================================== */

function InsightCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="analytics-card">

      <div className="analytics-card-top">

        <span>
          {label}
        </span>


        <div className="analytics-card-icon">
          {icon}
        </div>

      </div>


      <strong>
        {value}
      </strong>


      <small>
        {description}
      </small>

    </div>
  );
}