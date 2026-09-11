import React from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Layers3,
  Sparkles,
  GitBranch,
  RefreshCcw,
  UsersRound,
  Network,
  Smartphone,
  Map,
  TrendingUp,
  BrainCircuit,
  LogOut,
} from "lucide-react";

import {
  getStoredAdmin,
  logout,
} from "../services/auth.service.js";


/* ==========================================================================
   SUPER ADMIN NAVIGATION
========================================================================== */

const items = [
  [
    "/super-admin",
    "Dashboard",
    LayoutDashboard,
  ],

  [
    "/super-admin/users",
    "User Engagement",
    Users,
  ],

  [
    "/super-admin/modules",
    "Module Analytics",
    Layers3,
  ],

  [
    "/super-admin/features",
    "Feature Analytics",
    Sparkles,
  ],

  [
    "/super-admin/funnels",
    "Funnels & Journeys",
    GitBranch,
  ],

  [
    "/super-admin/retention",
    "Retention & Cohorts",
    RefreshCcw,
  ],

  [
    "/super-admin/segments",
    "User Segments",
    UsersRound,
  ],

  [
    "/super-admin/cross-module",
    "Cross-Module Usage",
    Network,
  ],

  [
    "/super-admin/platforms",
    "Platforms & Versions",
    Smartphone,
  ],

  [
    "/super-admin/geography",
    "Geography",
    Map,
  ],

  [
    "/super-admin/trends",
    "Feature Trends",
    TrendingUp,
  ],

  [
    "/super-admin/ai",
    "AI Analytics",
    BrainCircuit,
  ],
];


/* ==========================================================================
   COMPONENT
========================================================================== */

export default function SuperAdminLayout() {

  const navigate =
    useNavigate();


  const admin =
    getStoredAdmin();


  /* ==========================================================================
     LOGOUT
  ========================================================================== */

  function handleLogout() {

    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }


  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <div className="shell super-admin-shell">

      {/* ====================================================================
          SIDEBAR
      ==================================================================== */}

      <aside>

        {/* ================================================================
            BRAND
        ================================================================ */}

        <div className="brand">

          <b>
            M
          </b>


          <div>

            <strong>
              MONE AI
            </strong>

            <span>
              Super Admin
            </span>

          </div>

        </div>


        {/* ================================================================
            NAVIGATION
        ================================================================ */}

        <nav>

          {items.map(
            (
              [
                to,
                label,
                Icon,
              ]
            ) => (

              <NavLink
                key={to}
                to={to}
                end={
                  to ===
                  "/super-admin"
                }
                className={
                  ({
                    isActive,
                  }) =>
                    isActive
                      ? "active"
                      : ""
                }
              >

                <Icon
                  size={18}
                />

                <span>
                  {label}
                </span>

              </NavLink>

            )
          )}

        </nav>


        {/* ================================================================
            LOGOUT
        ================================================================ */}

        <button
          type="button"
          onClick={handleLogout}
        >

          <LogOut
            size={18}
          />

          <span>
            Logout
          </span>

        </button>

      </aside>


      {/* ====================================================================
          MAIN CONTENT
      ==================================================================== */}

      <main>

        {/* ================================================================
            HEADER
        ================================================================ */}

        <header>

          <div>

            <strong>
              MONE AI Super Administration
            </strong>

            <span>
              Product intelligence & platform control
            </span>

          </div>


          {/* ================================================================
              ADMIN PROFILE
          ================================================================ */}

          <div className="admin">

            <div className="avatar">

              {admin?.name?.charAt(
                0
              )?.toUpperCase() || "S"}

            </div>


            <div>

              <strong>
                {admin?.name ||
                  "Super Administrator"}
              </strong>

              <span>
                {admin?.role ||
                  "SUPER_ADMIN"}
              </span>

            </div>

          </div>

        </header>


        {/* ================================================================
            PAGE CONTENT
        ================================================================ */}

        <section className="content">

          <Outlet />

        </section>

      </main>

    </div>
  );
}