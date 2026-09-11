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
  Layers3,
  RefreshCcw,
  TrendingUp,
  UsersRound,
  Zap,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getModuleUsageAnalytics,
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
   NORMALIZE API RESPONSE
========================================================================== */

function normalizeModuleData(result = {}) {
  const data =
    result?.data &&
    typeof result.data === "object"
      ? result.data
      : result;


  const rawModules =
    Array.isArray(data?.modules)
      ? data.modules
      : Array.isArray(data?.moduleUsage)
        ? data.moduleUsage
        : [];


  const modules = rawModules.map(
    (item) => ({
      module:
        item?.module ??
        item?.name ??
        item?._id ??
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
    })
  );


  const totalEvents =
    modules.reduce(
      (sum, item) =>
        sum + item.events,
      0
    );


  return {
    totalEvents,

    modules: modules.map(
      (item) => ({
        ...item,

        usageShare:
          totalEvents > 0
            ? (
                item.events /
                totalEvents
              ) * 100
            : 0,
      })
    ),
  };
}


/* ==========================================================================
   PAGE
========================================================================== */

export default function ModuleAnalyticsPage() {
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
    modules: [],
    totalEvents: 0,
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
     LOAD ANALYTICS
  ========================================================================= */

  const load =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");


          const result =
            await getModuleUsageAnalytics(
              days
            );


          setData(
            normalizeModuleData(
              result
            )
          );
        } catch (err) {
          console.error(
            "Module Analytics Error:",
            err
          );


          setError(
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load module analytics."
          );


          setData({
            modules: [],
            totalEvents: 0,
          });
        } finally {
          setLoading(false);
        }
      },
      [days]
    );


  useEffect(() => {
    load();
  }, [load]);


  /* =========================================================================
     DERIVED VALUES
  ========================================================================= */

  const modules =
    useMemo(
      () =>
        [...data.modules].sort(
          (a, b) =>
            b.events -
            a.events
        ),
      [data.modules]
    );


  const activeModules =
    modules.filter(
      (item) =>
        item.events > 0
    ).length;


  const totalUsers =
    modules.reduce(
      (max, item) =>
        Math.max(
          max,
          item.users
        ),
      0
    );


  const totalSessions =
    modules.reduce(
      (sum, item) =>
        sum + item.sessions,
      0
    );


  const mostUsedModule =
    modules.length > 0 &&
    modules[0].events > 0
      ? modules[0]
      : null;


  const averageEventsPerModule =
    activeModules > 0
      ? data.totalEvents /
        activeModules
      : 0;


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
            Module Analytics
          </h1>


          <p>
            Detailed analysis of module
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
            Module analytics unavailable
          </strong>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ====================================================================
          MODULE OVERVIEW
      ==================================================================== */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Module Overview
            </h2>

            <p>
              High-level MONE AI module
              adoption and activity.
            </p>

          </div>

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <Layers3
                size={18}
              />
            }
            label="Active Modules"
            value={
              loading
                ? "—"
                : formatNumber(
                    activeModules
                  )
            }
            description="Modules with recorded activity"
          />


          <MetricCard
            icon={
              <Activity
                size={18}
              />
            }
            label="Module Events"
            value={
              loading
                ? "—"
                : formatNumber(
                    data.totalEvents
                  )
            }
            description="Total module activity"
          />


          <MetricCard
            icon={
              <UsersRound
                size={18}
              />
            }
            label="Users"
            value={
              loading
                ? "—"
                : formatNumber(
                    totalUsers
                  )
            }
            description="Users across modules"
          />


          <MetricCard
            icon={
              <Zap
                size={18}
              />
            }
            label="Most Used Module"
            value={
              loading
                ? "—"
                : mostUsedModule?.module ||
                  "—"
            }
            description={
              mostUsedModule
                ? `${formatNumber(
                    mostUsedModule.events
                  )} events`
                : "No module activity"
            }
          />

        </div>

      </section>


      {/* ====================================================================
          MODULE USAGE
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Module Usage
            </h2>

            <p>
              Usage distribution across
              MONE AI modules.
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
              Loading module analytics...
            </strong>

          </div>

        ) : modules.length === 0 ? (

          <div className="analytics-empty">

            <Layers3
              size={28}
            />

            <strong>
              No module analytics data available.
            </strong>

            <span>
              Module activity will appear here
              when analytics events are recorded.
            </span>

          </div>

        ) : (

          <div className="module-table-container">

            <table className="module-table">

              <thead>

                <tr>

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

                </tr>

              </thead>


              <tbody>

                {modules.map(
                  (item) => (

                    <tr
                      key={
                        item.module
                      }
                    >

                      <td>

                        <strong>
                          {
                            item.module
                          }
                        </strong>

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

                        <div className="module-usage">

                          <div className="module-usage-track">

                            <div
                              className="module-usage-fill"
                              style={{
                                width:
                                  `${Math.min(
                                    item.usageShare,
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

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ====================================================================
          MODULE INSIGHTS
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Module Insights
            </h2>

            <p>
              Aggregate insights from
              module activity.
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
            label="Most Used Module"
            value={
              loading
                ? "—"
                : mostUsedModule?.module ||
                  "—"
            }
            description={
              mostUsedModule
                ? `${formatNumber(
                    mostUsedModule.events
                  )} events`
                : "No module activity"
            }
          />


          <InsightCard
            icon={
              <Activity
                size={18}
              />
            }
            label="Average Events / Module"
            value={
              loading
                ? "—"
                : formatNumber(
                    Math.round(
                      averageEventsPerModule
                    )
                  )
            }
            description="Across active modules"
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
                    totalSessions
                  )
            }
            description="Module sessions recorded"
          />

        </div>

      </section>


      {/* ====================================================================
          SCOPE
      ==================================================================== */}

      <div className="analytics-scope">

        <strong>
          Module Analytics:
        </strong>

        <span>
          Module adoption, events, users,
          sessions, usage share and
          module-level insights.
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