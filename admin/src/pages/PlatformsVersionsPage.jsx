import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  RefreshCcw,
  Smartphone,
  Monitor,
  Tablet,
  Globe2,
  TrendingUp,
} from "lucide-react";

import {
  getAppVersionAnalytics,
  getPlatformAnalytics,
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
    return "-";
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
   PLATFORM NORMALIZER
========================================================================== */

function normalizePlatformData(response) {
  const data =
    response?.data &&
    typeof response.data === "object"
      ? response.data
      : response || {};

  return {
    platforms:
      Array.isArray(data.platforms)
        ? data.platforms
        : [],
  };
}


/* ==========================================================================
   VERSION NORMALIZER
========================================================================== */

function normalizeVersionData(response) {
  const data =
    response?.data &&
    typeof response.data === "object"
      ? response.data
      : response || {};

  return {
    versions:
      Array.isArray(data.versions)
        ? data.versions
        : [],
  };
}


/* ==========================================================================
   PAGE
========================================================================== */

export default function PlatformsVersionsPage() {

  const [days, setDays] =
    useState(30);


  const [platformData, setPlatformData] =
    useState(
      normalizePlatformData({})
    );


  const [versionData, setVersionData] =
    useState(
      normalizeVersionData({})
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


          const [
            platforms,
            versions,
          ] = await Promise.all([

            getPlatformAnalytics(
              days
            ),

            getAppVersionAnalytics(
              days
            ),

          ]);


          setPlatformData(
            normalizePlatformData(
              platforms
            )
          );


          setVersionData(
            normalizeVersionData(
              versions
            )
          );

        } catch (error) {

          console.error(
            "Failed to load platform/version analytics:",
            error
          );


          setError(
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load platform and version analytics."
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
     CALCULATIONS
  ========================================================================== */

  const platforms =
    platformData.platforms;


  const versions =
    versionData.versions;


  const totalPlatformUsers =
    platforms.reduce(
      (
        total,
        platform
      ) =>
        total +
        toNumber(
          platform.users
        ),
      0
    );


  const totalVersionUsers =
    versions.reduce(
      (
        total,
        version
      ) =>
        total +
        toNumber(
          version.users
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
            Platforms & Versions
          </h1>

          <p>
            Analyze application usage across
            platforms and app versions.
          </p>

        </div>


        {/* ================================================================
            ACTIONS
        ================================================================= */}

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
          PLATFORM OVERVIEW
      ================================================================= */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Platform Overview
            </h2>

            <p>
              Understand where users access
              MONE AI.
            </p>

          </div>

        </div>


        <div className="analytics-grid">

          <MetricCard
            icon={
              <Globe2 size={18} />
            }
            title="Platforms"
            value={
              formatNumber(
                platforms.length
              )
            }
            description="Active platforms"
          />


          <MetricCard
            icon={
              <Smartphone size={18} />
            }
            title="Platform Users"
            value={
              formatNumber(
                totalPlatformUsers
              )
            }
            description="Users across platforms"
          />


          <MetricCard
            icon={
              <TrendingUp size={18} />
            }
            title="App Versions"
            value={
              formatNumber(
                versions.length
              )
            }
            description="Versions detected"
          />


          <MetricCard
            icon={
              <Monitor size={18} />
            }
            title="Version Users"
            value={
              formatNumber(
                totalVersionUsers
              )
            }
            description="Users across versions"
          />

        </div>

      </section>


      {/* ================================================================
          PLATFORM USAGE
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Platform Usage
            </h2>

            <p>
              User distribution across
              application platforms.
            </p>

          </div>

          <Smartphone
            size={20}
          />

        </div>


        {platforms.length === 0 ? (

          <EmptyState
            icon={
              <Globe2 size={28} />
            }
            title="No platform data available"
            description="Platform usage will appear when analytics events contain platform information."
          />

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

            {platforms.map(
              (platform) => {

                const users =
                  toNumber(
                    platform.users
                  );


                const events =
                  toNumber(
                    platform.events
                  );


                const percentage =
                  totalPlatformUsers >
                  0
                    ? (
                        users /
                        totalPlatformUsers
                      ) *
                      100
                    : 0;


                return (
                  <div
                    key={
                      platform.platform
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

                        <PlatformIcon
                          platform={
                            platform.platform
                          }
                        />

                        <div>

                          <strong>
                            {
                              platform.platform
                            }
                          </strong>

                          <div
                            style={{
                              color:
                                "#64748b",
                              fontSize:
                                "12px",
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


                      <span
                        style={{
                          color:
                            "#64748b",
                          fontSize:
                            "13px",
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
          VERSION USAGE
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              App Version Usage
            </h2>

            <p>
              Distribution of users across
              application versions.
            </p>

          </div>

          <Monitor
            size={20}
          />

        </div>


        {versions.length === 0 ? (

          <EmptyState
            icon={
              <Monitor size={28} />
            }
            title="No version data available"
            description="App version information will appear when analytics events contain version information."
          />

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
                    Version
                  </TableHeader>

                  <TableHeader>
                    Users
                  </TableHeader>

                  <TableHeader>
                    Percentage
                  </TableHeader>

                  <TableHeader>
                    Events
                  </TableHeader>

                </tr>

              </thead>


              <tbody>

                {versions.map(
                  (
                    version,
                    index
                  ) => {

                    const users =
                      toNumber(
                        version.users
                      );


                    const events =
                      toNumber(
                        version.events
                      );


                    const percentage =
                      totalVersionUsers >
                      0
                        ? (
                            users /
                            totalVersionUsers
                          ) *
                          100
                        : 0;


                    return (
                      <tr
                        key={
                          version.version ||
                          index
                        }
                      >

                        <TableCell>

                          <strong>
                            {version.version || "-"}
                          </strong>

                        </TableCell>


                        <TableCell>
                          {formatNumber(
                            users
                          )}
                        </TableCell>


                        <TableCell>
                          {formatPercentage(
                            percentage
                          )}
                        </TableCell>


                        <TableCell>
                          {formatNumber(
                            events
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
          PLATFORM TABLE
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Platform Details
            </h2>

            <p>
              Detailed platform activity.
            </p>

          </div>

          <Globe2
            size={20}
          />

        </div>


        {platforms.length === 0 ? (

          <EmptyState
            icon={
              <Globe2 size={28} />
            }
            title="No platform details available"
            description="Platform details will appear when analytics data is available."
          />

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
                    Platform
                  </TableHeader>

                  <TableHeader>
                    Users
                  </TableHeader>

                  <TableHeader>
                    Events
                  </TableHeader>

                  <TableHeader>
                    Share
                  </TableHeader>

                </tr>

              </thead>


              <tbody>

                {platforms.map(
                  (
                    platform,
                    index
                  ) => {

                    const users =
                      toNumber(
                        platform.users
                      );


                    const events =
                      toNumber(
                        platform.events
                      );


                    const percentage =
                      totalPlatformUsers >
                      0
                        ? (
                            users /
                            totalPlatformUsers
                          ) *
                          100
                        : 0;


                    return (
                      <tr
                        key={
                          platform.platform ||
                          index
                        }
                      >

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

                            <PlatformIcon
                              platform={
                                platform.platform
                              }
                            />

                            <strong>
                              {
                                platform.platform ||
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
          LAST UPDATED
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
   PLATFORM ICON
========================================================================== */

function PlatformIcon({
  platform,
}) {
  const value =
    String(
      platform || ""
    ).toLowerCase();


  if (
    value.includes("mobile") ||
    value.includes("android") ||
    value.includes("ios")
  ) {
    return (
      <Smartphone
        size={18}
      />
    );
  }


  if (
    value.includes("tablet")
  ) {
    return (
      <Tablet
        size={18}
      />
    );
  }


  return (
    <Monitor
      size={18}
    />
  );
}


/* ==========================================================================
   EMPTY STATE
========================================================================== */

function EmptyState({
  icon,
  title,
  description,
}) {
  return (
    <div className="analytics-empty">

      {icon}

      <strong>
        {title}
      </strong>

      <span>
        {description}
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