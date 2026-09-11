import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  RefreshCcw,
  Network,
  Users,
  TrendingUp,
  Layers3,
} from "lucide-react";

import {
  getCrossModuleAnalytics,
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
    totalUsers: toNumber(
      summary.totalUsers
    ),

    multiModuleUsers: toNumber(
      summary.multiModuleUsers
    ),

    averageModulesPerUser: toNumber(
      summary.averageModulesPerUser
    ),

    totalModuleCombinations: toNumber(
      summary.totalModuleCombinations
    ),

    moduleUsage:
      Array.isArray(data.moduleUsage)
        ? data.moduleUsage
        : [],

    combinations:
      Array.isArray(data.combinations)
        ? data.combinations
        : [],

    users:
      Array.isArray(data.users)
        ? data.users
        : [],

    trends:
      Array.isArray(data.trends)
        ? data.trends
        : [],

    period:
      data.period || {},
  };
}


/* ==========================================================================
   PAGE
========================================================================== */

export default function CrossModuleUsagePage() {

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
            await getCrossModuleAnalytics(
              days
            );

          setData(
            normalizeData(
              response
            )
          );

        } catch (error) {

          console.error(
            "Failed to load cross-module analytics:",
            error
          );

          setError(
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load cross-module analytics."
          );

        } finally {

          setLoading(false);

        }

      },
      [days]
    );


  /* ==========================================================================
     INITIAL LOAD / PERIOD CHANGE
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
            Cross-Module Usage
          </h1>

          <p>
            Understand how users interact
            across multiple MONE AI modules.
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
          SUMMARY
      ================================================================= */}

      <section>

        <div className="section-heading">

          <div>

            <h2>
              Cross-Module Overview
            </h2>

            <p>
              See how broadly users are
              engaging with MONE AI.
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
            description="Users in selected period"
          />


          <MetricCard
            icon={
              <Network size={18} />
            }
            title="Multi-Module Users"
            value={
              formatNumber(
                data.multiModuleUsers
              )
            }
            description="Users using multiple modules"
          />


          <MetricCard
            icon={
              <Layers3 size={18} />
            }
            title="Average Modules / User"
            value={
              data.averageModulesPerUser.toFixed(
                1
              )
            }
            description="Average modules used"
          />


          <MetricCard
            icon={
              <TrendingUp size={18} />
            }
            title="Module Combinations"
            value={
              formatNumber(
                data.totalModuleCombinations
              )
            }
            description="Observed combinations"
          />

        </div>

      </section>


      {/* ================================================================
          MODULE USAGE
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Module Usage
            </h2>

            <p>
              Adoption of individual modules
              within the selected period.
            </p>

          </div>

          <Layers3
            size={20}
          />

        </div>


        {data.moduleUsage.length === 0 ? (

          <EmptyState
            icon={
              <Layers3 size={28} />
            }
            title="No module usage data available"
            description="Module usage will appear when analytics events are available."
          />

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >

            {data.moduleUsage.map(
              (module) => {

                const users =
                  toNumber(
                    module.users
                  );

                const percentage =
                  toNumber(
                    module.percentage
                  );

                const events =
                  toNumber(
                    module.events
                  );

                return (
                  <div
                    key={
                      module.module
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
                          "8px",
                      }}
                    >

                      <div>

                        <strong>
                          {
                            module.module
                          }
                        </strong>

                        <div
                          style={{
                            color:
                              "#6b7280",
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
                        width: "100%",
                        height: "8px",
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
          MODULE COMBINATIONS
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Top Module Combinations
            </h2>

            <p>
              The most common combinations
              of modules used by users.
            </p>

          </div>

          <Network
            size={20}
          />

        </div>


        {data.combinations.length === 0 ? (

          <EmptyState
            icon={
              <Network size={28} />
            }
            title="No module combinations available"
            description="Cross-module combinations will appear when sufficient usage data is available."
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
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "650px",
              }}
            >

              <thead>

                <tr>

                  <TableHeader>
                    Rank
                  </TableHeader>

                  <TableHeader>
                    Module Combination
                  </TableHeader>

                  <TableHeader>
                    Users
                  </TableHeader>

                  <TableHeader>
                    Percentage
                  </TableHeader>

                  <TableHeader>
                    Usage
                  </TableHeader>

                </tr>

              </thead>


              <tbody>

                {data.combinations.map(
                  (combination, index) => {

                    const users =
                      toNumber(
                        combination.users
                      );

                    const percentage =
                      toNumber(
                        combination.percentage
                      );

                    const usage =
                      toNumber(
                        combination.usage ??
                        combination.events
                      );

                    return (
                      <tr
                        key={
                          combination.id ||
                          combination.combination ||
                          index
                        }
                      >

                        <TableCell>
                          {index + 1}
                        </TableCell>


                        <TableCell>

                          <strong>
                            {
                              combination.combination ||
                              combination.modules ||
                              combination.name ||
                              "-"
                            }
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
                            usage
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
          CROSS-MODULE USERS
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Multi-Module Users
            </h2>

            <p>
              Users who actively engage with
              more than one MONE AI module.
            </p>

          </div>

          <Users
            size={20}
          />

        </div>


        {data.users.length === 0 ? (

          <EmptyState
            icon={
              <Users size={28} />
            }
            title="No multi-module users available"
            description="User-level aggregate usage will appear when data is available."
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
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "700px",
              }}
            >

              <thead>

                <tr>

                  <TableHeader>
                    User
                  </TableHeader>

                  <TableHeader>
                    Modules Used
                  </TableHeader>

                  <TableHeader>
                    Events
                  </TableHeader>

                  <TableHeader>
                    Sessions
                  </TableHeader>

                  <TableHeader>
                    Last Activity
                  </TableHeader>

                </tr>

              </thead>


              <tbody>

                {data.users.map(
                  (user, index) => {

                    const modules =
                      Array.isArray(
                        user.modules
                      )
                        ? user.modules
                        : [];

                    return (
                      <tr
                        key={
                          user.userId ||
                          index
                        }
                      >

                        <TableCell>

                          <code>
                            {
                              user.userId ||
                              "-"
                            }
                          </code>

                        </TableCell>


                        <TableCell>

                          {modules.length > 0 ? (

                            <div
                              style={{
                                display:
                                  "flex",
                                flexWrap:
                                  "wrap",
                                gap:
                                  "6px",
                              }}
                            >

                              {modules.map(
                                (module) => (

                                  <span
                                    key={
                                      module
                                    }
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
                                      module
                                    }
                                  </span>

                                )
                              )}

                            </div>

                          ) : (

                            formatNumber(
                              user.moduleCount
                            )

                          )}

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
                          {formatDate(
                            user.lastActivity
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
          TRENDS
      ================================================================= */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <h2>
              Cross-Module Trends
            </h2>

            <p>
              Changes in multi-module engagement
              over time.
            </p>

          </div>

          <TrendingUp
            size={20}
          />

        </div>


        {data.trends.length === 0 ? (

          <EmptyState
            icon={
              <TrendingUp size={28} />
            }
            title="No trend data available"
            description="Cross-module trends will appear when historical analytics data is available."
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
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "600px",
              }}
            >

              <thead>

                <tr>

                  <TableHeader>
                    Date
                  </TableHeader>

                  <TableHeader>
                    Active Users
                  </TableHeader>

                  <TableHeader>
                    Multi-Module Users
                  </TableHeader>

                  <TableHeader>
                    Average Modules
                  </TableHeader>

                </tr>

              </thead>


              <tbody>

                {data.trends.map(
                  (trend, index) => (

                    <tr
                      key={
                        trend.date ||
                        index
                      }
                    >

                      <TableCell>
                        {
                          trend.date ||
                          "-"
                        }
                      </TableCell>

                      <TableCell>
                        {formatNumber(
                          trend.activeUsers
                        )}
                      </TableCell>

                      <TableCell>
                        {formatNumber(
                          trend.multiModuleUsers
                        )}
                      </TableCell>

                      <TableCell>
                        {toNumber(
                          trend.averageModules
                        ).toFixed(1)}
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