import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  RefreshCcw,
  TrendingUp,
  Activity,
  Users,
  BarChart3,
} from "lucide-react";

import {
  getFeatureTrends,
} from "../services/superAdminAnalytics.service.js";


/* ==========================================================================
   PERIOD OPTIONS
========================================================================== */

const PERIODS = [
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
  {
    value: 180,
    label: "Last 180 Days",
  },
  {
    value: 365,
    label: "Last Year",
  },
];


/* ==========================================================================
   HELPERS
========================================================================== */

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


function formatNumber(value) {
  return toNumber(value).toLocaleString();
}


function formatPercentage(value) {
  return `${toNumber(value).toFixed(1)}%`;
}


function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


/* ==========================================================================
   RESPONSE NORMALIZER

   Supports:

   {
     trends: []
   }

   and

   {
     data: {
       trends: []
     }
   }
========================================================================== */

function normalizeTrendData(response) {
  let data = response;

  if (
    data?.data &&
    typeof data.data === "object"
  ) {
    data = data.data;
  }

  if (
    data?.data &&
    typeof data.data === "object"
  ) {
    data = data.data;
  }

  return {
    trends:
      Array.isArray(data?.trends)
        ? data.trends
        : [],
  };
}


/* ==========================================================================
   FEATURE TRENDS PAGE
========================================================================== */

