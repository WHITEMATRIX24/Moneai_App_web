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
  Clock3,
  RefreshCcw,
  Repeat2,
  TrendingUp,
  UserPlus,
  UsersRound,
  Zap,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getUserEngagementAnalytics,
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
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

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

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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


function formatShortDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}


function formatDuration(minutes) {
  const value =
    toNumber(minutes);

  if (value <= 0) {
    return "0 min";
  }

  if (value < 1) {
    return `${Math.round(
      value * 60
    )} sec`;
  }

  if (value < 60) {
    return `${value.toFixed(1)} min`;
  }

  const hours =
    Math.floor(
      value / 60
    );

  const remainingMinutes =
    Math.round(
      value % 60
    );

  if (
    remainingMinutes === 0
  ) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}


/* ==========================================================================
   NORMALIZE BACKEND RESPONSE
========================================================================== */

function normalizeData(result = {}) {
  /*
   * service returns:
   *
   * {
   *   period: {},
   *   metrics: {},
   *   dailyActivity: []
   * }
   */

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


  const dailyActivity =
    Array.isArray(
      root?.dailyActivity
    )
      ? root.dailyActivity
      : [];


  return {
    period:
      root?.period || {},


    metrics: {
      activeUsers:
        toNumber(
          metrics.activeUsers
        ),

      newUsers:
        toNumber(
          metrics.newUsers ??
          metrics.newActiveUsers
        ),

      newActiveUsers:
        toNumber(
          metrics.newActiveUsers ??
          metrics.newUsers
        ),

      returningUsers:
        toNumber(
          metrics.returningUsers
        ),

      dau:
        toNumber(
          metrics.dau
        ),

      wau:
        toNumber(
          metrics.wau
        ),

      mau:
        toNumber(
          metrics.mau
        ),

      sessions:
        toNumber(
          metrics.sessions
        ),

      events:
        toNumber(
          metrics.events
        ),

      sessionsPerUser:
        toNumber(
          metrics.sessionsPerUser ??
          metrics.averageSessionsPerUser
        ),

      eventsPerSession:
        toNumber(
          metrics.eventsPerSession
        ),

      averageSessionDuration:
        toNumber(
          metrics.averageSessionDuration
        ),

      averageActiveDaysPerUser:
        toNumber(
          metrics.averageActiveDaysPerUser
        ),

      averageFeaturesPerUser:
        toNumber(
          metrics.averageFeaturesPerUser
        ),

      engagementRate:
        toNumber(
          metrics.engagementRate
        ),

      returningRate:
        toNumber(
          metrics.returningRate
        ),
    },


    dailyActivity,
  };
}


/* ==========================================================================
   PAGE
========================================================================== */

