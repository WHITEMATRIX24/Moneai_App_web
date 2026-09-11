// src/pages/AdminSubscriptionsPage.jsx

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Crown,
  Users,
  Sparkles,
  ShieldCheck,
  Ban,
  RefreshCw,
  Download,
} from "lucide-react";

import PageHeader from "../components/PageHeader.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { adminService } from "../services/admin.service.js";
import { exportToPdf } from "../services/export.service.js";
import "./AdminSubscriptionsPage.css";

const PLAN_OPTIONS = ["FREE", "TRIAL", "PREMIUM", "ENTERPRISE"];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getPlanClass(plan = "") {
  const value = String(plan).toLowerCase();

  if (value.includes("enterprise")) return "plan-enterprise";
  if (value.includes("premium")) return "plan-premium";
  if (value.includes("trial")) return "plan-premium";

  return "plan-free";
}

function getStatusClass(status = "") {
  const value = String(status).toLowerCase();

  if (value === "active") return "status-active";
  if (value === "suspended") return "status-suspended";
  if (value === "blocked") return "status-blocked";

  return "status-inactive";
}

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [updatingPlanId, setUpdatingPlanId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const [error, setError] = useState("");

  async function load(showRefreshing = false) {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await adminService.users();

      setUsers(Array.isArray(response?.data?.users) ? response.data.users : []);
    } catch (err) {
      console.error("Failed to load users:", err);

      setUsers([]);
      setError("Unable to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: users.length,

      free: users.filter(
        (u) => getPlanClass(u.subscriptionPlan) === "plan-free",
      ).length,

      premium: users.filter((u) =>
        String(u.subscriptionPlan || "")
          .toLowerCase()
          .includes("premium"),
      ).length,

      enterprise: users.filter((u) =>
        String(u.subscriptionPlan || "")
          .toLowerCase()
          .includes("enterprise"),
      ).length,

      banned: users.filter((u) => u.status === "BLOCKED").length,
    };
  }, [users]);

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

      const matchesPlan =
        planFilter === "ALL" ||
        String(user.subscriptionPlan || "FREE").toUpperCase() === planFilter;

      const matchesStatus =
        statusFilter === "ALL" || user.status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, search, planFilter, statusFilter]);

  async function handlePlanChange(user, nextPlan) {
    if (nextPlan === user.subscriptionPlan) return;

    setUpdatingPlanId(user._id);
    setError("");

    try {
      await adminService.updateUserPlan(user._id, nextPlan);

      setUsers((current) =>
        current.map((item) =>
          item._id === user._id
            ? { ...item, subscriptionPlan: nextPlan }
            : item,
        ),
      );
    } catch (err) {
      console.error("Failed to update plan:", err);
      setError("Unable to update this user's plan.");
    } finally {
      setUpdatingPlanId(null);
    }
  }

  async function handleToggleBan(user) {
    const isBanned = user.status === "BLOCKED";
    const nextStatus = isBanned ? "ACTIVE" : "BLOCKED";

    const confirmed = window.confirm(
      isBanned
        ? `Unban ${user.name || "this user"}?`
        : `Ban ${user.name || "this user"}? They won't be able to sign in.`,
    );

    if (!confirmed) return;

    setUpdatingStatusId(user._id);
    setError("");

    try {
      await adminService.updateUserStatus(user._id, nextStatus);

      setUsers((current) =>
        current.map((item) =>
          item._id === user._id ? { ...item, status: nextStatus } : item,
        ),
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(`Unable to ${isBanned ? "unban" : "ban"} this user.`);
    } finally {
      setUpdatingStatusId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle="View and manage every user's subscription plan."
      />

      <div className="users-page">
        {/* STATS */}

        <section className="stats-container">
          <div className="stats-card">
            <div className="stats-icon-box">
              <Users size={22} />
            </div>
            <div>
              <p>Total Users</p>
              <h2>{stats.total}</h2>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon-box">
              <Sparkles size={22} />
            </div>
            <div>
              <p>Free</p>
              <h2>{stats.free}</h2>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon-box">
              <Crown size={22} />
            </div>
            <div>
              <p>Premium</p>
              <h2>{stats.premium}</h2>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon-box">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p>Enterprise</p>
              <h2>{stats.enterprise}</h2>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon-box">
              <Ban size={22} />
            </div>
            <div>
              <p>Banned</p>
              <h2>{stats.banned}</h2>
            </div>
          </div>
        </section>

        {/* SEARCH */}

        <section className="card search-card">
          <div className="users-search-wrapper">
            <Search size={18} />

            <input
              type="text"
              className="search-input users-search-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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

        {/* FILTERS */}

        <section className="card filter-card users-filter-card">
          <div className="filter-group">
            <label>Plan</label>

            <CustomSelect
              size="md"
              value={planFilter}
              onChange={(val) => setPlanFilter(val)}
              options={[
                { value: "ALL", label: "All plans" },
                ...PLAN_OPTIONS.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>

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
                { value: "BLOCKED", label: "Banned" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
          </div>

          <div className="users-result-count">
            Showing <strong>{filteredUsers.length}</strong> of{" "}
            <strong>{users.length}</strong> users
          </div>

          <button
            type="button"
            className="users-refresh-btn"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "users-refresh-spin" : ""}
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>

          <button
            type="button"
            className="export-btn"
            disabled={loading || !filteredUsers.length}
            onClick={() => {
              const rows = filteredUsers.map((user) => ({
                ID: String(user._id).slice(-8),
                Name: user.name || "",
                Email: user.email || "",
                Plan: String(user.subscriptionPlan || "FREE").toUpperCase(),
                Status: user.status === "BLOCKED" ? "BANNED" : (user.status || "INACTIVE"),
              }));
              exportToPdf(
                `subscriptions_${new Date().toISOString().slice(0, 10)}.pdf`,
                "Subscriptions",
                "View and manage every user's subscription plan.",
                rows
              );
            }}
          >
            <Download size={16} />
            Export PDF
          </button>
        </section>

        {error && <div className="error">{error}</div>}

        {/* TABLE */}

        <section className="card table-card users-table-card">
          <div className="users-table-heading">
            <div>
              <span>Management</span>
              <h2>Subscriptions</h2>
              <p>Change a user's plan or ban their account.</p>
            </div>

            <div className="users-table-icon">
              <Crown size={20} />
            </div>
          </div>

          {loading ? (
            <div className="users-loading">
              <div className="users-loader" />
              <span>Loading users...</span>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.length ? (
                    filteredUsers.map((user) => {
                      const currentPlan = String(
                        user.subscriptionPlan || "FREE",
                      ).toUpperCase();

                      const isBanned = user.status === "BLOCKED";

                      return (
                        <tr key={user._id}>
                          <td>
                            <div className="user-name-cell">
                              <div className="user-avatar">
                                {getInitials(user.name) || "U"}
                              </div>

                              <div className="users-name-info">
                                <strong>{user.name || "Unnamed User"}</strong>
                                <span>ID: {String(user._id).slice(-6)}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="users-email">
                              {user.email || "—"}
                            </span>
                          </td>

                          <td>
                            <div className="sub-admin-plan-cell">
                              <span
                                className={`plan-badge ${getPlanClass(currentPlan)}`}
                              >
                                {currentPlan}
                              </span>

                              <CustomSelect
                                size="sm"
                                value={currentPlan}
                                disabled={updatingPlanId === user._id}
                                onChange={(val) => handlePlanChange(user, val)}
                                options={PLAN_OPTIONS.map((p) => ({ value: p, label: p }))}
                              />
                            </div>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${getStatusClass(user.status)}`}
                            >
                              <span className="status-dot" />
                              {isBanned ? "BANNED" : user.status || "INACTIVE"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className={`users-status-btn ${
                                isBanned ? "activate" : "suspend"
                              }`}
                              onClick={() => handleToggleBan(user)}
                              disabled={updatingStatusId === user._id}
                            >
                              {updatingStatusId === user._id
                                ? "Updating..."
                                : isBanned
                                  ? "Unban"
                                  : "Ban"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No users match the selected filters.
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