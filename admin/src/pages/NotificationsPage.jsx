import { useEffect, useMemo, useState } from "react";
import { usePrimaryColor } from "../hooks/usePrimaryColor.js";
import {
  FiBell,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiSend,
  FiClock,
  FiX,
  FiBarChart2,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
} from "react-icons/fi";

import api from "../services/api.js";
import PageHeader from "../components/PageHeader.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import "./NotificationsPage.css";

const PAGE_SIZE = 5;

export default function NotificationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [editingNotification, setEditingNotification] = useState(null);
  const [schedulingNotification, setSchedulingNotification] = useState(null);
  const [scheduledAt, setScheduledAt] = useState("");

  const [statsNotification, setStatsNotification] = useState(null);
  const [notificationStats, setNotificationStats] = useState(null);

  const [selectedNotification, setSelectedNotification] = useState(null);

  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [userId, setUserId] = useState("");

  const [page, setPage] = useState(1);

  const getAudienceLabel = (value) => {
    const labels = {
      ALL: "All Users",
      FREE: "Free Users",
      PREMIUM: "Premium Users",
      USER: "Specific User",
    };

    return labels[value] || value || "—";
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const resetForm = () => {
    setEditingNotification(null);
    setNotificationTitle("");
    setNotificationBody("");
    setAudience("ALL");
    setUserId("");
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    resetForm();
  };

  const getErrorMessage = (error, fallback = "Something went wrong") =>
    error?.response?.data?.message || error?.message || fallback;

  const fetchNotifications = async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);

      const response = await api.get("/notifications");
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error("Fetch notifications error:", error);
      alert(getErrorMessage(error, "Failed to fetch notifications"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSaveDraft = async (e) => {
    e.preventDefault();

    if (!notificationTitle.trim() || !notificationBody.trim()) {
      alert("Title and message are required.");
      return;
    }

    if (audience === "USER" && !userId.trim()) {
      alert("User ID is required for a specific user.");
      return;
    }

    const payload = {
      title: notificationTitle.trim(),
      body: notificationBody.trim(),
      audience,
      ...(audience === "USER" ? { userId: userId.trim() } : {}),
    };

    try {
      if (editingNotification?._id) {
        await api.patch(`/notifications/${editingNotification._id}`, payload);
      } else {
        await api.post("/notifications", payload);
      }

      closeCreateModal();
      await fetchNotifications(true);
    } catch (error) {
      console.error("Notification save error:", error);

      alert(
        getErrorMessage(
          error,
          editingNotification
            ? "Failed to update notification"
            : "Failed to create notification",
        ),
      );
    }
  };

  const handleEditClick = (notification) => {
    setEditingNotification(notification);
    setNotificationTitle(notification.title || "");
    setNotificationBody(notification.body || "");
    setAudience(notification.audience || "ALL");
    setUserId(notification.userId || "");
    setShowCreate(true);
  };

  const handleScheduleClick = (notification) => {
    setSchedulingNotification(notification);
    setScheduledAt("");
  };

  const handleSchedule = async () => {
    if (!scheduledAt) {
      alert("Please select a date and time.");
      return;
    }

    if (!schedulingNotification?._id) {
      alert("Notification not found.");
      return;
    }

    const selectedDate = new Date(scheduledAt);

    if (Number.isNaN(selectedDate.getTime())) {
      alert("Please select a valid date and time.");
      return;
    }

    if (selectedDate <= new Date()) {
      alert("Scheduled time must be in the future.");
      return;
    }

    try {
      setBusyId(schedulingNotification._id);

      await api.post(`/notifications/${schedulingNotification._id}/schedule`, {
        scheduledAt,
      });

      setSchedulingNotification(null);
      setScheduledAt("");

      await fetchNotifications(true);
    } catch (error) {
      console.error("Schedule notification error:", error);
      alert(getErrorMessage(error, "Failed to schedule notification"));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelScheduled = async (notificationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this scheduled notification?",
    );

    if (!confirmed) return;

    try {
      setBusyId(notificationId);
      await api.post(`/notifications/${notificationId}/cancel`);
      await fetchNotifications(true);
    } catch (error) {
      console.error("Cancel notification error:", error);
      alert(getErrorMessage(error, "Failed to cancel notification"));
    } finally {
      setBusyId(null);
    }
  };

  const handleSendNow = async (notificationId) => {
    const confirmed = window.confirm("Send this notification now?");

    if (!confirmed) return;

    try {
      setBusyId(notificationId);
      await api.post(`/notifications/${notificationId}/send`);
      await fetchNotifications(true);
    } catch (error) {
      console.error("Send notification error:", error);
      alert(getErrorMessage(error, "Failed to send notification"));
    } finally {
      setBusyId(null);
    }
  };

  const handleViewStats = async (notification) => {
    try {
      setBusyId(notification._id);

      const response = await api.get(
        `/notifications/${notification._id}/stats`,
      );

      setStatsNotification(notification);
      setNotificationStats(response.data?.stats || null);
    } catch (error) {
      console.error("Notification statistics error:", error);
      alert(getErrorMessage(error, "Failed to fetch notification statistics"));
    } finally {
      setBusyId(null);
    }
  };

  const handleCloseStats = () => {
    setStatsNotification(null);
    setNotificationStats(null);
  };

  const filteredNotifications = useMemo(() => {
    const value = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const title = (notification.title || "").toLowerCase();
      const body = (notification.body || "").toLowerCase();
      const status = (notification.status || "").toLowerCase();

      const matchesSearch =
        !value || title.includes(value) || body.includes(value);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [notifications, search, statusFilter]);

  const summary = useMemo(
    () => ({
      total: notifications.length,
      drafts: notifications.filter(
        (notification) => notification.status === "DRAFT",
      ).length,
      scheduled: notifications.filter(
        (notification) => notification.status === "SCHEDULED",
      ).length,
      sent: notifications.filter(
        (notification) => notification.status === "SENT",
      ).length,
      cancelled: notifications.filter(
        (notification) => notification.status === "CANCELLED",
      ).length,
    }),
    [notifications],
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / PAGE_SIZE),
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const dashboardTotal = summary.total || 1;

  const dashboardStats = [
    {
      label: "Sent",
      value: summary.sent,
      percent: (summary.sent / dashboardTotal) * 100,
      className: "sent",
    },
    {
      label: "Scheduled",
      value: summary.scheduled,
      percent: (summary.scheduled / dashboardTotal) * 100,
      className: "scheduled",
    },
    {
      label: "Drafts",
      value: summary.drafts,
      percent: (summary.drafts / dashboardTotal) * 100,
      className: "draft",
    },
    {
      label: "Cancelled",
      value: summary.cancelled,
      percent: (summary.cancelled / dashboardTotal) * 100,
      className: "cancelled",
    },
  ];

  const primaryColor = usePrimaryColor();

  const donutStyle =
    summary.total === 0
      ? { background: "#efe5d9" }
      : {
          background: `conic-gradient(
            ${primaryColor} 0% ${dashboardStats[0].percent}%,
            #f7a243 ${dashboardStats[0].percent}% ${
              dashboardStats[0].percent + dashboardStats[1].percent
            }%,
            #c8b9a8 ${dashboardStats[0].percent + dashboardStats[1].percent}% ${
              dashboardStats[0].percent +
              dashboardStats[1].percent +
              dashboardStats[2].percent
            }%,
            #cf4d4d ${
              dashboardStats[0].percent +
              dashboardStats[1].percent +
              dashboardStats[2].percent
            }% 100%
          )`,
        };

  const statusTabs = [
    ["all", "All", summary.total],
    ["draft", "Drafts", summary.drafts],
    ["scheduled", "Scheduled", summary.scheduled],
    ["sent", "Sent", summary.sent],
    ["cancelled", "Cancelled", summary.cancelled],
  ];

  return (
    <div className="notifications-page">
      <PageHeader
        title="Notifications"
        subtitle="Create, schedule and manage user notifications from one place."
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
            >
              <FiPlus />
              Create Notification
            </button>
          </>
        }
      />

      <div className="notification-summary-grid">
        <button
          type="button"
          className={`summary-card ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="summary-icon total">
            <FiBell />
          </div>

          <div>
            <span>Total Notifications</span>
            <strong>{summary.total}</strong>
            <small>All activity</small>
          </div>
        </button>

        <button
          type="button"
          className={`summary-card ${statusFilter === "draft" ? "active" : ""}`}
          onClick={() => setStatusFilter("draft")}
        >
          <div className="summary-icon draft">
            <FiEdit2 />
          </div>

          <div>
            <span>Drafts</span>
            <strong>{summary.drafts}</strong>
            <small>Ready to edit</small>
          </div>
        </button>

        <button
          type="button"
          className={`summary-card ${
            statusFilter === "scheduled" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("scheduled")}
        >
          <div className="summary-icon scheduled">
            <FiClock />
          </div>

          <div>
            <span>Scheduled</span>
            <strong>{summary.scheduled}</strong>
            <small>Queued for later</small>
          </div>
        </button>

        <button
          type="button"
          className={`summary-card ${statusFilter === "sent" ? "active" : ""}`}
          onClick={() => setStatusFilter("sent")}
        >
          <div className="summary-icon sent">
            <FiCheckCircle />
          </div>

          <div>
            <span>Sent</span>
            <strong>{summary.sent}</strong>
            <small>Delivered activity</small>
          </div>
        </button>
      </div>

      <div className="notification-tabs">
        {statusTabs.map(([value, label, count]) => (
          <button
            type="button"
            key={value}
            className={`notification-tab ${
              statusFilter === value ? "active" : ""
            }`}
            onClick={() => setStatusFilter(value)}
          >
            {label}
            <span>{count}</span>
          </button>
        ))}
      </div>

      <div className="notifications-content-grid">
        <section className="notifications-card">
          <div className="notifications-toolbar">
            <div className="notification-search">
              <FiSearch />

              <input
                type="text"
                placeholder="Search by title or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="clear-filter-btn"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              <FiFilter />
              Clear Filters
            </button>
          </div>

          <div className="notifications-card-header">
            <div>
              <span className="section-kicker">History</span>
              <h2>Notification History</h2>
              <p>
                {filteredNotifications.length} notification
                {filteredNotifications.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="history-icon">
              <FiUsers />
            </div>
          </div>

          <div className="notifications-table-wrapper">
            <table className="notifications-table">
              <thead>
                <tr>
                  <th>Notification</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Scheduled / Sent</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="empty-notifications">
                      <div className="notification-loading">
                        <div className="notification-loader" />
                        <span>Loading notifications...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedNotifications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-notifications">
                      <div className="empty-state">
                        <div className="empty-icon">
                          <FiBell />
                        </div>

                        <strong>No notifications found</strong>
                        <span>Try changing your search or status filter.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedNotifications.map((notification) => (
                    <tr key={notification._id}>
                      <td>
                        <div className="notification-name">
                          <div className="notification-icon">
                            <FiBell />
                          </div>

                          <div className="notification-copy">
                            <strong>{notification.title}</strong>

                            <span>
                              {notification.body
                                ? notification.body.length > 65
                                  ? `${notification.body.slice(0, 65)}...`
                                  : notification.body
                                : "No message"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="audience-badge">
                          {getAudienceLabel(notification.audience)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge status-${(
                            notification.status || ""
                          ).toLowerCase()}`}
                        >
                          <i />
                          {notification.status}
                        </span>
                      </td>

                      <td>
                        {notification.scheduledAt
                          ? formatDate(notification.scheduledAt)
                          : notification.sentAt
                            ? formatDate(notification.sentAt)
                            : "—"}
                      </td>

                      <td>{formatDate(notification.createdAt)}</td>

                      <td>
                        <div className="notification-actions">
                          <button
                            type="button"
                            title="View"
                            className="action-btn"
                            onClick={() =>
                              setSelectedNotification(notification)
                            }
                          >
                            <FiEye />
                          </button>

                          {notification.status === "DRAFT" && (
                            <>
                              <button
                                type="button"
                                title="Edit"
                                className="action-btn"
                                onClick={() => handleEditClick(notification)}
                              >
                                <FiEdit2 />
                              </button>

                              <button
                                type="button"
                                title="Send Now"
                                className="action-btn"
                                disabled={busyId === notification._id}
                                onClick={() => handleSendNow(notification._id)}
                              >
                                <FiSend />
                              </button>

                              <button
                                type="button"
                                title="Schedule"
                                className="action-btn"
                                onClick={() =>
                                  handleScheduleClick(notification)
                                }
                              >
                                <FiClock />
                              </button>
                            </>
                          )}

                          {notification.status === "SCHEDULED" && (
                            <>
                              <button
                                type="button"
                                title="Statistics"
                                className="action-btn"
                                disabled={busyId === notification._id}
                                onClick={() => handleViewStats(notification)}
                              >
                                <FiBarChart2 />
                              </button>

                              <button
                                type="button"
                                title="Cancel"
                                className="action-btn action-danger"
                                disabled={busyId === notification._id}
                                onClick={() =>
                                  handleCancelScheduled(notification._id)
                                }
                              >
                                <FiX />
                              </button>
                            </>
                          )}

                          {notification.status === "SENT" && (
                            <button
                              type="button"
                              title="Statistics"
                              className="action-btn"
                              disabled={busyId === notification._id}
                              onClick={() => handleViewStats(notification)}
                            >
                              <FiBarChart2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredNotifications.length > 0 && (
            <div className="notifications-pagination">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filteredNotifications.length)} of{" "}
                {filteredNotifications.length}
              </span>

              <div>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <FiChevronLeft />
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={`pagination-number ${
                      page === pageNumber ? "active" : ""
                    }`}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  className="pagination-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="notification-stats-panel">
          <div className="stats-panel-header">
            <span className="section-kicker">Overview</span>
            <h2>Notification Stats</h2>
            <p>Live breakdown of your notification activity.</p>
          </div>

          <div className="donut-wrapper">
            <div className="notification-donut" style={donutStyle}>
              <div>
                <strong>{summary.total}</strong>
                <span>Total</span>
              </div>
            </div>
          </div>

          <div className="stats-legend">
            {dashboardStats.map((item) => (
              <div key={item.label}>
                <span>
                  <i className={`legend-dot ${item.className}`} />
                  {item.label}
                </span>

                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="view-detailed-stats"
            onClick={() => {
              const notification =
                notifications.find((item) => item.status === "SENT") ||
                notifications.find((item) => item.status === "SCHEDULED");

              if (notification) {
                handleViewStats(notification);
              } else {
                alert("There are no sent or scheduled notifications yet.");
              }
            }}
          >
            <FiBarChart2 />
            View Detailed Stats
          </button>
        </aside>
      </div>

      <div className="notifications-tips">
        <div className="tips-icon">
          <FiAlertCircle />
        </div>

        <div>
          <strong>Notification workflow</strong>
          <span>
            Save as draft, schedule for later, or send immediately to the
            selected audience.
          </span>
        </div>
      </div>

      {showCreate && (
        <div className="notification-modal-overlay" onClick={closeCreateModal}>
          <div
            className="notification-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-modal-header">
              <div>
                <small>
                  {editingNotification ? "EDIT DRAFT" : "NEW NOTIFICATION"}
                </small>

                <h2>
                  {editingNotification
                    ? "Edit Notification"
                    : "Create Notification"}
                </h2>

                <p>Create a notification for your selected audience.</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeCreateModal}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveDraft}>
              <div className="notification-field">
                <label>Notification Title</label>

                <input
                  type="text"
                  placeholder="Enter notification title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                />
              </div>

              <div className="notification-field">
                <label>Message</label>

                <textarea
                  placeholder="Enter notification message"
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  rows="5"
                />
              </div>

              <div className="notification-field">
                <label>Audience</label>

                <CustomSelect
                  fullWidth
                  value={audience}
                  onChange={setAudience}
                  options={[
                    { value: "ALL", label: "All Users" },
                    { value: "FREE", label: "Free Users" },
                    { value: "PREMIUM", label: "Premium Users" },
                    { value: "USER", label: "Specific User" },
                  ]}
                />
              </div>

              {audience === "USER" && (
                <div className="notification-field">
                  <label>User ID</label>

                  <input
                    type="text"
                    placeholder="Enter user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
              )}

              <div className="notification-modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeCreateModal}
                >
                  Cancel
                </button>

                <button type="submit" className="modal-save-btn">
                  {editingNotification ? "Save Changes" : "Save as Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {schedulingNotification && (
        <div
          className="notification-modal-overlay"
          onClick={() => setSchedulingNotification(null)}
        >
          <div
            className="notification-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-modal-header">
              <div>
                <small>SCHEDULE</small>
                <h2>Schedule Notification</h2>
                <p>Choose when this notification should be sent.</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSchedulingNotification(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="notification-preview">
              <FiBell />

              <div>
                <strong>{schedulingNotification.title}</strong>
                <span>{schedulingNotification.body}</span>
              </div>
            </div>

            <div className="notification-field">
              <label>Schedule Date & Time</label>

              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>

            <div className="notification-modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setSchedulingNotification(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-save-btn"
                disabled={busyId === schedulingNotification._id}
                onClick={handleSchedule}
              >
                <FiClock />
                {busyId === schedulingNotification._id
                  ? "Scheduling..."
                  : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {statsNotification && notificationStats && (
        <div className="notification-modal-overlay" onClick={handleCloseStats}>
          <div
            className="notification-modal stats-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-modal-header">
              <div>
                <small>DELIVERY REPORT</small>
                <h2>Notification Statistics</h2>
                <p>{statsNotification.title}</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseStats}
              >
                <FiX />
              </button>
            </div>

            <div className="notification-stats-grid">
              <div className="notification-stat-card">
                <span>Total</span>
                <strong>{notificationStats.total ?? 0}</strong>
              </div>

              <div className="notification-stat-card">
                <span>Pending</span>
                <strong>{notificationStats.pending ?? 0}</strong>
              </div>

              <div className="notification-stat-card">
                <span>Sent</span>
                <strong>{notificationStats.sent ?? 0}</strong>
              </div>

              <div className="notification-stat-card">
                <span>Delivered</span>
                <strong>{notificationStats.delivered ?? 0}</strong>
              </div>

              <div className="notification-stat-card">
                <span>Failed</span>
                <strong>{notificationStats.failed ?? 0}</strong>
              </div>
            </div>

            <div className="notification-modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={handleCloseStats}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedNotification && (
        <div
          className="notification-modal-overlay"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="notification-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-modal-header">
              <div>
                <small>NOTIFICATION</small>
                <h2>{selectedNotification.title}</h2>

                <p>
                  {getAudienceLabel(selectedNotification.audience)} •{" "}
                  {selectedNotification.status}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedNotification(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="notification-detail-message">
              {selectedNotification.body || "No message provided."}
            </div>

            <div className="notification-detail-grid">
              <div>
                <span>Created</span>
                <strong>{formatDate(selectedNotification.createdAt)}</strong>
              </div>

              <div>
                <span>Scheduled / Sent</span>

                <strong>
                  {formatDate(
                    selectedNotification.scheduledAt ||
                      selectedNotification.sentAt,
                  )}
                </strong>
              </div>
            </div>

            <div className="notification-modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
