import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Monitor,
  Activity,
  ShieldCheck,
  Crown,
} from "lucide-react";

import { adminService } from "../services/admin.service.js";
import PageHeader from "../components/PageHeader.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import "./UserDetailsPage.css";

export default function UserDetailsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);

      const response = await adminService.users();

      const users = response.data?.users || [];

      console.log("USER ID FROM URL:", userId);
      console.log("USERS ARRAY:", users);

      const selectedUser = users.find(
        (item) => String(item._id) === String(userId)
      );

      console.log("SELECTED USER:", selectedUser);

      if (!selectedUser) {
        console.error("User not found:", userId);
        setUser(null);
        return;
      }

      setUser(selectedUser);
    } catch (error) {
      console.error("Failed to load user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  const handleChangeStatus = async () => {
  try {
    setSavingStatus(true);

    await adminService.updateUserStatus(
      user._id,
      selectedStatus
    );

    setUser((prev) => ({
      ...prev,
      status: selectedStatus,
    }));

    setShowStatusModal(false);
  } catch (error) {
    console.error("Failed to update status:", error);
    alert("Failed to update user status.");
  } finally {
    setSavingStatus(false);
  }
};

  const handleChangePlan = async () => {
    try {
      setSavingPlan(true);

      const nextPlan = String(selectedPlan).toUpperCase();
      await adminService.updateUserPlan(
        user._id,
        nextPlan
      );

      setUser((prev) => ({
        ...prev,
        subscriptionPlan: nextPlan,
      }));

      setShowPlanModal(false);
    } catch (error) {
      console.error("Failed to update plan:", error);
      alert("Failed to update user subscription plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="user-details-page">
        <div className="user-details-header">
          <h1>User Details</h1>
          <p>View and manage user account.</p>
        </div>

        <div className="user-details-card">
          <div className="user-details-loading">
            <div className="user-details-spinner"></div>
            Loading user...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-details-page">
        <div className="user-details-header">
          <h1>User Details</h1>
          <p>View and manage user account.</p>
        </div>

        <div className="user-details-card">
          <div className="user-details-error">
            <h2>User not available</h2>
            <p>Unable to load this user.</p>

            <button onClick={() => navigate("/admin/users")}>
              <ArrowLeft size={14} />
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "user-status-active";

      case "SUSPENDED":
        return "user-status-suspended";

      case "BLOCKED":
        return "user-status-blocked";

      default:
        return "";
    }
  };

  return (
    <div className="user-details-page">
      {/* HEADER */}

      <PageHeader
        title="User Details"
        subtitle="View and manage user account."
        actions={
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/admin/users")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 10,
              border: "1px solid var(--line, #e2d8cc)",
              background: "var(--panel, #fff)",
              color: "var(--text, #2b3a52)",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} />
            Back to Users
          </button>
        }
      />

      {/* USER CARD */}

      <div className="user-details-card">

        {/* PROFILE HEADER */}

        <div className="user-profile-header">
          <div className="user-profile-avatar">
            {getInitial(user.name)}
          </div>

          <div className="user-profile-info">
            <h2>{user.name || "Unknown User"}</h2>

            <p>{user.email || "No email available"}</p>

            <div className="user-badges">
              <span
                className={`user-status-badge ${getStatusClass(
                  user.status
                )}`}
              >
                ● {user.status || "UNKNOWN"}
              </span>

              <span className="user-plan-badge">
                {user.subscriptionPlan || "Free"}
              </span>
            </div>
          </div>
        </div>

        {/* PROFILE INFORMATION */}

        <div className="user-info-section">
          <h3>Profile Information</h3>

          <div className="user-info-grid">

            <div className="user-info-item">
              <span className="user-info-label">Full Name</span>
              <span className="user-info-value">
                {user.name || "Not provided"}
              </span>
            </div>

            <div className="user-info-item">
              <span className="user-info-label">Email</span>
              <span className="user-info-value">
                {user.email || "Not provided"}
              </span>
            </div>

            <div className="user-info-item">
              <span className="user-info-label">Phone</span>
              <span className="user-info-value">
                {user.phone || "Not provided"}
              </span>
            </div>

            <div className="user-info-item">
              <span className="user-info-label">Subscription Plan</span>
              <span className="user-info-value">
                {user.subscriptionPlan || "Free"}
              </span>
            </div>

            <div className="user-info-item">
              <span className="user-info-label">Status</span>
              <span className="user-info-value">
                {user.status || "Unknown"}
              </span>
            </div>

            <div className="user-info-item">
              <span className="user-info-label">Timezone</span>
              <span className="user-info-value">
                {user.timezone || "Not provided"}
              </span>
            </div>

            <div className="user-info-item">
              <span className="user-info-label">Created</span>
              <span className="user-info-value">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "Not available"}
              </span>
            </div>

            <div className="user-info-item">
              <span className="user-info-label">Last Login</span>
              <span className="user-info-value">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "Never"}
              </span>
            </div>

          </div>
        </div>

        {/* ACCOUNT ACTIONS */}

        <div className="user-actions-section">
          <h3>Account Actions</h3>

          <div className="user-actions">

            {/* DEVICES */}

            <button
              type="button"
              className="user-action-card"
              onClick={() =>
                navigate(`/admin/users/${user._id}/devices`)
              }
            >
              <div className="user-action-icon">
                <Monitor size={18} />
              </div>

              <div className="user-action-content">
                <span className="user-action-title">
                  View Devices
                </span>

                <span className="user-action-description">
                  View registered devices and sessions
                </span>
              </div>

              <span className="user-action-arrow">→</span>
            </button>

            {/* ACTIVITY */}

            <button
              type="button"
              className="user-action-card"
              onClick={() =>
                navigate(`/admin/users/${user._id}/activity`)
              }
            >
              <div className="user-action-icon">
                <Activity size={18} />
              </div>

              <div className="user-action-content">
                <span className="user-action-title">
                  View Activity
                </span>

                <span className="user-action-description">
                  View user's activity and history
                </span>
              </div>

              <span className="user-action-arrow">→</span>
            </button>

            {/* CHANGE STATUS */}

            <button
  type="button"
  className="user-action-card"
  onClick={() => {
    setSelectedStatus(user.status);
    setShowStatusModal(true);
  }}