export default function FeatureTrendsPage() {

  const [days, setDays] =
    useState(30);


  const [data, setData] =
    useState(
      normalizeTrendData({})
    );


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  /* ==========================================================================
     LOAD DATA
  ========================================================================== */

  const loadData =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await getFeatureTrends(
              days
            );


          setData(
            normalizeTrendData(
              response
            )
          );

        } catch (error) {

          console.error(
            "Failed to load feature trends:",
            error
          );


          setError(
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load feature trends."
          );

        } finally {

          setLoading(false);

        }

      },
      [days]
    );


  /* ==========================================================================
     LOAD
========================================================================== */

  useEffect(
    () => {
      loadData();
    },
    [loadData]
  );


  /* ==========================================================================
     RAW TRENDS
========================================================================== */

  const trends =
    data.trends;


  /* ==========================================================================
     FEATURE SUMMARY

     Convert daily feature trend records into
     a feature-level summary for the table.
========================================================================== */

  const featureSummary =
    useMemo(
      () => {

        const map =
          new Map();


        for (
          const item
          of trends
        ) {

          const feature =
            String(
              item.feature ||
              "Unknown"
            );


          if (
            !map.has(
              feature
            )
          ) {

            map.set(
              feature,
              {
                feature,

                events: 0,

                users: 0,

                days: 0,

                latestDate:
                  item.date ||
                  null,

                latestEvents:
                  0,

                latestUsers:
                  0,
              }
            );
          }


          const current =
            map.get(
              feature
            );


          current.events +=
            toNumber(
              item.events
            );


          current.users =
            Math.max(
              current.users,
              toNumber(
                item.users
              )
            );


          current.days += 1;


          if (
            !current.latestDate ||
            String(
              item.date
            ) >
              String(
                current.latestDate
              )
          ) {

            current.latestDate =
              item.date ||
              current.latestDate;

            current.latestEvents =
              toNumber(
                item.events
              );

            current.latestUsers =
              toNumber(
                item.users
              );

          }

        }


        return Array.from(
          map.values()
        )
          .sort(
            (a, b) =>
              b.events -
              a.events
          );

      },
      [trends]
    );


  /* ==========================================================================
     TOTALS
========================================================================== */

  const totalEvents =
    trends.reduce(
      (
        total,
        item
      ) =>
        total +
        toNumber(
          item.events
        ),
      0
    );


  const totalFeatureUsers =
    featureSummary.reduce(
      (
        total,
        item
      ) =>
        total +
        toNumber(
          item.users
        ),
      0
    );


  const featureCount =
    featureSummary.length;


  /* ==========================================================================
     DAILY SUMMARY
========================================================================== */

  const dailySummary =
    useMemo(
      () => {

        const map =
          new Map();


        for (
          const item
          of trends
        ) {

          const date =
            String(
              item.date ||
              ""
            );


          if (!date) {
            continue;
          }


          if (
            !map.has(
              date
            )
          ) {

            map.set(
              date,
              {
                date,

                events: 0,

                users: 0,

                features: 0,
              }
            );
          }


          const current =
            map.get(
              date
            );


          current.events +=
            toNumber(
              item.events
            );


          current.users =
            Math.max(
              current.users,
              toNumber(
                item.users
              )
            );


          current.features +=
            1;
        }


        return Array.from(
          map.values()
        )
          .sort(
            (a, b) =>
              String(
                a.date
              ).localeCompare(
                String(
                  b.date
                )
              )
          );

      },
      [trends]
    );


  /* ==========================================================================
     TOP FEATURE
========================================================================== */

  const topFeature =
    featureSummary.length > 0
      ? featureSummary[0]
      : null;


  /* ==========================================================================
     RENDER
========================================================================== */

  return (
    <div className="super-admin-dashboard">

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="page-heading">

        <div>

          <h1>
            Feature Trends
          </h1>

          <p>
            Analyze how feature usage changes
            over time.
          </p>

        </div>


        <div className="dashboard-actions">

          {/* --------------------------------------------------------------
              PERIOD
          -------------------------------------------------------------- */}

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


          {/* --------------------------------------------------------------
              REFRESH
          -------------------------------------------------------------- */}

          <button
            type="button"
            onClick={loadData}
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
              ? "Loading..."
              : "Refresh"}

          </button>

        </div>

      </div>


      {/* ================================================================
          ERROR
      ================================================================= */}

      {error && (

        <div className="analytics-error">

          <strong>
            Unable to load feature trends
          </strong>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ================================================================
          OVERVIEW
      ================================================================= */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Trend Overview
            </h2>

            <p>
              Summary of feature activity during
              the selected period.
            </p>

          </div>

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <TrendingUp size={18} />
            }
            title="Features"
            value={
              formatNumber(
                featureCount
              )
            }
            description="Features with recorded activity"
          />


          <MetricCard
            icon={
              <Activity size={18} />
            }
            title="Total Events"
            value={
              formatNumber(
                totalEvents
              )
            }
            description="Feature events recorded"
          />


          <MetricCard
            icon={
              <Users size={18} />
            }
            title="Feature Users"
            value={
              formatNumber(
                totalFeatureUsers
              )
            }
            description="Users across tracked features"
          />


          <MetricCard
            icon={
              <BarChart3 size={18} />
            }
            title="Top Feature"
            value={
              topFeature?.feature ||
              "-"
            }
            description={
              topFeature
                ? `${formatNumber(
                    topFeature.events
                  )} events`
                : "No activity available"
            }
          />

        </div>

      </section>


      {/* ================================================================
          DAILY ACTIVITY
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Daily Feature Activity
            </h2>

            <p>
              Feature event activity across the
              selected period.
            </p>

          </div>

          <TrendingUp
            size={20}
          />

        </div>


        {loading ? (

          <LoadingState />

        ) : dailySummary.length === 0 ? (

          <EmptyState />

        ) : (

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap:
                "14px",
            }}
          >

            {dailySummary.map(
              (
                item,
                index
              ) => {

                const maxEvents =
                  Math.max(
                    ...dailySummary.map(
                      (entry) =>
                        toNumber(
                          entry.events
                        )
                    ),
                    1
                  );


                const width =
                  (
                    toNumber(
                      item.events
                    ) /
                    maxEvents
                  ) *
                  100;


                return (
                  <div
                    key={
                      item.date ||
                      index
                    }
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        marginBottom:
                          "7px",
                      }}
                    >

                      <strong
                        style={{
                          fontSize:
                            "13px",
                        }}
                      >
                        {formatDate(
                          item.date
                        )}
                      </strong>


                      <span
                        style={{
                          fontSize:
                            "12px",
                          color:
                            "#64748b",
                        }}
                      >
                        {formatNumber(
                          item.events
                        )} events ·{" "}
                        {formatNumber(
                          item.users
                        )} users
                      </span>

                    </div>


                    <div
                      style={{
                        width:
                          "100%",
                        height:
                          "8px",
                        background:
                          "#f1f5f9",
                        borderRadius:
                          "999px",
                        overflow:
                          "hidden",
                      }}
                    >

                      <div
                        style={{
                          width:
                            `${Math.max(
                              width,
                              2
                            )}%`,
                          height:
                            "100%",
                          background:
                            "#2563eb",
                          borderRadius:
                            "999px",
                          transition:
                            "width 0.3s ease",
                        }}
                      />

                    </div>

                  </div>
                );

              }
            )}

          </div>

        )}

      </section>


      {/* ================================================================
          FEATURE TREND TABLE
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Feature Trend Details
            </h2>

            <p>
              Compare feature activity during
              the selected period.
            </p>

          </div>

          <BarChart3
            size={20}
          />

        </div>


        {loading ? (

          <LoadingState />

        ) : featureSummary.length === 0 ? (

          <EmptyState />

        ) : (

          <div
            style={{
              overflowX:
                "auto",
            }}
          >

            <table
              style={{
                width:
                  "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "760px",
              }}
            >

              <thead>

                <tr>

                  <TableHeader>
                    #
                  </TableHeader>

                  <TableHeader>
                    Feature
                  </TableHeader>

                  <TableHeader>
                    Events
                  </TableHeader>

                  <TableHeader>
                    Users
                  </TableHeader>

                  <TableHeader>
                    Active Days
                  </TableHeader>

                  <TableHeader>
                    Latest Activity
                  </TableHeader>

                </tr>

              </thead>


              <tbody>

                {featureSummary.map(
                  (
                    feature,
                    index
                  ) => (

                    <tr
                      key={
                        feature.feature ||
                        index
                      }
                    >

                      <TableCell>
                        {index + 1}
                      </TableCell>


                      <TableCell>

                        <strong>
                          {feature.feature}
                        </strong>

                      </TableCell>


                      <TableCell>
                        {formatNumber(
                          feature.events
                        )}
                      </TableCell>


                      <TableCell>
                        {formatNumber(
                          feature.users
                        )}
                      </TableCell>


                      <TableCell>
                        {formatNumber(
                          feature.days
                        )}
                      </TableCell>


                      <TableCell>
                        {formatDate(
                          feature.latestDate
                        )}
                      </TableCell>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ================================================================
          TOP FEATURES
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Most Used Features
            </h2>

            <p>
              Features with the highest recorded
              activity.
            </p>

          </div>

          <TrendingUp
            size={20}
          />

        </div>


        {loading ? (

          <LoadingState />

        ) : featureSummary.length === 0 ? (

          <EmptyState />

        ) : (

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap:
                "16px",
            }}
          >

            {featureSummary
              .slice(
                0,
                10
              )
              .map(
                (
                  feature,
                  index
                ) => {

                  const maxEvents =
                    featureSummary[0]
                      ?.events || 1;


                  const percentage =
                    (
                      feature.events /
                      maxEvents
                    ) *
                    100;


                  return (
                    <div
                      key={
                        feature.feature ||
                        index
                      }
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          marginBottom:
                            "7px",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "10px",
                          }}
                        >

                          <div
                            style={{
                              width:
                                "28px",
                              height:
                                "28px",
                              borderRadius:
                                "8px",
                              background:
                                "#f1f5f9",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontSize:
                                "12px",
                              fontWeight:
                                700,
                            }}
                          >
                            {index + 1}
                          </div>


                          <strong>
                            {
                              feature.feature
                            }
                          </strong>

                        </div>


                        <span
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#64748b",
                          }}
                        >
                          {formatNumber(
                            feature.events
                          )} events
                        </span>

                      </div>


                      <div
                        style={{
                          width:
                            "100%",
                          height:
                            "8px",
                          background:
                            "#f1f5f9",
                          borderRadius:
                            "999px",
                          overflow:
                            "hidden",
                        }}
                      >

                        <div
                          style={{
                            width:
                              `${Math.min(
                                Math.max(
                                  percentage,
                                  0
                                ),
                                100
                              )}%`,
                            height:
                              "100%",
                            background:
                              "#2563eb",
                            borderRadius:
                              "999px",
                          }}
                        />

                      </div>

                    </div>
                  );

                }
              )}

          </div>

        )}

      </section>


      {/* ================================================================
          PERIOD
      ================================================================= */}

      <div className="analytics-period">

        <CalendarDays
          size={16}
        />

        <span>
          Analytics period:{" "}
          <strong>
            Last {days} days
          </strong>
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
  title,
  value,
  description,
}) {
  return (
    <div className="analytics-card">

      <div className="analytics-card-top">

        <span>
          {title}
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
   EMPTY STATE
========================================================================== */

function EmptyState() {
  return (
    <div className="analytics-empty">

      <TrendingUp
        size={28}
      />

      <strong>
        No feature trend data available
      </strong>

      <span>
        Feature trends will appear when
        analytics events contain feature
        information.
      </span>

    </div>
  );
}


/* ==========================================================================
   LOADING STATE
========================================================================== */

function LoadingState() {
  return (
    <div className="analytics-empty">

      <RefreshCcw
        size={28}
        className="refresh-spinning"
      />

      <strong>
        Loading feature trends...
      </strong>

      <span>
        Please wait while the latest analytics
        data is loaded.
      </span>

    </div>
  );
}


/* ==========================================================================
   TABLE HEADER
========================================================================== */

function TableHeader({
  children,
}) {
  return (
    <th
      style={{
        textAlign:
          "left",
        padding:
          "12px",
        borderBottom:
          "1px solid #e5e7eb",
        fontSize:
          "12px",
        color:
          "#64748b",
        whiteSpace:
          "nowrap",
      }}
    >
      {children}
    </th>
  );
}


/* ==========================================================================
   TABLE CELL
========================================================================== */

function TableCell({
  children,
}) {
  return (
    <td
      style={{
        padding:
          "13px 12px",
        borderBottom:
          "1px solid #f1f5f9",
        fontSize:
          "13px",
        whiteSpace:
          "nowrap",
      }}
    >
      {children}
    </td>
  );
}