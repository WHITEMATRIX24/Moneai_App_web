// src/layouts/UserLayout.jsx

import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { notificationService } from "../services/notification.service.js";

import {
  LayoutDashboard,
  WalletCards,
  HeartPulse,
  BrainCircuit,
  PanelsTopLeft,
  ListTodo,
  Sparkles,
  Bell,
  Crown,
  Smartphone,
  Settings,
  LogOut,
  CalendarDays,
  Pill,
} from "lucide-react";

import { getStoredUser, logout } from "../services/auth.service.js";
import MaintenanceScreen from "../components/MaintenanceScreen.jsx";
import api from "../services/api.js";

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const date = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="header-clock">
      <span className="header-clock__time">{time}</span>
      <span className="header-clock__date">{date}</span>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useState(() => ({ current: null }))[0];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await notificationService.list();
      setNotifications(res?.data?.notifications ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markRead(id) {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (String(n._id) === String(id) ? { ...n, isRead: true } : n))
      );
    } catch { /* silent */ }
  }

  async function markAll() {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div style={{ position: "relative" }} ref={(el) => (ref.current = el)}>
      <button
        type="button"
        className="header-bell"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} className="header-bell__icon" />
        {unreadCount > 0 && (
          <span className="header-bell__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          {/* Header */}
          <div className="notif-dropdown__header">
            <div>
              <strong>Notifications</strong>
              {unreadCount > 0 && (
                <span className="notif-dropdown__count">{unreadCount} unread</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-dropdown__mark-all"
                onClick={markAll}
                disabled={markingAll}
              >
                {markingAll ? "Marking…" : "Mark all read"}
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-dropdown__list">
            {loading ? (
              <div className="notif-dropdown__empty">
                <div className="notif-dropdown__spinner" />
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-dropdown__empty">
                <Bell size={22} />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n._id}
                  className={`notif-dropdown__item${n.isRead ? "" : " unread"}`}
                  onClick={() => !n.isRead && markRead(n._id)}
                >
                  <div className="notif-dropdown__dot" />
                  <div className="notif-dropdown__body">
                    <strong>{n.title}</strong>
                    <p>{n.body}</p>
                    <span>{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


const items = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/finance", "Finance", WalletCards],
  ["/health", "Health", HeartPulse],
  ["/medicines", "Medicines", Pill],
  ["/ai", "AI", BrainCircuit],
  ["/widgets", "Widgets", PanelsTopLeft],
  ["/todos", "To-Do", ListTodo],
  ["/calendar", "Calendar", CalendarDays],
  ["/insights", "Insights", Sparkles],
  ["/notifications", "Notifications", Bell],
  ["/subscriptions", "Subscription", Crown],
  ["/app-management", "My Apps", Smartphone],
  ["/settings", "Settings", Settings],
];

export default function UserLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [maintenance, setMaintenance] = useState({
    active: false,
    message: "",
  });

  useEffect(() => {
    let mounted = true;
    api.get("/app-config/public")
      .then((res) => {
        if (mounted && res?.data?.settings?.maintenanceMode) {
          setMaintenance({
            active: true,
            message: res.data.settings.maintenanceMessage,
          });
        }
      })
      .catch(() => {});

    function handleMaintenanceEvent(e) {
      if (mounted) {
        setMaintenance({
          active: true,
          message:
            e?.detail?.message ||
            "MONE AI is currently undergoing maintenance. Please try again later.",
        });
      }
    }

    window.addEventListener("mone_maintenance_mode", handleMaintenanceEvent);
    return () => {
      mounted = false;
      window.removeEventListener("mone_maintenance_mode", handleMaintenanceEvent);
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  if (maintenance.active) {
    return (
      <MaintenanceScreen
        message={maintenance.message}
        onRetry={() => {
          api.get("/app-config/public").then((res) => {
            if (!res?.data?.settings?.maintenanceMode) {
              setMaintenance({ active: false, message: "" });
            }
          });
        }}
      />
    );
  }

  return (
    <div className="shell">
      <aside className="app-sidebar">
        <div className="brand">
          <b>M</b>

          <div>
            <strong>MONE AI</strong>
            <span>Personal Console</span>
          </div>
        </div>

        <nav>
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={19} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="app-header__title">
            <strong>MONE AI</strong>
            <span>Your personal control center</span>
          </div>

          <div className="header-right">
            <LiveClock />

            <div className="header-divider" />

            <NotificationBell />

            <div className="header-divider" />

            <div className="admin">
              <div className="avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <strong>{user?.name || "User"}</strong>
                <span>{user?.subscriptionPlan || user?.role || "USER"}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