>
  <div className="user-action-icon">
    <ShieldCheck size={18} />
  </div>

  <div className="user-action-content">
    <span className="user-action-title">
      Change Status
    </span>

    <span className="user-action-description">
      Activate, suspend or block this user
    </span>
  </div>

  <span className="user-action-arrow">→</span>
</button>

            {/* CHANGE PLAN */}

            <button
  type="button"
  className="user-action-card"
  onClick={() => {
    setSelectedPlan(user.subscriptionPlan ? user.subscriptionPlan.toUpperCase() : "FREE");
    setShowPlanModal(true);
  }}
>
  <div className="user-action-icon">
    <Crown size={18} />
  </div>

  <div className="user-action-content">
    <span className="user-action-title">
      Change Plan
    </span>

    <span className="user-action-description">
      Upgrade or downgrade subscription plan
    </span>
  </div>

  <span className="user-action-arrow">→</span>
</button>

          </div>
        </div>
      </div>

      {/* BACK */}

      <button
        type="button"
        className="user-details-back"
        onClick={() => navigate("/admin/users")}
      >
        <ArrowLeft size={14} />
        Back to Users
      </button>
      {showStatusModal && (
  <div
    className="user-modal-overlay"
    onClick={() => setShowStatusModal(false)}
  >
    <div
      className="user-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <h3>Change User Status</h3>

      <p>
        Select the new status for{" "}
        <strong>{user.name}</strong>.
      </p>

      <div style={{ margin: "16px 0" }}>
        <CustomSelect
          fullWidth
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "SUSPENDED", label: "Suspended" },
            { value: "BLOCKED", label: "Blocked" },
          ]}
        />
      </div>

      <div className="user-modal-buttons">
        <button
          type="button"
          className="user-modal-cancel"
          onClick={() => setShowStatusModal(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="user-modal-confirm"
          onClick={handleChangeStatus}
          disabled={savingStatus}
        >
          {savingStatus ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
)}
{showPlanModal && (
  <div
    className="user-modal-overlay"
    onClick={() => setShowPlanModal(false)}
  >
    <div
      className="user-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <h3>Change Subscription Plan</h3>

      <p>
        Select a new plan for{" "}
        <strong>{user.name}</strong>.
      </p>

      <div style={{ margin: "16px 0" }}>
        <CustomSelect
          fullWidth
          value={selectedPlan}
          onChange={setSelectedPlan}
          options={[
            { value: "FREE", label: "Free" },
            { value: "TRIAL", label: "Trial" },
            { value: "PREMIUM", label: "Premium" },
            { value: "ENTERPRISE", label: "Enterprise" },
          ]}
        />
      </div>

      <div className="user-modal-buttons">
        <button
          type="button"
          className="user-modal-cancel"
          onClick={() => setShowPlanModal(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="user-modal-confirm"
          onClick={handleChangePlan}
          disabled={savingPlan}
        >
          {savingPlan ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}