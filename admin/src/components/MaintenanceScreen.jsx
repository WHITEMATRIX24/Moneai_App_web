// src/components/MaintenanceScreen.jsx

import React from "react";
import { Wrench, Shield, LogOut, ArrowRight, RefreshCw } from "lucide-react";
import { logout } from "../services/auth.service.js";
import "./MaintenanceScreen.css";

export default function MaintenanceScreen({
  message = "MONE AI is currently undergoing scheduled maintenance. Please try again later.",
  onRetry,
}) {
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const handleAdminLogin = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="maintenance-screen-overlay">
      <div className="maintenance-card">
        <div className="maintenance-icon-halo">
          <Wrench size={38} className="maintenance-icon" />
        </div>

        <span className="maintenance-badge">
          <span className="maintenance-pulsing-dot" /> System Maintenance
        </span>

        <h1 className="maintenance-title">Platform Under Maintenance</h1>

        <p className="maintenance-message">{message}</p>

        <div className="maintenance-notice-box">
          <Shield size={16} />
          <span>
            Security protocols and platform upgrades are currently in progress. All user data is fully secured.
          </span>
        </div>

        <div className="maintenance-actions">
          {onRetry && (
            <button
              type="button"
              className="maintenance-btn btn-retry"
              onClick={onRetry}
            >
              <RefreshCw size={16} />
              <span>Check Status</span>
            </button>
          )}

          <button
            type="button"
            className="maintenance-btn btn-outline"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            className="maintenance-btn btn-admin"
            onClick={handleAdminLogin}
          >
            <span>Admin Portal</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
