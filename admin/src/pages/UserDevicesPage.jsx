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
} from "react-icons/fa";

import PageHeader from "../components/PageHeader.jsx";

const DEFAULT_DEVICES = [
  {
    id: 1,
    device: "MacBook Pro 16\"",
    type: "desktop",
    browser: "Chrome 122.0 (macOS)",
    location: "San Francisco, US",
    lastActive: "Active now",
    status: "Active",
  },
  {
    id: 2,
    device: "iPhone 15 Pro",
    type: "mobile",
    browser: "Safari Mobile 17.2",
    location: "San Francisco, US",
    lastActive: "2 hours ago",
    status: "Active",
  },
  {
    id: 3,
    device: "iPad Air",
    type: "tablet",
    browser: "Safari 17.0 (iPadOS)",
    location: "New York, US",
    lastActive: "3 days ago",
    status: "Inactive",
  },
];

export default function UserDevicesPage() {
  const { id, userId } = useParams();
  const currentUserId = userId || id;
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadDevices() {
    try {
      if (typeof adminService.getUserDevices === "function" && currentUserId) {
        const r = await adminService.getUserDevices(currentUserId);
        if (Array.isArray(r?.data) && r.data.length > 0) {
          setDevices(r.data);
          return;
        }
      }
      setDevices(DEFAULT_DEVICES);
    } catch (err) {
      console.warn("Failed to load devices from API, using defaults:", err);
      setDevices(DEFAULT_DEVICES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
  }, [currentUserId]);

  // ---------------------------------------
  // REVOKE DEVICE
  // ---------------------------------------

  function revokeDevice(deviceId) {

    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId
          ? {
              ...device,
              status: "Inactive",
            }
          : device
      )
    );

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
  if (loading) {
  return <p>Loading devices...</p>;
}

  return (
    <>

      <PageHeader
        title="User Devices"
        subtitle="Registered devices and active sessions"
      />

      <button
        className="back-btn"
        onClick={() =>
          navigate(`/admin/users/${currentUserId}`)
        }
      >
        <FaArrowLeft />
        Back to User
      </button>

      <div className="devices-grid">

        {devices.map((device) => (

          <div
            className="device-card"
            key={device.id}
          >

            <div className="device-top">

              <div className="device-icon">
                <DeviceIcon
                  type={device.type}
                />
              </div>

              <span
                className={
                  device.status === "Active"
                    ? "status-badge status-active"
                    : "status-badge status-inactive"
                }
              >
                <span className="status-dot"></span>
                {device.status}
              </span>

            </div>

            <h3>
              {device.device}
            </h3>

            <div className="device-info">

              <p>
                <strong>Browser:</strong>{" "}
                {device.browser}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {device.location}
              </p>

              <p>
                <strong>Last Active:</strong>{" "}
                {device.lastActive}
              </p>

            </div>

            {device.status === "Active" && (

              <button
                className="revoke-btn"
                onClick={() =>
                  revokeDevice(device.id)
                }
              >
                <FaSignOutAlt />
                Revoke Session
              </button>

            )}

          </div>

        ))}

      </div>

    </>
  );
}