// src/App.jsx

import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SuperAdminRoute from "./components/SuperAdminRoute.jsx";

import UserLayout from "./layouts/UserLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

import { getAccountType } from "./services/auth.service.js";

// PUBLIC PAGES
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import OTPVerificationPage from "./pages/OTPVerificationPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";

// USER MODULES
import DashboardPage from "./pages/DashboardPage.jsx";
import FinancePage from "./pages/FinancePage.jsx";
import TodoPage from "./pages/TodoPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import GenericPage from "./pages/GenericPage.jsx";

// USER — HEALTH MODULE
import HealthPage from "./pages/HealthPage.jsx";
import VitalSignsPage from "./pages/VitalSignsPage.jsx";
import BodyCompositionPage from "./pages/BodyCompositionPage.jsx";
import HealthMonitoringAlertsPage from "./pages/HealthMonitoringAlertsPage.jsx";
import FitnessActivityPage from "./pages/FitnessActivityPage.jsx";
import WorkoutIntelligencePage from "./pages/WorkoutIntelligencePage.jsx";
import SleepIntelligencePage from "./pages/SleepIntelligencePage.jsx";
import NutritionManagementPage from "./pages/NutritionManagementPage.jsx";
import MedicationManagementPage from "./pages/MedicationManagementPage.jsx";
import MedicalRecordsPage from "./pages/MedicalRecordsPage.jsx";
import LaboratoryMonitoringPage from "./pages/LaboratoryMonitoringPage.jsx";
import WomensHealthPage from "./pages/WomensHealthPage.jsx";
import MentalHealthWellnessPage from "./pages/MentalHealthWellnessPage.jsx";
import HealthGoalsRecommendationsPage from "./pages/HealthGoalsRecommendationsPage.jsx";
import HealthMetricsPage from "./pages/HealthMetricsPage.jsx";
import AddHealthDataPage from "./pages/AddHealthDataPage.jsx";

// USER — OTHER MODULES
import MedicinesPage from "./pages/MedicinesPage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import UserWidgetsPage from "./pages/UserWidgetsPage.jsx";
import SubscriptionPage from "./pages/SubscriptionPage.jsx";
import AIPage from "./pages/AIPage.jsx";

// ADMIN MODULES
import UsersPage from "./pages/UsersPage.jsx";
import UserDetailsPage from "./pages/UserDetailsPage.jsx";
import UserActivityPage from "./pages/UserActivityPage.jsx";
import UserDevicesPage from "./pages/UserDevicesPage.jsx";
import AdminNotificationsPage from "./pages/AdminNotificationsPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import AdminRolesPage from "./pages/AdminRolesPage.jsx";
import AdminSubscriptionsPage from "./pages/AdminSubscriptionsPage.jsx";
import PlatformSettingsPage from "./pages/PlatformSettingsPage.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import AIAnalyticsPage from "./pages/AIAnalyticsPage.jsx";