export default function UserEngagementPage() {
  const navigate =
    useNavigate();


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
            await getUserEngagementAnalytics(
              days
            );


          setData(
            normalizeData(
              result
            )
          );

        } catch (err) {
          console.error(
            "User Engagement Analytics Error:",
            err
          );


          setError(
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load user engagement analytics."
          );

        } finally {
          setLoading(false);
        }
      },
      [days]
    );


  /* =========================================================================
     LOAD WHEN PERIOD CHANGES
  ========================================================================= */

  useEffect(
    () => {
      load();
    },
    [load]
  );


  /* =========================================================================
     METRICS
  ========================================================================= */

  const metrics =
    data.metrics;


  const dailyActivity =
    useMemo(
      () =>
        Array.isArray(
          data.dailyActivity
        )
          ? data.dailyActivity
          : [],
      [data.dailyActivity]
    );


  const maxDailyUsers =
    useMemo(
      () => {
        if (
          dailyActivity.length === 0
        ) {
          return 1;
        }

        return Math.max(
          ...dailyActivity.map(
            (item) =>
              toNumber(
                item?.users
              )
          ),
          1
        );
      },
      [dailyActivity]
    );


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
            User Engagement
          </h1>


          <p>
            Understand how users interact
            with MONE AI and how actively
            they use the platform.
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
            User engagement unavailable
          </strong>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ====================================================================
          PERIOD
      ==================================================================== */}

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


      {/* ====================================================================
          ENGAGEMENT OVERVIEW
      ==================================================================== */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Engagement Overview
            </h2>

            <p>
              Key user activity indicators
              for the selected period.
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
            label="Active Users"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.activeUsers
                  )
            }
            description="Unique users with activity"
          />


          <MetricCard
            icon={
              <UserPlus
                size={18}
              />
            }
            label="New Users"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.newUsers
                  )
            }
            description="First-time active users"
          />


          <MetricCard
            icon={
              <Repeat2
                size={18}
              />
            }
            label="Returning Users"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.returningUsers
                  )
            }
            description="Existing users returning"
          />


          <MetricCard
            icon={
              <Activity
                size={18}
              />
            }
            label="Engagement Rate"
            value={
              loading
                ? "—"
                : formatPercent(
                    metrics.engagementRate
                  )
            }
            description="Active users / registered users"
          />

        </div>

      </section>


      {/* ====================================================================
          DAU WAU MAU
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Active User Trends
            </h2>

            <p>
              Daily, weekly and monthly
              active user indicators.
            </p>

          </div>


          <TrendingUp
            size={20}
          />

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <Activity
                size={18}
              />
            }
            label="DAU"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.dau
                  )
            }
            description="Daily active users"
          />


          <MetricCard
            icon={
              <UsersRound
                size={18}
              />
            }
            label="WAU"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.wau
                  )
            }
            description="Weekly active users"
          />


          <MetricCard
            icon={
              <UsersRound
                size={18}
              />
            }
            label="MAU"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.mau
                  )
            }
            description="Monthly active users"
          />


          <MetricCard
            icon={
              <Repeat2
                size={18}
              />
            }
            label="Returning Rate"
            value={
              loading
                ? "—"
                : formatPercent(
                    metrics.returningRate
                  )
            }
            description="Returning users / active users"
          />

        </div>

      </section>


      {/* ====================================================================
          ACTIVITY METRICS
      ==================================================================== */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Activity Metrics
            </h2>

            <p>
              Sessions, events and user
              interaction intensity.
            </p>

          </div>

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <BarChart3
                size={18}
              />
            }
            label="Events"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.events
                  )
            }
            description="Analytics events recorded"
          />


          <MetricCard
            icon={
              <Zap
                size={18}
              />
            }
            label="Sessions"
            value={
              loading
                ? "—"
                : formatNumber(
                    metrics.sessions
                  )
            }
            description="Unique sessions recorded"
          />


          <MetricCard
            icon={
              <Repeat2
                size={18}
              />
            }
            label="Sessions / User"
            value={
              loading
                ? "—"
                : metrics.sessionsPerUser.toFixed(
                    2
                  )
            }
            description="Average sessions per active user"
          />


          <MetricCard
            icon={
              <Activity
                size={18}
              />
            }
            label="Events / Session"
            value={
              loading
                ? "—"
                : metrics.eventsPerSession.toFixed(
                    2
                  )
            }
            description="Average events per session"
          />

        </div>

      </section>


      {/* ====================================================================
          USER BEHAVIOUR
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              User Behaviour
            </h2>

            <p>
              Average behaviour of active
              users during the selected period.
            </p>

          </div>


          <Clock3
            size={20}
          />

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <Clock3
                size={18}
              />
            }
            label="Avg. Session Duration"
            value={
              loading
                ? "—"
                : formatDuration(
                    metrics.averageSessionDuration
                  )
            }
            description="Average session duration"
          />


          <MetricCard
            icon={
              <Activity
                size={18}
              />
            }
            label="Avg. Active Days"
            value={
              loading
                ? "—"
                : metrics.averageActiveDaysPerUser.toFixed(
                    1
                  )
            }
            description="Active days per user"
          />


          <MetricCard
            icon={
              <BarChart3
                size={18}
              />
            }
            label="Avg. Features / User"
            value={
              loading
                ? "—"
                : metrics.averageFeaturesPerUser.toFixed(
                    1
                  )
            }
            description="Features used per active user"
          />

        </div>

      </section>


      {/* ====================================================================
          DAILY ACTIVITY
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Daily Activity
            </h2>

            <p>
              User activity recorded each day
              during the selected period.
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
              Loading activity...
            </strong>

          </div>

        ) : dailyActivity.length === 0 ? (

          <div className="analytics-empty">

            <Activity
              size={28}
            />

            <strong>
              No daily activity available.
            </strong>

            <span>
              Activity will appear here when
              AnalyticsEvent records are available.
            </span>

          </div>

        ) : (

          <div
            style={{
              overflowX: "auto",
              paddingBottom: "10px",
            }}
          >

            <div
              style={{
                minWidth:
                  Math.max(
                    dailyActivity.length *
                      65,
                    600
                  ),
                height: "280px",
                display: "flex",
                alignItems: "flex-end",
                gap: "10px",
                padding:
                  "20px 10px 0",
              }}
            >

              {dailyActivity.map(
                (
                  item,
                  index
                ) => {

                  const users =
                    toNumber(
                      item?.users
                    );


                  const events =
                    toNumber(
                      item?.events
                    );


                  const height =
                    Math.max(
                      users > 0
                        ? (
                            users /
                            maxDailyUsers
                          ) *
                            100
                        : 3,
                      3
                    );


                  return (
                    <div
                      key={
                        item?.date ||
                        index
                      }
                      style={{
                        flex: 1,
                        minWidth:
                          "45px",
                        height:
                          "100%",
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        justifyContent:
                          "flex-end",
                        alignItems:
                          "center",
                        gap: "8px",
                      }}
                      title={`${formatShortDate(
                        item?.date
                      )}: ${formatNumber(
                        users
                      )} users, ${formatNumber(
                        events
                      )} events`}
                    >

                      <span
                        style={{
                          fontSize:
                            "11px",
                          color:
                            "#64748b",
                        }}
                      >
                        {formatNumber(
                          users
                        )}
                      </span>


                      <div
                        style={{
                          width:
                            "100%",
                          maxWidth:
                            "36px",
                          height:
                            `${height}%`,
                          minHeight:
                            "4px",
                          background:
                            "#2563eb",
                          borderRadius:
                            "6px 6px 0 0",
                          transition:
                            "height 0.2s ease",
                        }}
                      />


                      <span
                        style={{
                          fontSize:
                            "10px",
                          color:
                            "#64748b",
                          whiteSpace:
                            "nowrap",
                          transform:
                            "rotate(-45deg)",
                          transformOrigin:
                            "center",
                          marginTop:
                            "10px",
                        }}
                      >
                        {formatShortDate(
                          item?.date
                        )}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        )}

      </section>


      {/* ====================================================================
          SUMMARY
      ==================================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Engagement Summary
            </h2>

            <p>
              Summary of the selected period.
            </p>

          </div>


          <TrendingUp
            size={20}
          />

        </div>


        <div className="dashboard-grid">

          <SummaryItem
            label="Active Users"
            value={formatNumber(
              metrics.activeUsers
            )}
          />


          <SummaryItem
            label="New Users"
            value={formatNumber(
              metrics.newUsers
            )}
          />


          <SummaryItem
            label="Returning Users"
            value={formatNumber(
              metrics.returningUsers
            )}
          />


          <SummaryItem
            label="Events"
            value={formatNumber(
              metrics.events
            )}
          />


          <SummaryItem
            label="Sessions"
            value={formatNumber(
              metrics.sessions
            )}
          />


          <SummaryItem
            label="Engagement Rate"
            value={formatPercent(
              metrics.engagementRate
            )}
          />

        </div>

      </section>


      {/* ====================================================================
          SCOPE
      ==================================================================== */}

      <div className="analytics-scope">

        <strong>
          User Engagement:
        </strong>

        <span>
          Active users, new users,
          returning users, DAU, WAU, MAU,
          sessions, events, engagement rate
          and user activity behaviour.
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
   SUMMARY ITEM
========================================================================== */

function SummaryItem({
  label,
  value,
}) {
  return (
    <div className="analytics-card">

      <div className="analytics-card-top">

        <span>
          {label}
        </span>

      </div>


      <strong>
        {value}
      </strong>

    </div>
  );
}