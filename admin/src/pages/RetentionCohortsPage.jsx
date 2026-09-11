import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";

import {
  getRetentionAnalytics,
} from "../services/superAdminAnalytics.service.js";


/* ==========================================================================
   PERIODS
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
    label: "Last 365 Days",
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
  return toNumber(value).toLocaleString(
    "en-IN"
  );
}


function formatPercent(value) {
  return `${toNumber(value).toFixed(1)}%`;
}


function formatDate(value) {
  if (!value) {
    return "—";
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
   NORMALIZE RESPONSE
========================================================================== */

function normalizeData(result = {}) {
  const root =
    result?.data &&
    typeof result.data === "object"
      ? result.data
      : result;


  const metrics =
    root?.metrics &&
    typeof root.metrics === "object"
      ? root.metrics
      : {};


  const cohorts =
    Array.isArray(root?.cohorts)
      ? root.cohorts
      : [];


  return {
    period:
      root?.period || {},

    metrics: {
      totalUsers:
        toNumber(
          metrics.totalUsers
        ),

      retainedUsers:
        toNumber(
          metrics.retainedUsers
        ),

      retentionRate:
        toNumber(
          metrics.retentionRate
        ),

      returningUsers:
        toNumber(
          metrics.returningUsers
        ),

      churnedUsers:
        toNumber(
          metrics.churnedUsers
        ),
    },

    cohorts,
  };
}


/* ==========================================================================
   PAGE
========================================================================== */

