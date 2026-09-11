import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  RefreshCcw,
  Globe2,
  Users,
  Activity,
  MapPin,
} from "lucide-react";

import {
  getGeographicAnalytics,
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


/* ==========================================================================
   NORMALIZE RESPONSE
========================================================================== */

function normalizeGeographyData(response) {
  const data =
    response?.data &&
    typeof response.data === "object"
      ? response.data
      : response || {};

  return {
    geography:
      Array.isArray(data.geography)
        ? data.geography
        : [],
  };
}


/* ==========================================================================
   GEOGRAPHY PAGE
========================================================================== */

export default function GeographyPage() {

  const [days, setDays] =
    useState(30);


  const [data, setData] =
    useState(
      normalizeGeographyData({})
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
            await getGeographicAnalytics(
              days
            );


          setData(
            normalizeGeographyData(
              response
            )
          );

        } catch (error) {

          console.error(
            "Failed to load geography analytics:",
            error
          );


          setError(
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load geography analytics."
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
     DATA
  ========================================================================== */

  const geography =
    data.geography;


  const totalUsers =
    geography.reduce(
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


  const totalEvents =
    geography.reduce(
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
            Geography
          </h1>

          <p>
            Analyze user activity by
            country and geographic region.
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
            Unable to load geography analytics
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
              Geographic Overview
            </h2>

            <p>
              Overview of users and activity
              across countries.
            </p>

          </div>

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <Globe2 size={18} />
            }
            title="Countries"
            value={
              formatNumber(
                geography.length
              )
            }
            description="Countries with activity"
          />


          <MetricCard
            icon={
              <Users size={18} />
            }
            title="Users"
            value={
              formatNumber(
                totalUsers
              )
            }
            description="Users across countries"
          />


          <MetricCard
            icon={
              <Activity size={18} />
            }
            title="Events"
            value={
              formatNumber(
                totalEvents
              )
            }
            description="Recorded activities"
          />


          <MetricCard
            icon={
              <MapPin size={18} />
            }
            title="Top Country"
            value={
              geography.length > 0
                ? geography[0]?.country || "-"
                : "-"
            }
            description="Highest user activity"
          />

        </div>

      </section>


      {/* ================================================================
          COUNTRY DISTRIBUTION
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              User Distribution by Country
            </h2>

            <p>
              See where MONE AI users are
              accessing the platform.
            </p>

          </div>

          <Globe2
            size={20}
          />

        </div>


        {loading ? (

          <LoadingState />

        ) : geography.length === 0 ? (

          <EmptyState />

        ) : (

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap:
                "18px",
            }}
          >

            {geography.map(
              (
                item,
                index
              ) => {

                const users =
                  toNumber(
                    item.users
                  );


                const events =
                  toNumber(
                    item.events
                  );


                const percentage =
                  totalUsers > 0
                    ? (
                        users /
                        totalUsers
                      ) *
                      100
                    : 0;


                return (
                  <div
                    key={
                      item.country ||
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
                          "8px",
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
                              "34px",
                            height:
                              "34px",
                            borderRadius:
                              "8px",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            background:
                              "#f1f5f9",
                          }}
                        >

                          <MapPin
                            size={17}
                          />

                        </div>


                        <div>

                          <strong>
                            {item.country || "-"}
                          </strong>

                          <div
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#64748b",
                              marginTop:
                                "3px",
                            }}
                          >
                            {formatNumber(
                              events
                            )} events
                          </div>

                        </div>

                      </div>


                      <div
                        style={{
                          textAlign:
                            "right",
                        }}
                      >

                        <strong>
                          {formatNumber(
                            users
                          )}
                        </strong>

                        <div
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#64748b",
                            marginTop:
                              "3px",
                          }}
                        >
                          {formatPercentage(
                            percentage
                          )}
                        </div>

                      </div>

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
          COUNTRY TABLE
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Geographic Details
            </h2>

            <p>
              Detailed country-level activity.
            </p>

          </div>

          <MapPin
            size={20}
          />

        </div>


        {loading ? (

          <LoadingState />

        ) : geography.length === 0 ? (

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
                  "650px",
              }}
            >

              <thead>

                <tr>

                  <TableHeader>
                    #
                  </TableHeader>

                  <TableHeader>
                    Country
                  </TableHeader>

                  <TableHeader>
                    Users
                  </TableHeader>

                  <TableHeader>
                    Events
                  </TableHeader>

                  <TableHeader>
                    User Share
                  </TableHeader>

                </tr>

              </thead>


              <tbody>

                {geography.map(
                  (
                    item,
                    index
                  ) => {

                    const users =
                      toNumber(
                        item.users
                      );


                    const events =
                      toNumber(
                        item.events
                      );


                    const percentage =
                      totalUsers > 0
                        ? (
                            users /
                            totalUsers
                          ) *
                          100
                        : 0;


                    return (
                      <tr
                        key={
                          item.country ||
                          index
                        }
                      >

                        <TableCell>
                          {index + 1}
                        </TableCell>


                        <TableCell>

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap:
                                "8px",
                            }}
                          >

                            <Globe2
                              size={16}
                            />

                            <strong>
                              {
                                item.country ||
                                "-"
                              }
                            </strong>

                          </div>

                        </TableCell>


                        <TableCell>
                          {formatNumber(
                            users
                          )}
                        </TableCell>


                        <TableCell>
                          {formatNumber(
                            events
                          )}
                        </TableCell>


                        <TableCell>
                          {formatPercentage(
                            percentage
                          )}
                        </TableCell>

                      </tr>
                    );

                  }
                )}

              </tbody>

            </table>

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

      <Globe2
        size={28}
      />

      <strong>
        No geographic data available
      </strong>

      <span>
        Geographic information will appear
        when analytics events contain country
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
        Loading geography analytics...
      </strong>

      <span>
        Please wait while the latest data
        is loaded.
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