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
  RefreshCcw,
  Sparkles,
  TrendingUp,
  UsersRound,
  UserRound,
  Zap,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getFeatureUsageAnalytics,
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
  return toNumber(
    value
  ).toLocaleString();
}


function formatPercent(value) {
  return `${toNumber(
    value
  ).toFixed(1)}%`;
}


/* ==========================================================================
   NORMALIZE API RESPONSE
========================================================================== */

function normalizeFeatureData(
  result = {}
) {
  const data =
    result?.data &&
    typeof result.data === "object"
      ? result.data
      : result;


  const rawFeatures =
    Array.isArray(
      data?.features
    )
      ? data.features
      : Array.isArray(
          data?.featureUsage
        )
        ? data.featureUsage
        : [];


  const features =
    rawFeatures.map(
      (item) => ({
        feature:
          item?.feature ??
          item?.name ??
          item?._id ??
          "Unknown",

        module:
          item?.module ??
          item?.moduleName ??
          "Unknown",

        events:
          toNumber(
            item?.events ??
            item?.totalEvents
          ),

        users:
          toNumber(
            item?.users ??
            item?.uniqueUsers ??
            item?.activeUsers
          ),

        sessions:
          toNumber(
            item?.sessions ??
            item?.totalSessions
          ),

        usageShare:
          toNumber(
            item?.usageShare
          ),
      })
    );


  const totalEvents =
    toNumber(
      data?.totalEvents
    );


  const totalUsers =
    toNumber(
      data?.totalUsers
    );


  const totalSessions =
    toNumber(
      data?.totalSessions
    );


  const activeFeatures =
    toNumber(
      data?.activeFeatures
    );


  const averageEventsPerFeature =
    toNumber(
      data?.averageEventsPerFeature
    );


  const mostUsedFeature =
    data?.mostUsedFeature
      ? {
          feature:
            data.mostUsedFeature
              ?.feature ??
            data.mostUsedFeature
              ?.name ??
            "Unknown",

          module:
            data.mostUsedFeature
              ?.module ??
            "Unknown",

          events:
            toNumber(
              data.mostUsedFeature
                ?.events
            ),

          users:
            toNumber(
              data.mostUsedFeature
                ?.users
            ),

          sessions:
            toNumber(
              data.mostUsedFeature
                ?.sessions
            ),
        }
      : features.length > 0
        ? features[0]
        : null;


  return {
    features,

    totalEvents,

    totalUsers,

    totalSessions,

    activeFeatures,

    averageEventsPerFeature,

    mostUsedFeature,
  };
}


/* ==========================================================================
   PAGE
========================================================================== */

