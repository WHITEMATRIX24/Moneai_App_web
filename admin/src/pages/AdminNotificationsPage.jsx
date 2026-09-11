// src/pages/AdminNotificationsPage.jsx

import { useMemo, useState } from "react";
import { usePrimaryColor } from "../hooks/usePrimaryColor.js";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Mail,
  Megaphone,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Smartphone,
  Users,
  Download,
} from "lucide-react";

import { exportToPdf } from "../services/export.service.js";
import PageHeader from "../components/PageHeader.jsx";
import CustomSelect from "../components/CustomSelect.jsx";

const initialNotifications = [
  {
    id: 1,
    title: "Welcome to MONE AI",
    message: "Welcome notification sent to newly registered users.",
    audience: "All Users",
    channel: "In App",
    status: "Sent",
    createdAt: "Today, 10:24 AM",
  },
  {
    id: 2,
    title: "Subscription Reminder",
    message: "Reminder for users whose subscriptions are approaching renewal.",
    audience: "Subscribers",
    channel: "Email",
    status: "Draft",
    createdAt: "Today, 9:12 AM",
  },
  {
    id: 3,
    title: "Platform Maintenance",
    message: "Scheduled maintenance announcement for active platform users.",
    audience: "Active Users",
    channel: "In App",
    status: "Scheduled",
    createdAt: "Yesterday",
  },
  {
    id: 4,
    title: "New AI Usage Insights",
    message:
      "Notify premium users that new AI activity insights are now available.",
    audience: "Premium Users",
    channel: "Email",
    status: "Sent",
    createdAt: "Aug 15, 2026",
  },
];

const statusOptions = ["All", "Sent", "Scheduled", "Draft"];

