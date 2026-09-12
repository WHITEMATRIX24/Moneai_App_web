import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../services/admin.service.js";
import "./UserDevicesPage.css";

import {
  FaArrowLeft,
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaSignOutAlt,
  FaSyncAlt,
} from "react-icons/fa";

import PageHeader from "../components/PageHeader.jsx";

export default function UserDevicesPage() {
  const { id, userId } = useParams();
  const currentUserId = userId || id;
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewFilter, setViewFilter] = useState("ACTIVE"); // "ACTIVE" | "ALL"

  async function loadDevices() {
    try {
      setLoading(true);
      setErrorMessage("");
      if (typeof adminService.getUserDevices === "function" && currentUserId) {
        const r = await adminService.getUserDevices(currentUserId);
        if (Array.isArray(r?.data)) {
          setDevices(r.data);
          return;
        }
      }
      setDevices([]);
    } catch (err) {
      console.error("Failed to load user devices:", err);
      setErrorMessage("Failed to load devices and sessions for this user.");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
  }, [currentUserId]);

  // ---------------------------------------
  // REVOKE DEVICE SESSION
  // ---------------------------------------
  async function revokeDevice(deviceId) {
    const confirmRevoke = window.confirm(
      "Are you sure you want to revoke this device? The user will be logged out on this device."
    );
    if (!confirmRevoke) return;

    try {
      setRevokingId(deviceId);
      await adminService.revokeUserDevice(currentUserId, deviceId);
      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId
            ? { ...device, status: "Revoked", activeSessionCount: 0 }
            : device
        )
      );
    } catch (err) {
      console.error("Failed to revoke device session:", err);
      alert(
        err.response?.data?.message ||
          "Failed to revoke device session. Please try again."
      );
    } finally {
      setRevokingId(null);
    }
  }

  function DeviceIcon({ type }) {
    if (type === "mobile") {
      return <FaMobileAlt />;
    }
    if (type === "tablet") {
      return <FaTabletAlt />;
    }
    return <FaDesktop />;
  }

  function getStatusBadgeClass(status) {
    if (!status) return "status-inactive";
    const s = String(status).toLowerCase();
    if (s === "active") return "status-active";
    if (s === "revoked" || s === "blocked") return "status-inactive";
    return "status-inactive";
  }

  const activeDevices = devices.filter((d) => d.status === "Active");
  const displayedDevices = viewFilter === "ACTIVE" ? activeDevices : devices;

  return (
    <>
      <PageHeader
        title="User Devices & Sessions"
        subtitle="Distinct devices and live login sessions"
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
          onClick={loadDevices}
          disabled={loading}
        >
          <FaSyncAlt />
          Refresh
        </button>
      </div>

      {/* FILTER TABS */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setViewFilter("ACTIVE")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 600,
            border:
              viewFilter === "ACTIVE"
                ? "1px solid var(--primary-color, #ff5722)"
                : "1px solid #e5e5e5",
            background:
              viewFilter === "ACTIVE"
                ? "var(--primary-bg-soft, #fff5f2)"
                : "white",
            color:
              viewFilter === "ACTIVE"
                ? "var(--primary-color, #ff5722)"
                : "#555",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Active Devices ({activeDevices.length})
        </button>

        <button
          type="button"
          onClick={() => setViewFilter("ALL")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 600,
            border:
              viewFilter === "ALL"
                ? "1px solid var(--primary-color, #ff5722)"
                : "1px solid #e5e5e5",
            background:
              viewFilter === "ALL"
                ? "var(--primary-bg-soft, #fff5f2)"
                : "white",
            color:
              viewFilter === "ALL"
                ? "var(--primary-color, #ff5722)"
                : "#555",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          All Devices & History ({devices.length})
        </button>
      </div>

      {errorMessage && (
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
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "white",
            borderRadius: 14,
            border: "1px solid #e5e5e5",
          }}
        >
          <p style={{ color: "#666", fontSize: "15px" }}>Loading devices...</p>
        </div>
      ) : displayedDevices.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "white",
            borderRadius: 14,
            border: "1px solid #e5e5e5",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--primary-bg-soft, #fff5f2)",
              color: "var(--primary-color, #ff5722)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 24,
            }}
          >
            <FaDesktop />
          </div>
          <h3 style={{ margin: "0 0 8px", color: "#273952", fontSize: "18px" }}>
            {viewFilter === "ACTIVE"
              ? "No Active Devices"
              : "No Devices or Sessions Recorded"}
          </h3>
          <p style={{ margin: 0, color: "#777", fontSize: "14px" }}>
            {viewFilter === "ACTIVE"
              ? "All previous sessions on this user's devices are currently logged out or revoked."
              : "There are no login records for this user."}
          </p>
        </div>
      ) : (
        <div className="devices-grid">
          {displayedDevices.map((device) => {
            const isActive = device.status === "Active";
            const isRevoking = revokingId === device.id;

            return (
              <div className="device-card" key={device.id}>
                <div className="device-top">
                  <div className="device-icon">
                    <DeviceIcon type={device.type} />
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {device.isCurrent && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          background: "var(--primary-bg-soft, #fff5f2)",
                          color: "var(--primary-color, #ff5722)",
                        }}
                      >
                        Current
                      </span>
                    )}

                    <span className={`status-badge ${getStatusBadgeClass(device.status)}`}>
                      <span className="status-dot"></span>
                      {device.status}
                    </span>
                  </div>
                </div>

                <h3>{device.device || "Web Session"}</h3>

                <div className="device-info">
                  <p>
                    <strong>Browser:</strong> {device.browser || "Browser"}
                  </p>

                  <p>
                    <strong>Operating System:</strong> {device.os || "Unknown"}
                  </p>

                  <p>
                    <strong>IP Address:</strong> {device.ip || "127.0.0.1"}
                  </p>

                  <p>
                    <strong>Location:</strong> {device.location || "Verified"}
                  </p>

                  <p>
                    <strong>Last Active:</strong> {device.lastActive}
                  </p>
                </div>

                {isActive && (
                  <button
                    className="revoke-btn"
                    onClick={() => revokeDevice(device.id)}
                    disabled={isRevoking}
                  >
                    <FaSignOutAlt />
                    {isRevoking ? "Revoking..." : "Revoke Device"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}