export default function FeatureAnalyticsPage() {
  const navigate =
    useNavigate();


  const [
    days,
    setDays,
  ] = useState(30);


  const [
    data,
    setData,
  ] = useState({
    features: [],

    totalEvents: 0,

    totalUsers: 0,

    totalSessions: 0,

    activeFeatures: 0,

    averageEventsPerFeature: 0,

    mostUsedFeature: null,
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================================
     LOAD DATA
  ========================================================================= */

  const load =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");


          const result =
            await getFeatureUsageAnalytics(
              days
            );


          const normalized =
            normalizeFeatureData(
              result
            );


          setData(
            normalized
          );

        } catch (err) {
          console.error(
            "Feature Analytics Error:",
            err
          );


          setError(
            err?.response?.data
              ?.message ||
            err?.message ||
            "Unable to load feature analytics."
          );


          setData({
            features: [],

            totalEvents: 0,

            totalUsers: 0,

            totalSessions: 0,

            activeFeatures: 0,

            averageEventsPerFeature: 0,

            mostUsedFeature: null,
          });

        } finally {
          setLoading(false);
        }
      },
      [days]
    );


  useEffect(
    () => {
      load();
    },
    [load]
  );


  /* =========================================================================
     SORT FEATURES
  ========================================================================= */

  const features =
    useMemo(
      () =>
        [...data.features].sort(
          (
            first,
            second
          ) =>
            second.events -
            first.events
        ),
      [data.features]
    );


  /* =========================================================================
     OPEN FEATURE USER SEGMENTS
  ========================================================================= */

  function openFeatureUsers(
    feature
  ) {
    if (!feature) {
      return;
    }

    navigate(
      `/super-admin/features/${encodeURIComponent(
        feature
      )}/users`
    );
  }


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
            Feature Analytics
          </h1>


          <p>
            Detailed analysis of feature
            adoption and usage across MONE AI.
          </p>

        </div>


        <div className="dashboard-actions">

          <div className="dashboard-date-control">

            <CalendarDays
              size={16}
            />

            <select
              value={days}
              onChange={
                (event) =>
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
            onClick={load}
            disabled={loading}
          >

            <RefreshCcw
              size={16}
              className={
                loading
                  ? "refresh-spinning"
                  : ""
              }
            />

            {loading
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>

      </div>


      {/* ====================================================================
          ERROR
      ==================================================================== */}

      {error && (
        <div className="analytics-error">

          <strong>
            Feature analytics unavailable
          </strong>

          <span>
            {error}
          </span>

        </div>
      )}


      {/* ====================================================================
          OVERVIEW
      ==================================================================== */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Feature Overview
            </h2>

            <p>
              Real feature activity recorded
              in the selected period.
            </p>

          </div>

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <Sparkles
                size={18}
              />
            }
            label="Active Features"
            value={
              loading
                ? "—"
                : formatNumber(
                    data.activeFeatures
                  )
            }
            description="Features with recorded activity"
          />


          <MetricCard
            icon={
              <Activity
                size={18}
              />
            }
            label="Feature Events"
            value={
              loading
                ? "—"
                : formatNumber(
                    data.totalEvents
                  )
            }
            description="Actual events in database"
          />


          <MetricCard
            icon={
              <UsersRound
                size={18}
              />
            }
            label="Unique Users"
            value={
              loading
                ? "—"
                : formatNumber(
                    data.totalUsers
                  )
            }
            description="Unique users using features"
          />


          <MetricCard
            icon={
              <Zap
                size={18}
              />
            }
            label="Most Used Feature"
            value={
              loading
                ? "—"
                : data
                    .mostUsedFeature
                    ?.feature ||
                  "No data"
            }
            description={
              data
                .mostUsedFeature
                ? `${formatNumber(
                    data
                      .mostUsedFeature
                      .events
                  )} events`
                : "No feature activity"
            }
          />

        </div>

      </section>


      {/* ====================================================================
          FEATURE USAGE
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Feature Usage
            </h2>

            <p>
              Usage distribution across
              MONE AI features.
            </p>

          </div>


          <BarChart3
            size={20}
          />

        </div>


        {loading ? (

          <div className="analytics-empty">

            <Activity
              size={28}
            />

            <strong>
              Loading feature analytics...
            </strong>

          </div>

        ) : features.length === 0 ? (

          <div className="analytics-empty">

            <Sparkles
              size={28}
            />

            <strong>
              No feature analytics data available.
            </strong>

            <span>
              Feature usage will appear here
              when analytics events are recorded.
            </span>

          </div>

        ) : (

          <div className="feature-table-container">

            <table className="feature-table">

              <thead>

                <tr>

                  <th>
                    Feature
                  </th>

                  <th>
                    Module
                  </th>

                  <th>
                    Events
                  </th>

                  <th>
                    Users
                  </th>

                  <th>
                    Sessions
                  </th>

                  <th>
                    Usage Share
                  </th>

                  <th>
                    User Segments
                  </th>

                </tr>

              </thead>


              <tbody>

                {features.map(
                  (
                    item,
                    index
                  ) => (

                    <tr
                      key={
                        `${item.module}-${item.feature}-${index}`
                      }
                    >

                      <td>

                        <strong>
                          {
                            item.feature
                          }
                        </strong>

                      </td>


                      <td>
                        {
                          item.module
                        }
                      </td>


                      <td>
                        {
                          formatNumber(
                            item.events
                          )
                        }
                      </td>


                      <td>
                        {
                          formatNumber(
                            item.users
                          )
                        }
                      </td>


                      <td>
                        {
                          formatNumber(
                            item.sessions
                          )
                        }
                      </td>


                      <td>

                        <div className="feature-usage">

                          <div className="feature-usage-track">

                            <div
                              className="feature-usage-fill"
                              style={{
                                width:
                                  `${Math.min(
                                    Math.max(
                                      toNumber(
                                        item.usageShare
                                      ),
                                      0
                                    ),
                                    100
                                  )}%`,
                              }}
                            />

                          </div>


                          <span>
                            {
                              formatPercent(
                                item.usageShare
                              )
                            }
                          </span>

                        </div>

                      </td>


                      {/* ==================================================
                          VIEW USER SEGMENTS
                      ================================================== */}

                      <td>

                        <button
                          type="button"
                          className="feature-users-button"
                          onClick={() =>
                            openFeatureUsers(
                              item.feature
                            )
                          }
                          title={`View users for ${item.feature}`}
                        >

                          <UserRound
                            size={15}
                          />

                          View Users

                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ====================================================================
          FEATURE INSIGHTS
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Feature Insights
            </h2>

            <p>
              Aggregate insights calculated
              from real feature activity.
            </p>

          </div>


          <TrendingUp
            size={20}
          />

        </div>


        <div className="dashboard-grid">

          <InsightCard
            icon={
              <Zap
                size={18}
              />
            }
            label="Most Used Feature"
            value={
              loading
                ? "—"
                : data
                    .mostUsedFeature
                    ?.feature ||
                  "No data"
            }
            description={
              data
                .mostUsedFeature
                ? `${formatNumber(
                    data
                      .mostUsedFeature
                      .events
                  )} events`
                : "No feature activity"
            }
          />


          <InsightCard
            icon={
              <Activity
                size={18}
              />
            }
            label="Average Events / Feature"
            value={
              loading
                ? "—"
                : formatNumber(
                    Math.round(
                      data.averageEventsPerFeature
                    )
                  )
            }
            description="Across active features"
          />


          <InsightCard
            icon={
              <BarChart3
                size={18}
              />
            }
            label="Total Sessions"
            value={
              loading
                ? "—"
                : formatNumber(
                    data.totalSessions
                  )
            }
            description="Unique feature sessions recorded"
          />

        </div>

      </section>


      {/* ====================================================================
          DATABASE SCOPE
      ==================================================================== */}

      <div className="analytics-scope">

        <strong>
          Feature Analytics:
        </strong>

        <span>
          Values are calculated from
          AnalyticsEvent records for the
          selected period.
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