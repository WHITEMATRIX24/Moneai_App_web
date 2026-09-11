import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  Bell,
  BarChart3,
  Crown,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import {
  getStoredAdmin,
  logout,
} from "../services/auth.service.js";

import "./AdminLayout.css";

// =====================================
// ROLE-BASED SIDEBAR
// =====================================

const adminItems = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ANALYST"],
    end: true,
  },

  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ANALYST"],
  },

  {
    to: "/admin/notifications",
    label: "Notifications",
    icon: Bell,
    roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ANALYST"],
  },

  {
    to: "/admin/ai-analytics",
    label: "AI Analytics",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ANALYST"],
  },

  {
    to: "/admin/admin-users",
    label: "Admin Users",
    icon: UserCog,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },

  {
    to: "/admin/roles",
    label: "Roles & Permissions",
    icon: ShieldCheck,
    roles: ["SUPER_ADMIN"],
  },

  {
    to: "/admin/subscriptions",
    label: "Subscriptions",
    icon: Crown,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },

  {
    to: "/admin/settings",
    label: "Platform Settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
];

function getInitial(name) {
  if (!name) return "A";
  return name.trim().charAt(0).toUpperCase();
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const admin = getStoredAdmin();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="admin-layout">

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside className="app-sidebar">

        <div className="brand">
          <b>M</b>

          <div>
            <strong>MONE AI</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {adminItems
            .filter((item) => item.roles.includes(admin?.role))
            .map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive ? "active" : undefined
                }
              >
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-spacer" />

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>

      </aside>

      {/* =====================================
          MAIN
      ===================================== */}

      <main className="app-main">

        <header className="app-header">

          <div className="app-header__title">
            <strong>MONE AI Administration</strong>
            <span>Platform control center</span>
          </div>

          <div className="admin">

            <div className="avatar">
              {getInitial(admin?.name)}
            </div>

            <div>
              <strong>
                {admin?.name || "Administrator"}
              </strong>

              <span>
                {admin?.role || "ADMIN"}
              </span>
            </div>

            <ShieldCheck
              size={18}
              aria-hidden="true"
            />

          </div>

        </header>

        <section className="content">
          <Outlet />
        </section>

      </main>

    </div>
  );
}
