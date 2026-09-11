import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  RefreshCcw,
  Users,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

import {
  getUserSegmentsAnalytics,
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

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString();
}


/* ==========================================================================
   NORMALIZE API RESPONSE
========================================================================== */

function normalizeData(response) {
  const data =
    response?.data &&
    typeof response.data === "object"
      ? response.data
      : response || {};

  const summary =
    data.summary &&
    typeof data.summary === "object"
      ? data.summary
      : {};

  return {
    totalUsers:
      toNumber(
        summary.totalUsers
      ),

    powerUsers:
      toNumber(
        summary.powerUsers
      ),

    highlyEngagedUsers:
      toNumber(
        summary.highlyEngagedUsers
      ),

    regularUsers:
      toNumber(
        summary.regularUsers
      ),

    lowEngagementUsers:
      toNumber(
        summary.lowEngagementUsers
      ),

    segments:
      Array.isArray(data.segments)
        ? data.segments
        : [],

    users:
      Array.isArray(data.users)
        ? data.users
        : [],

    period:
      data.period || {},
  };
}


/* ==========================================================================
   PAGE
========================================================================== */

export default function UserSegmentsPage() {

  const [days, setDays] =
    useState(30);

  const [data, setData] =
    useState(
      normalizeData({})
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
            await getUserSegmentsAnalytics(
              days
            );

          setData(
            normalizeData(
              response
            )
          );

        } catch (error) {

          console.error(
            "Failed to load user segments:",
            error
          );

          setError(
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load user segment analytics."
          );

        } finally {

          setLoading(false);

        }

      },
      [days]
    );


  /* ==========================================================================
     INITIAL LOAD
  ========================================================================== */

  useEffect(
    () => {
      loadData();
    },
    [loadData]
  );


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
            User Segments
          </h1>

          <p>
            Understand users based on their
            platform engagement and activity.
          </p>

        </div>


        {/* ================================================================
            ACTIONS
        ================================================================= */}

        <div className="dashboard-actions">

          {/* PERIOD */}

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


          {/* REFRESH */}

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
            Unable to load analytics
          </strong>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ================================================================
          PERIOD
      ================================================================= */}

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
          SUMMARY CARDS
      ================================================================= */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              User Segment Overview
            </h2>

            <p>
              Users grouped according to
              their engagement level.
            </p>

          </div>

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <Users size={18} />
            }
            title="Total Users"
            value={
              formatNumber(
                data.totalUsers
              )
            }
            description="Active users"
          />


          <MetricCard
            icon={
              <TrendingUp size={18} />
            }
            title="Power Users"
            value={
              formatNumber(
                data.powerUsers
              )
            }
            description="50+ events"
          />


          <MetricCard
            icon={
              <UserCheck size={18} />
            }
            title="Highly Engaged"
            value={
              formatNumber(
                data.highlyEngagedUsers
              )
            }
            description="20–49 events"
          />


          <MetricCard
            icon={
              <UserPlus size={18} />
            }
            title="Regular Users"
            value={
              formatNumber(
                data.regularUsers
              )
            }
            description="5–19 events"
          />


          <MetricCard
            icon={
              <UserRound size={18} />
            }
            title="Low Engagement"
            value={
              formatNumber(
                data.lowEngagementUsers
              )
            }
            description="1–4 events"
          />

        </div>

      </section>


      {/* ================================================================
          SEGMENT DISTRIBUTION
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Segment Distribution
            </h2>

            <p>
              Distribution of users by
              engagement level.
            </p>

          </div>

          <Users
            size={20}
          />

        </div>


        {data.segments.length === 0 ? (

          <div className="analytics-empty">

            <Users
              size={28}
            />

            <strong>
              No segment data available.
            </strong>

            <span>
              User segment information will
              appear when analytics data is available.
            </span>

          </div>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >

            {data.segments.map(
              (segment) => {

                const users =
                  toNumber(
                    segment.users
                  );

                const percentage =
                  toNumber(
                    segment.percentage
                  );

                return (
                  <div
                    key={
                      segment.segment
                    }
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        marginBottom:
                          "7px",
                      }}
                    >

                      <span
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {
                          segment.segment
                        }
                      </span>

                      <span
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        {formatNumber(
                          users
                        )} users ·{" "}
                        {formatPercentage(
                          percentage
                        )}
                      </span>

                    </div>


                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background:
                          "#f1f5f9",
                        borderRadius:
                          "999px",
                        overflow: "hidden",
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
                          height: "100%",
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
          USER DETAILS
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              User Details
            </h2>

            <p>
              User activity calculated from
              analytics events stored in MongoDB.
            </p>

          </div>

          <Users
            size={20}
          />

        </div>


        {data.users.length === 0 ? (

          <div className="analytics-empty">

            <Users
              size={28}
            />

            <strong>
              No user activity found.
            </strong>

            <span>
              No users were found for the
              selected period.
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
                borderCollapse:
                  "collapse",
                minWidth:
                  "850px",
              }}
            >

              <thead>

                <tr>

                  <TableHeader>
                    User
                  </TableHeader>

                  <TableHeader>
                    Segment
                  </TableHeader>

                  <TableHeader>
                    Events
                  </TableHeader>

                  <TableHeader>
                    Sessions
                  </TableHeader>

                  <TableHeader>
                    Active Days
                  </TableHeader>

                  <TableHeader>
                    Modules
                  </TableHeader>

                  <TableHeader>
                    Features
                  </TableHeader>

                  <TableHeader>
                    Last Activity
                  </TableHeader>

                </tr>

              </thead>


              <tbody>

                {data.users.map(
                  (user) => (

                    <tr
                      key={
                        user.userId
                      }
                    >

                      <TableCell>

                        <code>
                          {
                            user.userId
                          }
                        </code>

                      </TableCell>


                      <TableCell>

                        <span
                          style={{
                            padding:
                              "4px 8px",
                            borderRadius:
                              "999px",
                            background:
                              "#eff6ff",
                            color:
                              "#1d4ed8",
                            fontSize:
                              "12px",
                            fontWeight:
                              600,
                          }}
                        >
                          {
                            user.segment
                          }
                        </span>

                      </TableCell>


                      <TableCell>
                        {formatNumber(
                          user.events
                        )}
                      </TableCell>


                      <TableCell>
                        {formatNumber(
                          user.sessions
                        )}
                      </TableCell>


                      <TableCell>
                        {formatNumber(
                          user.activeDays
                        )}
                      </TableCell>


                      <TableCell>
                        {formatNumber(
                          user.modules
                        )}
                      </TableCell>


                      <TableCell>
                        {formatNumber(
                          user.features
                        )}
                      </TableCell>


                      <TableCell>
                        {formatDate(
                          user.lastActivity
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
   TABLE HEADER
========================================================================== */

function TableHeader({
  children,
}) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "12px",
        borderBottom:
          "1px solid #e5e7eb",
        fontSize: "12px",
        color: "#64748b",
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
        fontSize: "13px",
        whiteSpace:
          "nowrap",
      }}
    >
      {children}
    </td>
  );
}