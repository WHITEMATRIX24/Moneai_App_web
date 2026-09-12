import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../services/admin.service.js";
import "./UserActivityPage.css";

import {
  FaArrowLeft,
  FaSignInAlt,
  FaMobileAlt,
  FaRobot,
  FaMoneyBillWave,
  FaCheckCircle,
  FaHeartbeat,
  FaPills,
  FaUserShield,
  FaSyncAlt,
  FaHistory,
} from "react-icons/fa";

import PageHeader from "../components/PageHeader.jsx";

const CATEGORIES = [
  { id: "ALL", label: "All Activities" },
  { id: "login", label: "Logins & Sessions" },
  { id: "ai", label: "AI Assistant" },
  { id: "finance", label: "Finance" },
  { id: "task_health", label: "Tasks & Health" },
  { id: "account", label: "Account & Admin" },
];

export default function UserActivityPage() {
  const { userId, id } = useParams();
  const currentUserId = userId || id;
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  async function loadActivity() {
    try {
      setLoading(true);
      setError("");

      if (typeof adminService.getUserActivity === "function" && currentUserId) {
        const response = await adminService.getUserActivity(currentUserId);
        const data = response.data;
        if (Array.isArray(data?.activities)) {
          setActivities(data.activities);
          if (data.userName) setUserName(data.userName);
          return;
        }
      }
      setActivities([]);
    } catch (err) {
      console.error("Failed to load user activity:", err);
      setError("Failed to load activity logs for this user.");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, [currentUserId]);

  function ActivityIcon({ type }) {
    switch (type) {
      case "login":
        return <FaSignInAlt />;
      case "device":
        return <FaMobileAlt />;
      case "ai":
        return <FaRobot />;
      case "finance":
        return <FaMoneyBillWave />;
      case "todo":
        return <FaCheckCircle />;
      case "health":
        return <FaHeartbeat />;
      case "medicine":
        return <FaPills />;
      case "account":
      default:
        return <FaUserShield />;
    }
  }

  function getActivityBadgeColor(type) {
    switch (type) {
      case "login":
        return { bg: "rgba(59, 130, 246, 0.1)", text: "#2563eb" };
      case "device":
        return { bg: "rgba(168, 85, 247, 0.1)", text: "#9333ea" };
      case "ai":
        return { bg: "rgba(249, 115, 22, 0.1)", text: "#ea580c" };
      case "finance":
        return { bg: "rgba(16, 185, 129, 0.1)", text: "#059669" };
      case "todo":
        return { bg: "rgba(14, 165, 233, 0.1)", text: "#0284c7" };
      case "health":
      case "medicine":
        return { bg: "rgba(236, 72, 153, 0.1)", text: "#db2777" };
      case "account":
      default:
        return { bg: "rgba(107, 114, 128, 0.1)", text: "#4b5563" };
    }
  }

  const filteredActivities = activities.filter((act) => {
    if (activeCategory === "ALL") return true;
    if (activeCategory === "login") return act.type === "login" || act.type === "device";
    if (activeCategory === "ai") return act.type === "ai";
    if (activeCategory === "finance") return act.type === "finance";
    if (activeCategory === "task_health")
      return act.type === "todo" || act.type === "health" || act.type === "medicine";
    if (activeCategory === "account") return act.type === "account";
    return true;
  });

  return (
    <>
      <PageHeader
        title={userName ? `Activity — ${userName}` : "User Activity"}
        subtitle="Real-time timeline of user actions, sessions, and system interactions"
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <button
          className="back-btn"
          style={{ marginBottom: 0 }}
          onClick={() => navigate(`/admin/users/${currentUserId}`)}
        >
          <FaArrowLeft />
          Back to User Details
        </button>

        <button
          className="back-btn"
          style={{ marginBottom: 0 }}
          onClick={loadActivity}
          disabled={loading}
        >
          <FaSyncAlt />
          Refresh Timeline
        </button>
      </div>

      {/* FILTER PILLS */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 500,
              border:
                activeCategory === cat.id
                  ? "1px solid var(--primary-color, #ff5722)"
                  : "1px solid #e5e5e5",
              background:
                activeCategory === cat.id
                  ? "var(--primary-bg-soft, #fff5f2)"
                  : "white",
              color:
                activeCategory === cat.id
                  ? "var(--primary-color, #ff5722)"
                  : "#555",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 20,
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.1)",
            color: "#dc2626",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div className="card activity-card">
        {loading ? (
          <div style={{ padding: "50px 20px", textAlign: "center" }}>
            <p style={{ color: "#777", fontSize: "15px" }}>Loading real-time user activity...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={{ padding: "50px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--primary-bg-soft, #fff5f2)",
                color: "var(--primary-color, #ff5722)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 22,
              }}
            >
              <FaHistory />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#273952", fontSize: "17px" }}>
              No Activity Recorded
            </h3>
            <p style={{ margin: 0, color: "#777", fontSize: "14px" }}>
              {activeCategory === "ALL"
                ? "No activities or events have been logged for this user yet."
                : "No activities matching this category filter."}
            </p>
          </div>
        ) : (
          <div className="activity-timeline">
            {filteredActivities.map((activity) => {
              const badgeStyle = getActivityBadgeColor(activity.type);

              return (
                <div className="activity-item" key={activity.id}>
                  <div className="activity-icon">
                    <ActivityIcon type={activity.type} />
                  </div>

                  <div className="activity-content" style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <h3 style={{ margin: 0 }}>{activity.title}</h3>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: badgeStyle.bg,
                          color: badgeStyle.text,
                          textTransform: "uppercase",
                        }}
                      >
                        {activity.type}
                      </span>
                    </div>

                    <p style={{ margin: "0 0 6px", color: "#555" }}>
                      {activity.description}
                    </p>

                    <span style={{ fontSize: "12px", color: "#888" }}>
                      {activity.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}