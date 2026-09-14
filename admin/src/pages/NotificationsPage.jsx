import { useEffect, useMemo, useState } from "react";
import { usePrimaryColor } from "../hooks/usePrimaryColor.js";
import {
  FiBell,
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiInbox,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";

import api from "../services/api.js";
import PageHeader from "../components/PageHeader.jsx";
import "./NotificationsPage.css";

const PAGE_SIZE = 8;

export default function NotificationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [page, setPage] = useState(1);

  const primaryColor = usePrimaryColor();

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

  const fetchNotifications = async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);

      const response = await api.get("/notifications");
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.patch("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error("Mark all read error:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleToggleRead = async (notification, e) => {
    if (e) e.stopPropagation();
    const nextRead = !notification.isRead;

    try {
      setBusyId(notification._id);
      await api.patch(`/notifications/${notification._id}/read`, {
        read: nextRead,
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, isRead: nextRead } : n
        )
      );

      if (selectedNotification?._id === notification._id) {
        setSelectedNotification((prev) => ({ ...prev, isRead: nextRead }));
      }
    } catch (error) {
      console.error("Toggle read error:", error);
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenNotification = async (notification) => {
    setSelectedNotification(notification);

    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification._id}/read`, {
          read: true,
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error("Auto mark read error:", error);
      }
    }
  };

  const summary = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const read = notifications.filter((n) => n.isRead).length;

    return { total, unread, read };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const q = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const title = (notification.title || "").toLowerCase();
      const body = (notification.body || "").toLowerCase();

      const matchesSearch = !q || title.includes(q) || body.includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unread" && !notification.isRead) ||
        (statusFilter === "read" && notification.isRead);

      return matchesSearch && matchesStatus;
    });
  }, [notifications, search, statusFilter]);

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

  const totalCount = summary.total || 1;
  const unreadPercent =
    summary.total === 0 ? 0 : Math.round((summary.unread / totalCount) * 100);
  const readPercent = 100 - unreadPercent;

  const donutStyle =
    summary.total === 0
      ? { background: "#efe5d9" }
      : {
          background: `conic-gradient(
            ${primaryColor} 0% ${unreadPercent}%,
            #3b4861 ${unreadPercent}% 100%
          )`,
        };

  return (
    <div className="notifications-page">
      <PageHeader
        title="Notifications"
        subtitle="View and manage all announcements, alerts, and system updates received by your account."
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fetchNotifications(true)}
              disabled={refreshing || loading}
            >
              <FiRefreshCw className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>

            {summary.unread > 0 && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                <FiCheck />
                {markingAll ? "Marking..." : "Mark all as read"}
              </button>
            )}
          </div>
        }
      />

      <div className="notification-summary-grid">
        <button
          type="button"
          className={`summary-card ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="summary-icon total">
            <FiInbox />
          </div>

          <div>
            <span>Total Received</span>
            <strong>{summary.total}</strong>
            <small>All notifications</small>
          </div>
        </button>

        <button
          type="button"
          className={`summary-card ${statusFilter === "unread" ? "active" : ""}`}
          onClick={() => setStatusFilter("unread")}
        >
          <div className="summary-icon sent">
            <FiAlertCircle />
          </div>

          <div>
            <span>Unread</span>
            <strong>{summary.unread}</strong>
            <small>Requires attention</small>
          </div>
        </button>

        <button
          type="button"
          className={`summary-card ${statusFilter === "read" ? "active" : ""}`}
          onClick={() => setStatusFilter("read")}
        >
          <div className="summary-icon draft">
            <FiCheckCircle />
          </div>

          <div>
            <span>Read</span>
            <strong>{summary.read}</strong>
            <small>Already reviewed</small>
          </div>
        </button>
      </div>

      <div className="notification-tabs">
        <button
          type="button"
          className={`notification-tab ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          All
          <span>{summary.total}</span>
        </button>

        <button
          type="button"
          className={`notification-tab ${statusFilter === "unread" ? "active" : ""}`}
          onClick={() => setStatusFilter("unread")}
        >
          Unread
          <span>{summary.unread}</span>
        </button>

        <button
          type="button"
          className={`notification-tab ${statusFilter === "read" ? "active" : ""}`}
          onClick={() => setStatusFilter("read")}
        >
          Read
          <span>{summary.read}</span>
        </button>
      </div>

      <div className="notifications-content-grid">
        <section className="notifications-card">
          <div className="notifications-toolbar">
            <div className="notification-search">
              <FiSearch />

              <input
                type="text"
                placeholder="Search received notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch("")}
                >
                  <FiX />
                </button>
              )}
            </div>

            {(search || statusFilter !== "all") && (
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
            )}
          </div>

          <div className="notifications-card-header">
            <div>
              <span className="section-kicker">INBOX</span>
              <h2>Received Notifications</h2>
              <p>
                {filteredNotifications.length} notification
                {filteredNotifications.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="history-icon">
              <FiBell />
            </div>
          </div>

          <div className="notifications-table-wrapper">
            <table className="notifications-table">
              <thead>
                <tr>
                  <th>Notification</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedNotifications.map((notification) => (
                  <tr
                    key={notification._id}
                    onClick={() => handleOpenNotification(notification)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="notification-name">
                        <div
                          className="notification-icon"
                          style={
                            !notification.isRead
                              ? {
                                  borderColor: "var(--primary-color, #ff6500)",
                                  boxShadow:
                                    "0 0 8px rgba(var(--primary-color-rgb), 0.3)",
                                }
                              : {}
                          }
                        >
                          <FiBell />
                        </div>

                        <div className="notification-copy">
                          <strong
                            style={
                              !notification.isRead
                                ? { fontWeight: 800 }
                                : { opacity: 0.8 }
                            }
                          >
                            {notification.title || "Untitled Notification"}
                          </strong>
                          <span>
                            {notification.body || "No message content"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{formatDate(notification.createdAt)}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          notification.isRead
                            ? "status-read"
                            : "status-unread"
                        }`}
                      >
                        <i />
                        {notification.isRead ? "Read" : "Unread"}
                      </span>
                    </td>

                    <td>
                      <div
                        className="notification-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="table-action-btn"
                          title="View Message"
                          onClick={() => handleOpenNotification(notification)}
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          className="table-action-btn"
                          title={
                            notification.isRead
                              ? "Mark as unread"
                              : "Mark as read"
                          }
                          disabled={busyId === notification._id}
                          onClick={(e) => handleToggleRead(notification, e)}
                        >
                          <FiCheckCircle
                            style={
                              notification.isRead
                                ? { opacity: 0.4 }
                                : {
                                    color: "var(--primary-color, #ff6500)",
                                  }
                            }
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedNotifications.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: "center", padding: "48px 20px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "10px",
                          color: "var(--nt-muted)",
                        }}
                      >
                        <FiBell size={32} style={{ opacity: 0.4 }} />
                        <strong
                          style={{
                            fontSize: "14px",
                            color: "var(--nt-text)",
                          }}
                        >
                          {search
                            ? "No matching notifications"
                            : "No notifications found"}
                        </strong>
                        <span style={{ fontSize: "12px" }}>
                          {search
                            ? "Try adjusting your search query or status filter."
                            : "You're all caught up! New updates and alerts will appear here."}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-pagination">
            <span>
              Showing {paginatedNotifications.length} of{" "}
              {filteredNotifications.length}
            </span>

            <div className="pagination-controls">
              <button
                type="button"
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <FiChevronLeft />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`page-btn ${page === pageNum ? "active" : ""}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ),
              )}

              <button
                type="button"
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </section>

        <aside className="notification-stats-panel">
          <div className="stats-panel-header">
            <div>
              <span className="section-kicker">OVERVIEW</span>
              <h2>Inbox Overview</h2>
              <p>Breakdown of your received notifications.</p>
            </div>
          </div>

          <div className="stats-donut-wrap">
            <div className="notification-donut" style={donutStyle}>
              <div className="donut-center">
                <strong>{summary.total}</strong>
                <span>Total</span>
              </div>
            </div>
          </div>

          <div className="notification-legend">
            <div className="legend-item">
              <span
                className="legend-dot"
                style={{ background: primaryColor }}
              />
              <span>Unread</span>
              <strong>{summary.unread}</strong>
            </div>

            <div className="legend-item">
              <span className="legend-dot" style={{ background: "#3b4861" }} />
              <span>Read</span>
              <strong>{summary.read}</strong>
            </div>
          </div>

          {summary.unread > 0 && (
            <button
              type="button"
              className="view-detailed-stats"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              <FiCheck />
              {markingAll ? "Marking all..." : "Mark All as Read"}
            </button>
          )}

          <div className="notifications-tips">
            <div className="tips-icon">
              <FiInfo />
            </div>
            <div>
              <strong>Personal Inbox</strong>
              <span>
                All updates, announcements, and alerts sent to your account or subscription plan appear here.
              </span>
            </div>
          </div>
        </aside>
      </div>

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
                <h2>{selectedNotification.title || "Notification"}</h2>
                <p>Received {formatDate(selectedNotification.createdAt)}</p>
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
              {selectedNotification.body || "No message content."}
            </div>

            <div className="notification-detail-grid">
              <div>
                <span>Received At</span>
                <strong>{formatDate(selectedNotification.createdAt)}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {selectedNotification.isRead ? "Read" : "Unread"}
                </strong>
              </div>
            </div>

            <div className="notification-modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={(e) => handleToggleRead(selectedNotification, e)}
              >
                {selectedNotification.isRead
                  ? "Mark as Unread"
                  : "Mark as Read"}
              </button>

              <button
                type="button"
                className="modal-save-btn"
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