function UserOnlyRoute() {
  const accountType = getAccountType();

  if (accountType === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

function AdminOnlyRoute() {
  const accountType = getAccountType();

  if (accountType !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function RootRedirect() {
  const token = localStorage.getItem("mone_access_token");
  const accountType = getAccountType();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (accountType === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>

      {/* =========================================
          PUBLIC
      ========================================= */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/signup"
        element={<SignupPage />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/verify-otp"
        element={<OTPVerificationPage />}
      />

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      <Route
        path="/email-verification"
        element={<EmailVerificationPage />}
      />

      {/* =========================================
          AUTHENTICATED
      ========================================= */}

      <Route element={<ProtectedRoute />}>

        {/* =======================================
            USER CONSOLE
        ======================================= */}

        <Route element={<UserOnlyRoute />}>

          <Route element={<UserLayout />}>

            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/finance"
              element={<FinancePage />}
            />

            {/* ── HEALTH MODULE ────────────────────── */}

            <Route path="/health" element={<HealthPage />} />
            <Route path="/health/vital-signs" element={<VitalSignsPage />} />
            <Route path="/health/body-composition" element={<BodyCompositionPage />} />
            <Route path="/health/monitoring-alerts" element={<HealthMonitoringAlertsPage />} />
            <Route path="/health/fitness-activity" element={<FitnessActivityPage />} />
            <Route path="/health/workout-intelligence" element={<WorkoutIntelligencePage />} />
            <Route path="/health/sleep-intelligence" element={<SleepIntelligencePage />} />
            <Route path="/health/nutrition" element={<NutritionManagementPage />} />
            <Route path="/health/medication-management" element={<MedicationManagementPage />} />
            <Route path="/health/medical-records" element={<MedicalRecordsPage />} />
            <Route path="/health/laboratory-monitoring" element={<LaboratoryMonitoringPage />} />
            <Route path="/health/womens-health" element={<WomensHealthPage />} />
            <Route path="/health/mental-health-wellness" element={<MentalHealthWellnessPage />} />
            <Route path="/health/goals-recommendations" element={<HealthGoalsRecommendationsPage />} />
            <Route path="/health/health-metrics" element={<HealthMetricsPage />} />
            <Route path="/health/add-data" element={<AddHealthDataPage />} />

            {/* ── AI MODULE ────────────────────────── */}

            <Route path="/ai" element={<AIPage />} />

            {/* ── WIDGETS ──────────────────────────── */}

            <Route path="/widgets" element={<UserWidgetsPage />} />

            {/* ── MEDICINES ────────────────────────── */}

            <Route path="/medicines" element={<MedicinesPage />} />

            {/* ── CALENDAR ─────────────────────────── */}

            <Route path="/calendar" element={<CalendarPage />} />

            <Route
              path="/todos"
              element={<TodoPage />}
            />

            <Route
              path="/insights"
              element={
                <GenericPage
                  title="Insights"
                  subtitle="Personal finance, health and AI insights."
                />
              }
            />

            <Route
              path="/notifications"
              element={<NotificationsPage />}
            />

            {/* ── SUBSCRIPTION ─────────────────────── */}

            <Route path="/subscriptions" element={<SubscriptionPage />} />

            <Route
              path="/app-management"
              element={
                <GenericPage
                  title="My Apps"
                  subtitle="Manage your connected apps and services."
                />
              }
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

          </Route>

        </Route>

        {/* =======================================
            ADMIN CONSOLE
        ======================================= */}

        <Route element={<AdminOnlyRoute />}>

          <Route element={<AdminLayout />}>

            <Route
              path="/admin/dashboard"
              element={<DashboardPage isAdmin={true} />}
            />

            <Route
              path="/admin/users"
              element={<UsersPage />}
            />

            <Route
              path="/admin/users/:userId"
              element={<UserDetailsPage />}
            />

            <Route
              path="/admin/users/:userId/activity"
              element={<UserActivityPage />}
            />

            <Route
              path="/admin/users/:userId/devices"
              element={<UserDevicesPage />}
            />

            <Route
              path="/admin/notifications"
              element={<AdminNotificationsPage />}
            />

            <Route
              path="/admin/ai-analytics"
              element={<AIAnalyticsPage />}
            />

            {/* =================================
                ADMIN USERS
            ================================= */}

            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]} />}>
              <Route
                path="/admin/admin-users"
                element={<AdminUsersPage />}
              />
            </Route>

            {/* =================================
                ROLES & PERMISSIONS
                SUPER_ADMIN ONLY
            ================================= */}

            <Route element={<SuperAdminRoute />}>

              <Route
                path="/admin/roles"
                element={<AdminRolesPage />}
              />

            </Route>

            {/* =================================
                PLATFORM SETTINGS
            ================================= */}

            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]} />}>
              <Route
                path="/admin/settings"
                element={<PlatformSettingsPage />}
              />
              <Route
                path="/admin/subscriptions"
                element={<AdminSubscriptionsPage />}
              />
            </Route>

          </Route>

        </Route>

      </Route>

      {/* =========================================
          ROOT REDIRECT
      ========================================= */}

      <Route
        path="/"
        element={<RootRedirect />}
      />

      {/* =========================================
          FALLBACK
      ========================================= */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}
