// src/pages/UsersPage.jsx

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Crown,
  ShieldCheck,
  RefreshCw,
  Eye,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { adminService } from "../services/admin.service.js";
import "./UsersPage.css";


// ==========================================
// GET INITIALS
// ==========================================

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}


// ==========================================
// PLAN CLASS
// ==========================================

function getPlanClass(plan = "") {
  const value = plan.toLowerCase();

  if (value.includes("premium")) return "plan-premium";
  if (value.includes("enterprise")) return "plan-enterprise";

  return "plan-free";
}


// ==========================================
// STATUS CLASS
// ==========================================

function getStatusClass(status = "") {
  const value = status.toLowerCase();

  if (value === "active") return "status-active";
  if (value === "suspended") return "status-suspended";
  if (value === "blocked") return "status-blocked";

  return "status-inactive";
}


// ==========================================
// USERS PAGE
// ==========================================

export default function UsersPage() {

  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [updatingId, setUpdatingId] = useState(null);

  const [error, setError] = useState("");


  // ==========================================
  // LOAD USERS
  // ==========================================

  async function load(showRefreshing = false) {

    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {

      const response = await adminService.users();

      setUsers(
        Array.isArray(response?.data?.users)
          ? response.data.users
          : []
      );

    } catch (err) {

      console.error("Failed to load users:", err);

      setUsers([]);

      setError("Unable to load users.");

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  }


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    load();
  }, []);


  // ==========================================
  // CHANGE USER STATUS
  // ==========================================

  async function toggle(user) {

    const nextStatus =
      user.status === "ACTIVE"
        ? "SUSPENDED"
        : "ACTIVE";

    setUpdatingId(user._id);
    setError("");

    try {

      await adminService.updateUserStatus(
        user._id,
        nextStatus
      );

      setUsers((current) =>
        current.map((item) =>
          item._id === user._id
            ? {
                ...item,
                status: nextStatus,
              }
            : item
        )
      );

    } catch (err) {

      console.error("Failed to update user:", err);

      setError(
        `Unable to ${
          nextStatus === "ACTIVE"
            ? "activate"
            : "suspend"
        } this user.`
      );

    } finally {

      setUpdatingId(null);

    }
  }


  // ==========================================
  // AVAILABLE PLANS
  // ==========================================

  const availablePlans = useMemo(() => {

    return [
      ...new Set(
        users
          .map((user) => user.subscriptionPlan)
          .filter(Boolean)
      ),
    ];

  }, [users]);


  // ==========================================
  // STATISTICS
  // ==========================================

  const stats = useMemo(() => {

    return {

      total: users.length,

      active: users.filter(
        (user) => user.status === "ACTIVE"
      ).length,

      suspended: users.filter(
        (user) => user.status === "SUSPENDED"
      ).length,

      premium: users.filter((user) =>
        String(user.subscriptionPlan || "")
          .toLowerCase()
          .includes("premium")
      ).length,

    };

  }, [users]);


  // ==========================================
  // FILTER USERS
  // ==========================================

  const filteredUsers = useMemo(() => {

    const query = search.trim().toLowerCase();

    return users.filter((user) => {

      const matchesSearch =
        !query ||
        String(user.name || "")
          .toLowerCase()
          .includes(query) ||
        String(user.email || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        user.status === statusFilter;

      const matchesPlan =
        planFilter === "ALL" ||
        user.subscriptionPlan === planFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlan
      );

    });

  }, [
    users,
    search,
    statusFilter,
    planFilter,
  ]);


  // ==========================================
  // OPEN USER DETAILS
  // ==========================================

  function handleViewUser(user) {

    navigate(`/admin/users/${user._id}`);

  }


  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage mobile application users, subscriptions and account access."
      />

      <div className="users-page">

        {/* =====================================
            STATS
        ===================================== */}

        <section className="stats-container">

          <div className="stats-card">
            <div className="stats-card-icon">
              <Users size={21} />
            </div>
            <div className="stats-card-content">
              <div className="stats-card-label">Total Users</div>
              <div className="stats-card-value">{stats.total}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-icon">
              <UserCheck size={21} />
            </div>
            <div className="stats-card-content">
              <div className="stats-card-label">Active Users</div>
              <div className="stats-card-value">{stats.active}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-icon">
              <UserX size={21} />
            </div>
            <div className="stats-card-content">
              <div className="stats-card-label">Suspended</div>
              <div className="stats-card-value">{stats.suspended}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-icon">
              <Crown size={21} />
            </div>
            <div className="stats-card-content">
              <div className="stats-card-label">Premium</div>
              <div className="stats-card-value">{stats.premium}</div>
            </div>
          </div>

        </section>


        {/* =====================================
            SEARCH
        ===================================== */}

        <section className="card search-card">

          <div className="users-search-wrapper">

            <Search size={18} />

            <input
              type="text"
              className="search-input users-search-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (

              <button
                type="button"
                className="users-clear-search"
                onClick={() => setSearch("")}
              >
                Clear
              </button>

            )}

          </div>

        </section>


        {/* =====================================
            FILTERS
        ===================================== */}

        <section className="card filter-card users-filter-card">

          <div className="filter-group">
            <label>Status</label>

            <CustomSelect
              size="md"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "SUSPENDED", label: "Suspended" },
                { value: "BLOCKED", label: "Blocked" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
          </div>

          <div className="filter-group">
            <label>Subscription Plan</label>

            <CustomSelect
              size="md"
              value={planFilter}
              onChange={(val) => setPlanFilter(val)}
              options={[
                { value: "ALL", label: "All plans" },
                ...availablePlans.map((plan) => ({ value: plan, label: plan })),
              ]}
            />
          </div>


          <div className="users-result-count">

            Showing{" "}
            <strong>{filteredUsers.length}</strong>{" "}
            of{" "}
            <strong>{users.length}</strong>{" "}
            users

          </div>


          <button
            type="button"
            className="users-refresh-btn"
            onClick={() => load(true)}
            disabled={refreshing}
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "users-refresh-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing"
              : "Refresh"}

          </button>

        </section>


        {/* =====================================
            ERROR
        ===================================== */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}


        {/* =====================================
            USER TABLE
        ===================================== */}

        <section className="card table-card users-table-card">


          <div className="users-table-heading">

            <div>

              <span>Management</span>

              <h2>User Accounts</h2>

              <p>
                Review subscription plans and manage
                account status.
              </p>

            </div>


            <div className="users-table-icon">

              <ShieldCheck size={20} />

            </div>

          </div>


          {loading ? (

            <div className="users-loading">

              <div className="users-loader" />

              <span>
                Loading users...
              </span>

            </div>

          ) : (

            <div className="table-scroll">

              <table className="users-table">

                <thead>

                  <tr>

                    <th>User</th>

                    <th>Email</th>

                    <th>Role</th>

                    <th>Plan</th>

                    <th>Status</th>

                    <th>Action</th>

                    <th>View</th>

                  </tr>

                </thead>


                <tbody>

                  {filteredUsers.length ? (

                    filteredUsers.map((user) => (

                      <tr key={user._id}>


                        {/* USER */}

                        <td>

                          <div className="user-name-cell">

                            <div className="user-avatar">

                              {getInitials(
                                user.name
                              ) || "U"}

                            </div>


                            <div className="users-name-info">

                              <strong>
                                {user.name ||
                                  "Unnamed User"}
                              </strong>

                              <span>
                                ID:{" "}
                                {String(
                                  user._id
                                ).slice(-6)}
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* EMAIL */}

                        <td>

                          <span className="users-email">

                            {user.email || "—"}

                          </span>

                        </td>


                        {/* ROLE */}

                        <td>

                          <span className="role-badge">

                            {user.role || "USER"}

                          </span>

                        </td>


                        {/* PLAN */}

                        <td>

                          <span
                            className={`plan-badge ${getPlanClass(
                              user.subscriptionPlan
                            )}`}
                          >

                            {user.subscriptionPlan ||
                              "FREE"}

                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge ${getStatusClass(
                              user.status
                            )}`}
                          >

                            <span className="status-dot" />

                            {user.status ||
                              "INACTIVE"}

                          </span>

                        </td>


                        {/* ACTION */}

                        <td>

                          <button
                            type="button"
                            className={`users-status-btn ${
                              user.status ===
                              "ACTIVE"
                                ? "suspend"
                                : "activate"
                            }`}
                            onClick={() =>
                              toggle(user)
                            }
                            disabled={
                              updatingId ===
                              user._id
                            }
                          >

                            {updatingId ===
                            user._id
                              ? "Updating..."
                              : user.status ===
                                "ACTIVE"
                                ? "Suspend"
                                : "Activate"}

                          </button>

                        </td>


                        {/* VIEW */}

                        <td>

                          <button
                            type="button"
                            className="users-view-btn"
                            onClick={() =>
                              handleViewUser(user)
                            }
                          >

                            <Eye size={15} />

                            View

                          </button>

                        </td>


                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan="7"
                        className="empty-state"
                      >

                        No users match the
                        selected filters.

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>
    </>
  );
}