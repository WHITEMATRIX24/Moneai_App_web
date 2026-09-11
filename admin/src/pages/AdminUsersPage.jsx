import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  UserX,
  X,
} from "lucide-react";

import PageHeader from "../components/PageHeader.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { adminService } from "../services/admin.service.js";
import { getStoredAdmin } from "../services/auth.service.js";

import "./AdminUsersPage.css";

const ROLES = ["ADMIN", "SUPPORT", "ANALYST"];

function formatRole(role) {
  return (
    role
      ?.replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "—"
  );
}

function formatDate(date) {
  if (!date) return "Never";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString();
}

function getInitials(name) {
  if (!name) return "A";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // ==============================
  // CREATE ADMIN STATE
  // ==============================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
  });

  // ==============================
  // EDIT ADMIN STATE
  // ==============================

  const [editingAdmin, setEditingAdmin] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  // ==============================
  // ADMIN STATUS STATE
  // ==============================

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState("");

  // ==============================
  // DELETE ADMIN STATE
  // ==============================

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const currentAdmin = getStoredAdmin();
  const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

  // ==============================
  // LOAD ADMINS
  // ==============================

  async function loadAdmins(isRefresh = false) {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await adminService.listAdmins();

      setAdmins(response.data?.admins || []);
    } catch (err) {
      console.error("Failed to load admin users:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load administrator accounts."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  // ==============================
  // FILTER ADMINS
  // ==============================

  const filteredAdmins = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        !normalizedSearch ||
        admin.name?.toLowerCase().includes(normalizedSearch) ||
        admin.email?.toLowerCase().includes(normalizedSearch);

      const matchesRole =
        roleFilter === "ALL" || admin.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && admin.isActive) ||
        (statusFilter === "INACTIVE" && !admin.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, search, roleFilter, statusFilter]);

  // ==============================
  // STATISTICS
  // ==============================

  const statistics = useMemo(() => {
    return {
      total: admins.length,

      active: admins.filter(
        (admin) => admin.isActive
      ).length,

      inactive: admins.filter(
        (admin) => !admin.isActive
      ).length,

      superAdmins: admins.filter(
        (admin) => admin.role === "SUPER_ADMIN"
      ).length,
    };
  }, [admins]);

  // ==============================
  // OPEN CREATE MODAL
  // ==============================

  function openCreateModal() {
    setCreateError("");
    setCreateSuccess("");
    setShowPassword(false);

    setFormData({
      name: "",
      email: "",
      password: "",
      role: "ADMIN",
    });

    setShowCreateModal(true);
  }

  // ==============================
  // CLOSE CREATE MODAL
  // ==============================

  function closeCreateModal() {
    if (creating) return;

    setShowCreateModal(false);
    setCreateError("");
    setCreateSuccess("");
    setShowPassword(false);
  }

  // ==============================
  // OPEN EDIT MODAL
  // ==============================

  function openEditModal(admin) {
    setUpdateError("");
    setUpdateSuccess("");

    setEditingAdmin({
      ...admin,
    });
  }

  // ==============================
  // CLOSE EDIT MODAL
  // ==============================

  function closeEditModal() {
    if (updating) return;

    setEditingAdmin(null);
    setUpdateError("");
    setUpdateSuccess("");
  }

  // ==============================
  // FORM CHANGE
  // ==============================

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==============================
  // CREATE ADMIN
  // ==============================

  async function handleCreateAdmin(event) {
    event.preventDefault();

    setCreateError("");
    setCreateSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const role = formData.role;

    if (!name || !email || !password || !role) {
      setCreateError(
        "Please fill in all required fields."
      );
      return;
    }

    if (password.length < 8) {
      setCreateError(
        "Password must be at least 8 characters."
      );
      return;
    }

    try {
      setCreating(true);

      await adminService.createAdmin({
        name,
        email,
        password,
        role,
      });

      setCreateSuccess(
        "Admin account created successfully."
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "ADMIN",
      });

      setShowPassword(false);

      await loadAdmins(true);

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess("");
        setShowPassword(false);
      }, 800);
    } catch (err) {
      console.error(
        "Failed to create admin:",
        err
      );

      setCreateError(
        err.response?.data?.message ||
          "Unable to create admin account."
      );
    } finally {
      setCreating(false);
    }
  }

  // ==============================
  // UPDATE ADMIN
  // ==============================

  async function handleUpdateAdmin(event) {
    event.preventDefault();

    if (!editingAdmin) return;

    setUpdateError("");
    setUpdateSuccess("");

    const name = editingAdmin.name?.trim();
    const email = editingAdmin.email
      ?.trim()
      .toLowerCase();

    const role = editingAdmin.role;

    if (!name || !email || !role) {
      setUpdateError(
        "Name, email and role are required."
      );
      return;
    }

    try {
      setUpdating(true);

      await adminService.updateAdmin(
        editingAdmin._id,
        {
          name,
          email,
          role,
        }
      );

      setUpdateSuccess(
        "Admin updated successfully."
      );

      await loadAdmins(true);

      setTimeout(() => {
        setEditingAdmin(null);
        setUpdateSuccess("");
      }, 800);
    } catch (err) {
      console.error(
        "Failed to update admin:",
        err
      );

      setUpdateError(
        err.response?.data?.message ||
          "Unable to update admin account."
      );
    } finally {
      setUpdating(false);
    }
  }

  // ==============================
  // ACTIVATE / DISABLE ADMIN
  // ==============================

  async function handleAdminStatus(admin) {
    if (!admin?._id) return;

    const nextStatus = !admin.isActive;

    setStatusError("");

    try {
      setStatusUpdating(true);

      await adminService.updateAdminStatus(
        admin._id,
        nextStatus
      );

      await loadAdmins(true);
    } catch (err) {
      console.error(
        "Failed to update admin status:",
        err
      );

      setStatusError(
        err.response?.data?.message ||
          "Unable to update admin status."
      );
    } finally {
      setStatusUpdating(false);
    }
  }

  // ==============================
  // DELETE ADMIN
  // ==============================

  async function handleDeleteAdmin(admin) {
    if (!admin?._id) return;

    if (admin._id === currentAdmin?._id) {
      setDeleteError(
        "You cannot delete your own account."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${admin.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteError("");

    try {
      setDeleting(true);

      await adminService.deleteAdmin(admin._id);

      await loadAdmins(true);
    } catch (err) {
      console.error(
        "Failed to delete admin:",
        err
      );

      setDeleteError(
        err.response?.data?.message ||
          "Unable to delete admin account."
      );
    } finally {
      setDeleting(false);
    }
  }

  // ==============================
  // CLEAR FILTERS
  // ==============================

  function clearFilters() {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  }

  const hasActiveFilters =
    search.trim() ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL";

  return (
    <div className="admin-users-page">

      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <PageHeader
        title="Admin Users"
        subtitle="Manage administrator accounts, roles and permissions."
        actions={
          isSuperAdmin && (
            <button
              type="button"
              className="btn btn-primary create-admin-btn"
              onClick={openCreateModal}
            >
              <UserPlus size={18} />
              <span>Create Admin</span>
            </button>
          )
        }
      />

      {/* =========================================
          STATISTICS
      ========================================= */}

      <div className="stats-container">

        <div className="stats-card">
          <div className="stats-card-icon">
            <UserCog size={21} />
          </div>

          <div className="stats-card-content">
            <div className="stats-card-label">
              Total Admins
            </div>

            <div className="stats-card-value">
              {statistics.total}
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-icon">
            <UserCheck size={21} />
          </div>

          <div className="stats-card-content">
            <div className="stats-card-label">
              Active
            </div>

            <div className="stats-card-value">
              {statistics.active}
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-icon">
            <UserX size={21} />
          </div>

          <div className="stats-card-content">
            <div className="stats-card-label">
              Inactive
            </div>

            <div className="stats-card-value">
              {statistics.inactive}
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-icon">
            <ShieldCheck size={21} />
          </div>

          <div className="stats-card-content">
            <div className="stats-card-label">
              Super Admins
            </div>

            <div className="stats-card-value">
              {statistics.superAdmins}
            </div>
          </div>
        </div>

      </div>

      {/* =========================================
          SEARCH + FILTERS
      ========================================= */}

      <div className="card filter-card">

        <div className="filter-row">

          <div className="search-wrapper">

            <Search
              size={19}
              className="search-icon"
              aria-hidden="true"
            />

            <input
              type="text"
              className="search-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}

          </div>

          <CustomSelect
            size="md"
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            options={[
              { value: "ALL", label: "All Roles" },
              ...["SUPER_ADMIN", ...ROLES].map((role) => ({
                value: role,
                label: formatRole(role),
              })),
            ]}
          />

          <CustomSelect
            size="md"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "ALL", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary clear-filter-btn"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary refresh-btn"
            onClick={() => loadAdmins(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "refresh-spinning"
                  : ""
              }
            />

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>

        </div>

        {!loading && (
          <div className="filter-summary">
            Showing{" "}
            <strong>
              {filteredAdmins.length}
            </strong>{" "}
            of{" "}
            <strong>
              {admins.length}
            </strong>{" "}
            administrators
          </div>
        )}

      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="card error-card">

          <div>
            <p>{error}</p>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => loadAdmins()}
            >
              Try Again
            </button>
          </div>

        </div>
      )}

      {statusError && (
        <div className="form-error">
          {statusError}
        </div>
      )}

      {deleteError && (
        <div className="form-error">
          {deleteError}
        </div>
      )}

      {/* =========================================
          ADMINISTRATOR TABLE
      ========================================= */}

      <div className="card table-card">

        <div className="table-card-header">

          <div>
            <span className="section-eyebrow">
              MANAGEMENT
            </span>

            <h3>
              Administrator Accounts
            </h3>

            <p>
              Review administrator access and manage account status.
            </p>
          </div>

          <div className="table-header-icon">
            <ShieldCheck size={21} />
          </div>

        </div>

        {/* =======================================
            LOADING
        ======================================= */}

        {loading ? (
          <div className="empty-state loading-state">

            <div className="loading-spinner" />

            <h3>
              Loading administrators
            </h3>

            <p>
              Please wait while we retrieve the administrator accounts.
            </p>

          </div>

        ) : filteredAdmins.length === 0 ? (

          /* =====================================
             EMPTY
          ===================================== */

          <div className="empty-state">

            <div className="empty-state-icon">
              {admins.length === 0 ? (
                <UserCog size={25} />
              ) : (
                <Search size={25} />
              )}
            </div>

            <h3>
              {admins.length === 0
                ? "No administrator accounts found"
                : "No administrators found"}
            </h3>

            <p>
              {admins.length === 0
                ? "There are currently no administrator accounts."
                : "No administrators match your current search or filters."}
            </p>

            {admins.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}

          </div>

        ) : (

          /* =====================================
             TABLE
          ===================================== */

          <div className="table-scroll">

            <table>

              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredAdmins.map(
                  (admin) => (
                    <tr key={admin._id}>

                      {/* ADMINISTRATOR */}

                      <td>
                        <div className="user-cell">

                          <div className="user-avatar">
                            {getInitials(
                              admin.name
                            )}
                          </div>

                          <div className="user-info">

                            <strong>
                              {admin.name}
                            </strong>

                            {admin._id ===
                              currentAdmin?._id && (
                              <span className="current-admin-label">
                                You
                              </span>
                            )}

                          </div>

                        </div>
                      </td>

                      {/* EMAIL */}

                      <td>
                        <span className="email-cell">
                          {admin.email}
                        </span>
                      </td>

                      {/* ROLE */}

                      <td>
                        <span
                          className={`role-badge ${
                            admin.role ===
                            "SUPER_ADMIN"
                              ? "super-admin"
                              : ""
                          }`}
                        >

                          {admin.role ===
                            "SUPER_ADMIN" && (
                            <ShieldCheck
                              size={13}
                            />
                          )}

                          {formatRole(
                            admin.role
                          )}

                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <button
                          type="button"
                          className={`status-badge ${
                            admin.isActive
                              ? "active"
                              : "inactive"
                          }`}
                          onClick={() =>
                            handleAdminStatus(admin)
                          }
                          disabled={
                            statusUpdating ||
                            deleting ||
                            admin._id ===
                              currentAdmin?._id
                          }
                          title={
                            admin._id ===
                            currentAdmin?._id
                              ? "You cannot disable your own account"
                              : admin.isActive
                              ? "Click to disable admin"
                              : "Click to activate admin"
                          }
                        >
                          <span className="status-dot" />

                          {admin.isActive
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </td>

                      {/* LAST LOGIN */}

                      <td>
                        <span className="date-cell">
                          {formatDate(
                            admin.lastLoginAt
                          )}
                        </span>
                      </td>

                      {/* CREATED */}

                      <td>
                        <span className="date-cell">
                          {formatDate(
                            admin.createdAt
                          )}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="table-actions">

                          {isSuperAdmin ? (
                            <>

                              <button
                                type="button"
                                className="btn btn-small btn-secondary"
                                onClick={() =>
                                  openEditModal(
                                    admin
                                  )
                                }
                                disabled={
                                  statusUpdating ||
                                  deleting
                                }
                                title="Edit administrator"
                              >
                                <Pencil
                                  size={14}
                                />

                                <span>
                                  Edit
                                </span>
                              </button>

                              <button
                                type="button"
                                className={`btn btn-small ${
                                  admin.isActive
                                    ? "btn-danger"
                                    : "btn-success btn-activate"
                                }`}
                                onClick={() =>
                                  handleAdminStatus(
                                    admin
                                  )
                                }
                                disabled={
                                  statusUpdating ||
                                  deleting ||
                                  admin._id ===
                                    currentAdmin?._id
                                }
                                title={
                                  admin._id ===
                                  currentAdmin?._id
                                    ? "You cannot disable your own account"
                                    : admin.isActive
                                    ? "Disable this admin"
                                    : "Activate this admin"
                                }
                              >

                                {admin.isActive ? (
                                  <UserX
                                    size={14}
                                  />
                                ) : (
                                  <CheckCircle2
                                    size={14}
                                  />
                                )}

                                <span>
                                  {admin.isActive
                                    ? "Disable"
                                    : "Activate"}
                                </span>

                              </button>

                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                onClick={() =>
                                  handleDeleteAdmin(
                                    admin
                                  )
                                }
                                disabled={
                                  deleting ||
                                  admin._id ===
                                    currentAdmin?._id
                                }
                                title={
                                  admin._id ===
                                  currentAdmin?._id
                                    ? "You cannot delete your own account"
                                    : "Delete this admin"
                                }
                              >

                                <Trash2
                                  size={14}
                                />

                                <span>
                                  {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                                </span>

                              </button>

                            </>
                          ) : (
                            <span className="read-only-label">
                              Read only
                            </span>
                          )}

                        </div>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =========================================
          CREATE ADMIN MODAL
      ========================================= */}

      {showCreateModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreateModal();
            }
          }}
        >

          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-admin-title"
          >

            <div className="modal-header">

              <div className="modal-title-row">

                <div className="modal-title-icon">
                  <UserPlus size={20} />
                </div>

                <div>
                  <h2 id="create-admin-title">
                    Create Admin
                  </h2>

                  <p>
                    Create a new administrator account.
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeCreateModal}
                disabled={creating}
                aria-label="Close"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={handleCreateAdmin}
            >

              <div className="modal-body">

                {createError && (
                  <div className="form-error">
                    {createError}
                  </div>
                )}

                {createSuccess && (
                  <div className="form-success">
                    {createSuccess}
                  </div>
                )}

                <div className="form-group">

                  <label htmlFor="admin-name">
                    Name
                  </label>

                  <input
                    id="admin-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter admin name"
                    autoComplete="name"
                    disabled={creating}
                    required
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="admin-email">
                    Email
                  </label>

                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter admin email"
                    autoComplete="email"
                    disabled={creating}
                    required
                  />

                </div>

                {/* PASSWORD */}

                <div className="form-group">

                  <label htmlFor="admin-password">
                    Password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      id="admin-password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={formData.password}
                      onChange={handleFormChange}
                      placeholder="Enter password (minimum 8 characters)"
                      autoComplete="new-password"
                      disabled={creating}
                      minLength={8}
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      disabled={creating}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      title={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>

                <div className="form-group">

                  <label htmlFor="admin-role">
                    Role
                  </label>

                  <CustomSelect
                    size="md"
                    value={formData.role}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, role: val }))
                    }
                    disabled={creating}
                    options={ROLES.map((role) => ({
                      value: role,
                      label: formatRole(role),
                    }))}
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeCreateModal}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  <UserPlus size={16} />

                  <span>
                    {creating
                      ? "Creating..."
                      : "Create Admin"}
                  </span>
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =========================================
          EDIT ADMIN MODAL
      ========================================= */}

      {editingAdmin && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditModal();
            }
          }}
        >

          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-admin-title"
          >

            <div className="modal-header">

              <div className="modal-title-row">

                <div className="modal-title-icon">
                  <Pencil size={19} />
                </div>

                <div>
                  <h2 id="edit-admin-title">
                    Edit Admin
                  </h2>

                  <p>
                    Update administrator details and role.
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeEditModal}
                disabled={updating}
                aria-label="Close"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={handleUpdateAdmin}
            >

              <div className="modal-body">

                {updateError && (
                  <div className="form-error">
                    {updateError}
                  </div>
                )}

                {updateSuccess && (
                  <div className="form-success">
                    {updateSuccess}
                  </div>
                )}

                <div className="form-group">

                  <label htmlFor="edit-admin-name">
                    Name
                  </label>

                  <input
                    id="edit-admin-name"
                    type="text"
                    value={
                      editingAdmin.name || ""
                    }
                    onChange={(event) =>
                      setEditingAdmin(
                        (previous) => ({
                          ...previous,
                          name: event.target.value,
                        })
                      )
                    }
                    disabled={updating}
                    required
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="edit-admin-email">
                    Email
                  </label>

                  <input
                    id="edit-admin-email"
                    type="email"
                    value={
                      editingAdmin.email || ""
                    }
                    onChange={(event) =>
                      setEditingAdmin(
                        (previous) => ({
                          ...previous,
                          email:
                            event.target.value,
                        })
                      )
                    }
                    disabled={updating}
                    required
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="edit-admin-role">
                    Role
                  </label>

                  <CustomSelect
                    size="md"
                    value={editingAdmin.role || "ADMIN"}
                    onChange={(val) =>
                      setEditingAdmin((previous) => ({
                        ...previous,
                        role: val,
                      }))
                    }
                    disabled={
                      updating ||
                      editingAdmin.role === "SUPER_ADMIN"
                    }
                    options={ROLES.map((role) => ({
                      value: role,
                      label: formatRole(role),
                    }))}
                  />

                  {editingAdmin.role ===
                    "SUPER_ADMIN" && (
                    <small className="form-help">
                      The SUPER_ADMIN role cannot
                      be changed here.
                    </small>
                  )}

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditModal}
                  disabled={updating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  <CheckCircle2 size={16} />

                  <span>
                    {updating
                      ? "Saving..."
                      : "Save Changes"}
                  </span>
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}