function StatusBadge({ status }) {
  const map = {
    Sent: {
      background: "#e9f8ef",
      color: "#16884a",
      dot: "#16884a",
    },
    Scheduled: {
      background: "#fff3df",
      color: "#bf6800",
      dot: "#f39a22",
    },
    Draft: {
      background: "#eef1f5",
      color: "#627084",
      dot: "#8794a6",
    },
  };

  const style = map[status] || map.Draft;

  return (
    <span
      className={`admin-notif-status-badge status-${status.toLowerCase()}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 10px",
        borderRadius: 999,
        background: style.background,
        color: style.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <span
        className="admin-notif-status-dot"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: style.dot,
        }}
      />
      {status}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, helper }) {
  return (
    <article
      className="admin-notif-metric-card"
      style={{
        minHeight: 138,
        padding: 20,
        background: "#fff",
        border: "1px solid #eadfd3",
        borderRadius: 18,
        boxShadow: "0 10px 24px rgba(35, 42, 55, 0.05)",
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
      }}
    >
      <div>
        <div
          className="admin-notif-metric-label"
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#7f8fa3",
            marginBottom: 8,
          }}
        >
          {label}
        </div>

        <div
          className="admin-notif-metric-value"
          style={{
            fontSize: 31,
            lineHeight: 1,
            fontWeight: 900,
            color: "#2b3a52",
          }}
        >
          {value}
        </div>

        <div
          className="admin-notif-metric-helper"
          style={{
            marginTop: 10,
            fontSize: 12.5,
            color: "#8e9bad",
            lineHeight: 1.45,
          }}
        >
          {helper}
        </div>
      </div>

      <div
        className="admin-notif-metric-icon"
        style={{
          width: 45,
          height: 45,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "#fff0e4",
          color: "var(--primary-color, #ff6500)",
          flex: "0 0 auto",
        }}
      >
        <Icon size={21} />
      </div>
    </article>
  );
}

export default function AdminNotificationsPage() {
  const primaryColor = usePrimaryColor();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialNotifications.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        item.audience.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const sentCount = initialNotifications.filter(
    (item) => item.status === "Sent",
  ).length;

  const scheduledCount = initialNotifications.filter(
    (item) => item.status === "Scheduled",
  ).length;

  const draftCount = initialNotifications.filter(
    (item) => item.status === "Draft",
  ).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Create, schedule and monitor announcements, reminders and platform-wide messages."
        actions={
          <button
            type="button"
            className="admin-notif-new-btn"
            style={{
              minHeight: 44,
              padding: "0 18px",
              border: 0,
              borderRadius: 12,
              background: "var(--primary-color, #ff6500)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(var(--primary-color-rgb), 0.25)",
            }}
          >
            <Plus size={18} />
            New Notification
          </button>
        }
      />

      <div
        className="admin-notifications-page"
        style={{
          display: "grid",
          gap: 20,
        }}
      >

      {/* METRICS */}
      <section
        className="admin-notif-metrics-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        <MetricCard
          icon={Bell}
          label="Total Notifications"
          value={initialNotifications.length}
          helper="All platform communications"
        />

        <MetricCard
          icon={CheckCircle2}
          label="Sent"
          value={sentCount}
          helper="Delivered successfully"
        />

        <MetricCard
          icon={Clock3}
          label="Scheduled"
          value={scheduledCount}
          helper="Queued for future delivery"
        />

        <MetricCard
          icon={MessageSquareText}
          label="Drafts"
          value={draftCount}
          helper="Waiting for review"
        />
      </section>

      {/* LIST */}
      <section
        className="admin-notif-history-card"
        style={{
          background: "#fff",
          border: "1px solid #eadfd3",
          borderRadius: 20,
          boxShadow: "0 12px 30px rgba(42, 49, 62, 0.05)",
          overflow: "hidden",
        }}
      >
        <div
          className="admin-notif-history-header"
          style={{
            padding: "21px 22px",
            borderBottom: "1px solid #eee4da",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div>
              <h2
                className="admin-notif-history-title"
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#2b3a52",
                }}
              >
                Notification History
              </h2>

              <p
                className="admin-notif-history-subtitle"
                style={{
                  margin: "5px 0 0",
                  color: "#8a98a9",
                  fontSize: 13,
                }}
              >
                Review messages, audiences and delivery status.
              </p>
            </div>

            <label
              className="admin-notif-search-label"
              style={{
                width: "min(100%, 340px)",
                minHeight: 43,
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 13px",
                border: "1px solid #e2d8cc",
                borderRadius: 12,
                background: "#fffdf9",
              }}
            >
              <Search size={17} color="#8b98a8" />

              <input
                className="admin-notif-search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications..."
                style={{
                  width: "100%",
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  color: "#2b3a52",
                  fontSize: 13.5,
                }}
              />
            </label>
          </div>

          <div
            className="admin-notif-filter-group"
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted, #64748b)" }}>Status</span>
              <CustomSelect
                size="md"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "All", label: "All statuses" },
                  { value: "Sent", label: "Sent" },
                  { value: "Scheduled", label: "Scheduled" },
                  { value: "Draft", label: "Draft" },
                ]}
              />
            </div>

            <button
              type="button"
              className="export-btn"
              disabled={!filteredNotifications.length}
              onClick={() => {
                const rows = filteredNotifications.map((item) => ({
                  Title: item.title,
                  Message: item.message,
                  Audience: item.audience,
                  Channel: item.channel,
                  Status: item.status,
                  Created: item.createdAt,
                }));
                exportToPdf(
                  `notifications_${new Date().toISOString().slice(0, 10)}.pdf`,
                  "Notifications",
                  "Platform communications — announcements, reminders and broadcasts.",
                  rows
                );
              }}
              style={{ marginLeft: "auto" }}
            >
              <Download size={15} />
              Export PDF
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            className="admin-notif-table"
            style={{
              width: "100%",
              minWidth: 920,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                className="admin-notif-thead-tr"
                style={{
                  background: "#fffaf5",
                  borderBottom: "1px solid #eee4da",
                }}
              >
                {[
                  "Notification",
                  "Audience",
                  "Channel",
                  "Status",
                  "Created",
                  "",
                ].map((heading) => (
                  <th
                    key={heading || "actions"}
                    className="admin-notif-th"
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "#8c98a8",
                      fontSize: 11.5,
                      fontWeight: 900,
                      letterSpacing: ".05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredNotifications.map((item) => (
                <tr
                  key={item.id}
                  className="admin-notif-tr"
                  style={{
                    borderBottom: "1px solid #f0e8df",
                  }}
                >
                  <td style={{ padding: "17px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        className="admin-notif-bell-icon"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 11,
                          display: "grid",
                          placeItems: "center",
                          background: "#fff0e4",
                          color: primaryColor,
                          flex: "0 0 auto",
                        }}
                      >
                        <Bell size={17} />
                      </div>

                      <div>
                        <strong
                          className="admin-notif-row-title"
                          style={{
                            display: "block",
                            color: "#2b3a52",
                            fontSize: 14,
                            fontWeight: 900,
                          }}
                        >
                          {item.title}
                        </strong>

                        <span
                          className="admin-notif-row-desc"
                          style={{
                            display: "block",
                            marginTop: 4,
                            maxWidth: 440,
                            color: "#8190a2",
                            fontSize: 12.5,
                            lineHeight: 1.5,
                          }}
                        >
                          {item.message}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td
                    className="admin-notif-audience-cell"
                    style={{
                      padding: "17px 16px",
                      color: "#526178",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <Users size={15} />
                      {item.audience}
                    </span>
                  </td>

                  <td
                    className="admin-notif-channel-cell"
                    style={{
                      padding: "17px 16px",
                      color: "#526178",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      {item.channel === "Email" ? (
                        <Mail size={15} />
                      ) : (
                        <Smartphone size={15} />
                      )}
                      {item.channel}
                    </span>
                  </td>

                  <td style={{ padding: "17px 16px" }}>
                    <StatusBadge status={item.status} />
                  </td>

                  <td
                    className="admin-notif-date-cell"
                    style={{
                      padding: "17px 16px",
                      color: "#8190a2",
                      fontSize: 12.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.createdAt}
                  </td>

                  <td
                    style={{
                      padding: "17px 16px",
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <button
                        type="button"
                        className="admin-notif-action-btn admin-notif-view-btn"
                        style={{
                          minHeight: 35,
                          padding: "0 11px",
                          border: "1px solid #e1d7cb",
                          borderRadius: 9,
                          background: "#fff",
                          color: "#42516a",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Send size={14} />
                        View
                      </button>

                      <button
                        type="button"
                        aria-label="More actions"
                        className="admin-notif-action-btn admin-notif-more-btn"
                        style={{
                          width: 35,
                          height: 35,
                          border: "1px solid #e1d7cb",
                          borderRadius: 9,
                          background: "#fff",
                          color: "#778598",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredNotifications.length && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 44,
                      textAlign: "center",
                      color: "#8a98a9",
                      fontSize: 14,
                    }}
                  >
                    No notifications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </>
  );
}