export default function RetentionCohortsPage() {

  const [
    days,
    setDays,
  ] = useState(30);


  const [
    data,
    setData,
  ] = useState(
    normalizeData()
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  /* ==========================================================================
     LOAD
  ========================================================================== */

  const load =
    useCallback(
      async () => {

        try {

          setLoading(true);
          setError("");


          const result =
            await getRetentionAnalytics(
              days
            );


          setData(
            normalizeData(
              result
            )
          );

        } catch (err) {

          console.error(
            "Retention analytics error:",
            err
          );


          setError(
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load retention analytics."
          );

        } finally {

          setLoading(false);

        }

      },
      [days]
    );


  /* ==========================================================================
     LOAD ON PERIOD CHANGE
  ========================================================================== */

  useEffect(
    () => {
      load();
    },
    [load]
  );


  /* ==========================================================================
     COHORTS
  ========================================================================== */

  const cohorts =
    useMemo(
      () =>
        Array.isArray(
          data.cohorts
        )
          ? data.cohorts
          : [],
      [data.cohorts]
    );


  const metrics =
    data.metrics;


  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <div className="super-admin-dashboard">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="page-heading">

        <div>

          <h1>
            Retention & Cohorts
          </h1>

          <p>
            Understand how well MONE AI retains
            users over time.
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
            onClick={load}
            disabled={loading}
          >

            <RefreshCcw
              size={16}
            />

            {loading
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>

      </div>


      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (

        <div className="analytics-error">

          <strong>
            Retention analytics unavailable
          </strong>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ================================================================
          PERIOD
      ================================================================ */}

      {data.period?.startDate && (

        <div className="analytics-period">

          <CalendarDays
            size={16}
          />

          <span>

            Showing data from{" "}

            <strong>
              {formatDate(
                data.period.startDate
              )}
            </strong>

            {" "}to{" "}

            <strong>
              {formatDate(
                data.period.endDate
              )}
            </strong>

          </span>

        </div>

      )}


      {/* ================================================================
          RETENTION OVERVIEW
      ================================================================ */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Retention Overview
            </h2>

            <p>
              Key retention indicators for
              the selected period.
            </p>

          </div>

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <Users size={18} />
            }
            label="Total Users"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.totalUsers
                  )
            }
          />


          <MetricCard
            icon={
              <TrendingUp size={18} />
            }
            label="Retained Users"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.retainedUsers
                  )
            }
          />


          <MetricCard
            icon={
              <BarChart3 size={18} />
            }
            label="Retention Rate"
            value={
              loading
                ? "—"
                : formatPercent(
                    metrics.retentionRate
                  )
            }
          />


          <MetricCard
            icon={
              <TrendingDown size={18} />
            }
            label="Churned Users"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.churnedUsers
                  )
            }
          />

        </div>

      </section>


      {/* ================================================================
          COHORT TABLE
      ================================================================ */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Cohort Retention
            </h2>

            <p>
              Retention performance by user
              cohort.
            </p>

          </div>

          <Users
            size={20}
          />

        </div>


        {loading ? (

          <div className="analytics-empty">

            <RefreshCcw
              size={28}
            />

            <strong>
              Loading retention data...
            </strong>

          </div>

        ) : cohorts.length === 0 ? (

          <div className="analytics-empty">

            <Users
              size={28}
            />

            <strong>
              No cohort data available.
            </strong>

            <span>
              Retention data will appear when
              enough user activity is available.
            </span>

          </div>

        ) : (

          <div
            style={{
              overflowX: "auto",
            }}
          >

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >

              <thead>

                <tr
                  style={{
                    borderBottom:
                      "1px solid #e5e7eb",
                    background:
                      "#f8fafc",
                  }}
                >

                  <th style={thStyle}>
                    Cohort
                  </th>

                  <th style={thStyle}>
                    Users
                  </th>

                  <th style={thStyle}>
                    Day 1
                  </th>

                  <th style={thStyle}>
                    Day 7
                  </th>

                  <th style={thStyle}>
                    Day 14
                  </th>

                  <th style={thStyle}>
                    Day 30
                  </th>

                </tr>

              </thead>


              <tbody>

                {cohorts.map(
                  (
                    cohort,
                    index
                  ) => (

                    <tr
                      key={
                        cohort?.cohort ||
                        cohort?.date ||
                        index
                      }
                      style={{
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >

                      <td style={tdStyle}>

                        {formatDate(
                          cohort?.cohort ||
                          cohort?.date
                        )}

                      </td>


                      <td style={tdStyle}>

                        {formatNumber(
                          cohort?.users ||
                          cohort?.totalUsers
                        )}

                      </td>


                      <td style={tdStyle}>

                        {formatPercent(
                          cohort?.day1 ??
                          cohort?.d1 ??
                          cohort?.retention?.day1
                        )}

                      </td>


                      <td style={tdStyle}>

                        {formatPercent(
                          cohort?.day7 ??
                          cohort?.d7 ??
                          cohort?.retention?.day7
                        )}

                      </td>


                      <td style={tdStyle}>

                        {formatPercent(
                          cohort?.day14 ??
                          cohort?.d14 ??
                          cohort?.retention?.day14
                        )}

                      </td>


                      <td style={tdStyle}>

                        {formatPercent(
                          cohort?.day30 ??
                          cohort?.d30 ??
                          cohort?.retention?.day30
                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ================================================================
          RETENTION SUMMARY
      ================================================================ */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Retention Summary
            </h2>

            <p>
              High-level user retention
              information.
            </p>

          </div>

        </div>


        <div className="dashboard-grid">

          <SummaryItem
            label="Total Users"
            value={formatNumber(
              metrics.totalUsers
            )}
          />

          <SummaryItem
            label="Retained Users"
            value={formatNumber(
              metrics.retainedUsers
            )}
          />

          <SummaryItem
            label="Returning Users"
            value={formatNumber(
              metrics.returningUsers
            )}
          />

          <SummaryItem
            label="Churned Users"
            value={formatNumber(
              metrics.churnedUsers
            )}
          />

          <SummaryItem
            label="Retention Rate"
            value={formatPercent(
              metrics.retentionRate
            )}
          />

        </div>

      </section>

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

    </div>
  );
}


/* ==========================================================================
   SUMMARY ITEM
========================================================================== */

function SummaryItem({
  label,
  value,
}) {
  return (
    <div className="analytics-card">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* ==========================================================================
   TABLE STYLES
========================================================================== */

const thStyle = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 600,
  color: "#475569",
  whiteSpace: "nowrap",
};


const tdStyle = {
  padding: "14px 16px",
  fontSize: "14px",
  color: "#334155",
  whiteSpace: "nowrap",
};