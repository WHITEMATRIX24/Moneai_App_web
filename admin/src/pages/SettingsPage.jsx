import { useMemo, useState, useEffect } from "react";
import {
  Activity,
  BellRing,
  Bot,
  BrainCircuit,
  Check,
  CircleDollarSign,
  Database,
  Globe2,
  HeartPulse,
  Mail,
  Moon,
  Palette,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  WalletCards,
  Wrench,
} from "lucide-react";

import PageHeader from "../components/PageHeader.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import ColorWheelPicker from "../components/theme/ColorWheelPicker.jsx";
import aiPersonalizationService from "../services/aiPersonalization.service.js";
import "./SettingsPage.css";

const COLOR_PRESETS = [
  "#ff6500",
  "#2563eb",
  "#7c3aed",
  "#16a34a",
  "#dc2626",
  "#0891b2",
  "#db2777",
  "#ca8a04",
];

export default function SettingsPage() {
  const [appName, setAppName] = useState("MONE AI");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const [financeEnabled, setFinanceEnabled] = useState(true);
  const [currency, setCurrency] = useState("INR");
  const [transactionLimit, setTransactionLimit] = useState("100000");

  const [healthEnabled, setHealthEnabled] = useState(true);
  const [healthReminders, setHealthReminders] = useState(true);
  const [healthNotifications, setHealthNotifications] = useState(true);

  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiModel, setAiModel] = useState("GPT");
  const [aiRequestLimit, setAiRequestLimit] = useState("100");

  // Theme Mode & Accent Color state
  const [themeMode, setThemeMode] = useState(() => {
    return (
      localStorage.getItem("mone_theme_mode") ||
      (document.documentElement.classList.contains("dark-mode") ? "dark" : "light")
    );
  });
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem("mone_theme_color") || "#ff6500";
  });

  const [savingSection, setSavingSection] = useState("");
  const [message, setMessage] = useState("");

  function handleThemeModeChange(mode) {
    setThemeMode(mode);
    const root = document.documentElement;
    const body = document.body;
    if (mode === "dark") {
      root.classList.add("dark-mode");
      body.classList.add("dark-mode");
      root.classList.remove("light-mode");
      body.classList.remove("light-mode");
    } else {
      root.classList.remove("dark-mode");
      body.classList.remove("dark-mode");
      root.classList.add("light-mode");
      body.classList.add("light-mode");
    }
    localStorage.setItem("mone_theme_mode", mode);
    setMessage(`Appearance mode updated to ${mode.toUpperCase()} mode.`);
  }

  function handleThemeColorChange(color) {
    if (!color || !color.startsWith("#")) return;
    setThemeColor(color);
    if (typeof window.__applyAccentColor === "function") {
      window.__applyAccentColor(color);
    } else {
      document.documentElement.style.setProperty("--primary-color", color);
      document.documentElement.style.setProperty("--accent", color);
    }
    localStorage.setItem("mone_theme_color", color);
    setMessage(`Theme accent colour updated.`);
  }

  function showSavedMessage(section) {
    setSavingSection(section);
    setMessage("");

    window.setTimeout(() => {
      setSavingSection("");
      setMessage(`${section} settings saved successfully.`);
    }, 350);
  }

  const enabledServices = useMemo(() => {
    return [
      financeEnabled,
      healthEnabled,
      aiEnabled,
      registrationEnabled,
    ].filter(Boolean).length;
  }, [financeEnabled, healthEnabled, aiEnabled, registrationEnabled]);

  const integrations = [
    {
      name: "MongoDB",
      description: "Application database",
      icon: Database,
      connected: true,
    },
    {
      name: "AI Service",
      description: "Artificial intelligence service",
      icon: Bot,
      connected: true,
    },
    {
      name: "Payment Service",
      description: "Payment processing service",
      icon: WalletCards,
      connected: false,
    },
    {
      name: "Email Service",
      description: "Email and notification service",
      icon: Mail,
      connected: true,
    },
  ];

  return (
    <div className="settings-page settings-page-new">
      <PageHeader
        title="Settings"
        subtitle="Manage application configuration, services and platform behaviour."
      />

      {/* HERO */}

      <section className="settings-hero">
        <div>
          <div className="settings-hero__eyebrow">
            <Settings size={14} />
            System Configuration
          </div>

          <h1>Application Settings</h1>

          <p>
            Control system behaviour, finance, health, AI services and
            application integrations from one place.
          </p>
        </div>

        <div className="settings-hero__status">
          <div>
            <Activity size={16} />
            <span>{enabledServices} core services enabled</span>
          </div>
        </div>
      </section>

      {/* SUMMARY */}

      <section className="settings-summary-grid">
        <article className="settings-summary-card">
          <div className="settings-summary-icon">
            <Globe2 size={20} />
          </div>

          <div>
            <span>Application</span>
            <strong>{appName}</strong>
            <small>Version 1.0.0</small>
          </div>
        </article>

        <article className="settings-summary-card">
          <div className="settings-summary-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>Registration</span>
            <strong>{registrationEnabled ? "Enabled" : "Disabled"}</strong>
            <small>User onboarding</small>
          </div>
        </article>

        <article className="settings-summary-card">
          <div className="settings-summary-icon">
            <Wrench size={20} />
          </div>

          <div>
            <span>Maintenance</span>
            <strong>{maintenanceMode ? "Enabled" : "Disabled"}</strong>
            <small>Platform availability</small>
          </div>
        </article>

        <article className="settings-summary-card">
          <div className="settings-summary-icon">
            <SlidersHorizontal size={20} />
          </div>

          <div>
            <span>Session Timeout</span>
            <strong>{sessionTimeout} min</strong>
            <small>Admin session policy</small>
          </div>
        </article>
      </section>

      {message && (
        <div className="settings-success">
          <ShieldCheck size={17} />
          <span>{message}</span>
        </div>
      )}

      {/* APPEARANCE & THEME */}
      <section className="settings-section-card">
        <div className="settings-section-header">
          <div>
            <span>Personalization</span>
            <h2>Appearance & Theme</h2>
            <p>
              Customize system appearance, light / dark mode, and your global accent color across all dashboard pages.
            </p>
          </div>

          <div className="settings-section-icon">
            <Palette size={20} />
          </div>
        </div>

        <div className="settings-section-body">
          <div className="settings-appearance-group">
            <label className="settings-subheading">Display Mode</label>
            <div className="settings-mode-grid">
              <button
                type="button"
                className={`settings-mode-card ${themeMode === "light" ? "active" : ""}`}
                onClick={() => handleThemeModeChange("light")}
              >
                <div className="settings-mode-icon">
                  <Sun size={20} />
                </div>
                <div>
                  <strong>Light Mode</strong>
                  <p>Crisp, clean layout for bright environments</p>
                </div>
              </button>

              <button
                type="button"
                className={`settings-mode-card ${themeMode === "dark" ? "active" : ""}`}
                onClick={() => handleThemeModeChange("dark")}
              >
                <div className="settings-mode-icon">
                  <Moon size={20} />
                </div>
                <div>
                  <strong>Dark Mode</strong>
                  <p>Deep slate navy finish that reduces eye strain</p>
                </div>
              </button>
            </div>
          </div>

          <div className="settings-appearance-group" style={{ marginTop: "28px" }}>
            <label className="settings-subheading">Interactive Theme Accent Palette</label>
            <p className="settings-field-hint">
              Drag anywhere on the chromatic color wheel or use the shade slider to customize your theme. Every button, badge, card, and indicator updates in real-time.
            </p>
            <div
              className="settings-theme-container"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
                alignItems: "stretch",
                marginTop: "18px",
              }}
            >
              <ColorWheelPicker
                value={themeColor}
                onChange={handleThemeColorChange}
                size={230}
              />
              <div
                className="settings-theme-preview-card"
                style={{
                  background: "var(--bg-card, #ffffff)",
                  border: "1px solid var(--line, #e2e8f0)",
                  borderRadius: "18px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "20px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                  boxSizing: "border-box",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "15px", color: "var(--text, #1e293b)", display: "block" }}>
                      Live Component Preview
                    </strong>
                    <span style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
                      Every card, button, and indicator syncs live
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      background: "rgba(var(--primary-color-rgb, 255, 101, 0), 0.12)",
                      color: "var(--primary-color, #ff6500)",
                    }}
                  >
                    Realtime Sync
                  </span>
                </div>

                {/* Buttons Row */}
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted, #94a3b8)", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
                    Buttons & Actions
                  </span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        border: "none",
                        background: "var(--primary-color, #ff6500)",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(var(--primary-color-rgb, 255, 101, 0), 0.35)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Primary Button
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "9px 18px",
                        borderRadius: "10px",
                        border: "1px solid var(--primary-border, rgba(var(--primary-color-rgb, 255, 101, 0), 0.3))",
                        background: "transparent",
                        color: "var(--primary-color, #ff6500)",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Outline Button
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "9px 14px",
                        borderRadius: "10px",
                        border: "none",
                        background: "var(--primary-bg-soft, rgba(var(--primary-color-rgb, 255, 101, 0), 0.1))",
                        color: "var(--primary-color, #ff6500)",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Soft Tint
                    </button>
                  </div>
                </div>

                {/* Metrics / KPI card */}
                <div
                  style={{
                    padding: "16px 18px",
                    borderRadius: "14px",
                    background: "var(--primary-bg-soft, rgba(var(--primary-color-rgb, 255, 101, 0), 0.05))",
                    border: "1px solid var(--primary-border, rgba(var(--primary-color-rgb, 255, 101, 0), 0.2))",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--muted, #64748b)", fontWeight: 600 }}>Active Theme Metric</div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary-color, #ff6500)", marginTop: "2px" }}>
                      {themeColor.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--primary-color, #ff6500)",
                        background: "rgba(var(--primary-color-rgb, 255, 101, 0), 0.15)",
                        padding: "4px 12px",
                        borderRadius: "14px",
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--primary-color, #ff6500)",
                        }}
                      />{" "}
                      Live Theme
                    </span>
                    <div style={{ fontSize: "11px", color: "var(--muted, #94a3b8)", marginTop: "4px" }}>System wide</div>
                  </div>
                </div>

                {/* Progress bar preview */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "var(--text, #1e293b)", marginBottom: "6px" }}>
                    <span>Accent Progress Fill</span>
                    <span style={{ color: "var(--primary-color, #ff6500)" }}>78%</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", borderRadius: "4px", background: "var(--line, #e2e8f0)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: "78%",
                        height: "100%",
                        borderRadius: "4px",
                        background: `linear-gradient(90deg, var(--primary-color, #ff6500), var(--primary-hover, #cc5200))`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GENERAL */}

      <section className="settings-section-card">
        <div className="settings-section-header">
          <div>
            <span>General</span>
            <h2>Administration Settings</h2>
            <p>
              Configure application identity, registration and session
              behaviour.
            </p>
          </div>

          <div className="settings-section-icon">
            <Settings size={20} />
          </div>
        </div>

        <div className="settings-section-body">
          <div className="settings-input-grid">
            <div className="settings-field">
              <label>Application Name</label>

              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label>Session Timeout</label>

              <CustomSelect
                fullWidth
                value={sessionTimeout}
                onChange={setSessionTimeout}
                options={[
                  { value: "15", label: "15 minutes" },
                  { value: "30", label: "30 minutes" },
                  { value: "60", label: "1 hour" },
                  { value: "120", label: "2 hours" },
                ]}
              />
            </div>
          </div>

          <div className="settings-toggle-list">
            <SettingToggle
              title="Maintenance Mode"
              description="Temporarily disable access to the application."
              checked={maintenanceMode}
              onChange={setMaintenanceMode}
            />

            <SettingToggle
              title="User Registration"
              description="Allow new users to create accounts."
              checked={registrationEnabled}
              onChange={setRegistrationEnabled}
            />
          </div>

          <SaveButton
            label="Save General Settings"
            loading={savingSection === "General"}
            onClick={() => showSavedMessage("General")}
          />
        </div>
      </section>

      {/* PUBLIC CONFIG */}

      <section className="settings-section-card">
        <div className="settings-section-header">
          <div>
            <span>Public</span>
            <h2>Public Configuration</h2>
            <p>Current configuration visible to the application.</p>
          </div>

          <div className="settings-section-icon">
            <Globe2 size={20} />
          </div>
        </div>

        <div className="settings-public-grid">
          <PublicSetting label="Application Name" value={appName} />

          <PublicSetting label="Application Version" value="1.0.0" />

          <PublicSetting
            label="Registration"
            value={registrationEnabled ? "Enabled" : "Disabled"}
            status={registrationEnabled ? "enabled" : "disabled"}
          />

          <PublicSetting
            label="Maintenance"
            value={maintenanceMode ? "Enabled" : "Disabled"}
            status={maintenanceMode ? "disabled" : "enabled"}
          />
        </div>
      </section>

      {/* INTEGRATIONS */}

      <section className="settings-section-card">
        <div className="settings-section-header">
          <div>
            <span>Services</span>
            <h2>Integration Status</h2>
            <p>Monitor connected application services and infrastructure.</p>
          </div>

          <div className="settings-section-icon">
            <Activity size={20} />
          </div>
        </div>

        <div className="settings-integration-list">
          {integrations.map((integration) => {
            const Icon = integration.icon;

            return (
              <div className="settings-integration-item" key={integration.name}>
                <div className="settings-integration-left">
                  <div className="settings-integration-icon">
                    <Icon size={18} />
                  </div>

                  <div>
                    <strong>{integration.name}</strong>

                    <span>{integration.description}</span>
                  </div>
                </div>

                <span
                  className={`settings-integration-badge ${
                    integration.connected ? "connected" : "disconnected"
                  }`}
                >
                  <i />

                  {integration.connected ? "Connected" : "Not Connected"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINANCE */}

      <section className="settings-section-card">
        <div className="settings-section-header">
          <div>
            <span>Finance</span>
            <h2>Finance Settings</h2>
            <p>
              Configure financial features, currency and transaction limits.
            </p>
          </div>

          <div className="settings-section-icon">
            <CircleDollarSign size={20} />
          </div>
        </div>

        <div className="settings-section-body">
          <div className="settings-toggle-list">
            <SettingToggle
              title="Finance Module"
              description="Enable or disable finance functionality."
              checked={financeEnabled}
              onChange={setFinanceEnabled}
            />
          </div>

          <div className="settings-input-grid">
            <div className="settings-field">
              <label>Default Currency</label>

              <CustomSelect
                fullWidth
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: "INR", label: "INR - Indian Rupee" },
                  { value: "USD", label: "USD - US Dollar" },
                  { value: "EUR", label: "EUR - Euro" },
                  { value: "GBP", label: "GBP - British Pound" },
                ]}
              />
            </div>

            <div className="settings-field">
              <label>Transaction Limit</label>

              <input
                type="number"
                value={transactionLimit}
                onChange={(e) => setTransactionLimit(e.target.value)}
              />
            </div>
          </div>

          <SaveButton
            label="Save Finance Settings"
            loading={savingSection === "Finance"}
            onClick={() => showSavedMessage("Finance")}
          />
        </div>
      </section>

      {/* HEALTH */}

      <section className="settings-section-card">
        <div className="settings-section-header">
          <div>
            <span>Health</span>
            <h2>Health Settings</h2>
            <p>Configure health services, reminders and notifications.</p>
          </div>

          <div className="settings-section-icon">
            <HeartPulse size={20} />
          </div>
        </div>

        <div className="settings-section-body">
          <div className="settings-toggle-list">
            <SettingToggle
              title="Health Module"
              description="Enable or disable health functionality."
              checked={healthEnabled}
              onChange={setHealthEnabled}
            />

            <SettingToggle
              title="Health Reminders"
              description="Allow health reminders for users."
              checked={healthReminders}
              onChange={setHealthReminders}
            />

            <SettingToggle
              title="Health Notifications"
              description="Enable health-related notifications."
              checked={healthNotifications}
              onChange={setHealthNotifications}
            />
          </div>

          <SaveButton
            label="Save Health Settings"
            loading={savingSection === "Health"}
            onClick={() => showSavedMessage("Health")}
          />
        </div>
      </section>

      {/* AI */}

      <section className="settings-section-card">
        <div className="settings-section-header">
          <div>
            <span>AI</span>
            <h2>AI Settings</h2>
            <p>Configure AI availability, provider and usage limits.</p>
          </div>

          <div className="settings-section-icon">
            <Bot size={20} />
          </div>
        </div>

        <div className="settings-section-body">
          <div className="settings-toggle-list">
            <SettingToggle
              title="AI Module"
              description="Enable or disable AI functionality."
              checked={aiEnabled}
              onChange={setAiEnabled}
            />
          </div>

          <div className="settings-input-grid">
            <div className="settings-field">
              <label>AI Model</label>

              <CustomSelect
                fullWidth
                value={aiModel}
                onChange={setAiModel}
                options={[
                  { value: "GPT", label: "GPT" },
                  { value: "Gemini", label: "Gemini" },
                  { value: "Claude", label: "Claude" },
                ]}
              />
            </div>

            <div className="settings-field">
              <label>Daily Request Limit</label>

              <input
                type="number"
                value={aiRequestLimit}
                onChange={(e) => setAiRequestLimit(e.target.value)}
              />
            </div>
          </div>

          <SaveButton
            label="Save AI Settings"
            loading={savingSection === "AI"}
            onClick={() => showSavedMessage("AI")}
          />
        </div>
      </section>

      {/* AI PERSONALIZATION — real, wired to server/src/routes/ai.routes.js */}

      <AIPersonalizationSection />
    </div>
  );
}

function SettingToggle({ title, description, checked, onChange }) {
  return (
    <div className="settings-toggle-row">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <label className="settings-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />

        <span />
      </label>
    </div>
  );
}

function PublicSetting({ label, value, status }) {
  return (
    <div className="settings-public-item">
      <span>{label}</span>

      {status ? (
        <strong className={`settings-public-status ${status}`}>{value}</strong>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

function SaveButton({ label, loading, onClick }) {
  return (
    <button
      type="button"
      className="settings-save-button"
      disabled={loading}
      onClick={onClick}
    >
      {loading ? (
        <RefreshCw size={15} className="settings-spin" />
      ) : (
        <Save size={15} />
      )}

      {loading ? "Saving..." : label}
    </button>
  );
}

/**
 * AIPersonalizationSection
 *
 * Unlike every other section on this page (all local demo state, no
 * backend calls), this one is fully wired to
 * GET/PATCH /api/v1/ai/personalization/consent and
 * GET/DELETE /api/v1/ai/memory. It's the user-facing control for
 * everything discussed with the team: consent gates both stated
 * (remember_preference) and inferred (aiInference.service.js) memory,
 * and every fact — stated or inferred — is visible here and individually
 * deletable, so personalization never happens somewhere the user can't
 * see or undo it.
 */
function AIPersonalizationSection() {
  const [consent, setConsent] = useState(null); // { consent, consentedAt, consentVersion }
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [forgettingKey, setForgettingKey] = useState("");
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [consentRes, memoryRes] = await Promise.all([
        aiPersonalizationService.getConsent(),
        aiPersonalizationService.listMemory(),
      ]);
      setConsent(consentRes.data?.data || null);
      setFacts(memoryRes.data?.data?.facts || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Couldn't load personalization settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleToggleConsent(granted) {
    setToggling(true);
    setError("");
    try {
      const res = await aiPersonalizationService.setConsent(granted);
      setConsent(res.data?.data || null);
      // Revoking deletes inferred facts server-side immediately — refresh
      // the list so the UI reflects that without a page reload.
      if (!granted) {
        const memoryRes = await aiPersonalizationService.listMemory();
        setFacts(memoryRes.data?.data?.facts || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Couldn't update personalization consent.",
      );
    } finally {
      setToggling(false);
    }
  }

  async function handleForget(key) {
    setForgettingKey(key);
    setError("");
    try {
      await aiPersonalizationService.forgetMemory(key);
      setFacts((prev) => prev.filter((f) => f.key !== key));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't forget that.");
    } finally {
      setForgettingKey("");
    }
  }

  const statedFacts = facts.filter((f) => f.source !== "inferred");
  const inferredFacts = facts.filter((f) => f.source === "inferred");
  const granted = Boolean(consent?.consent);

  return (
    <section className="settings-section-card">
      <div className="settings-section-header">
        <div>
          <span>Privacy</span>
          <h2>AI Personalization</h2>
          <p>
            Control whether MONE AI can remember things about you across
            conversations — both what you ask it to remember, and what it
            notices from how you use the app.
          </p>
        </div>

        <div className="settings-section-icon">
          <BrainCircuit size={20} />
        </div>
      </div>

      <div className="settings-section-body">
        {error && (
          <div className="settings-success" style={{ background: "rgba(255,80,80,0.08)", color: "#ff6b6b" }}>
            <span>{error}</span>
          </div>
        )}

        <div className="settings-toggle-list">
          <SettingToggle
            title="Personalization"
            description={
              granted
                ? "MONE AI can remember preferences you state and learn from your usage patterns (e.g. which features you use most)."
                : "MONE AI won't remember anything between conversations, stated or inferred."
            }
            checked={granted}
            onChange={handleToggleConsent}
            disabled={loading || toggling}
          />
        </div>

        {consent?.consentedAt && (
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: -4 }}>
            Last changed {new Date(consent.consentedAt).toLocaleDateString()}
            {consent.consentVersion ? ` · policy v${consent.consentVersion}` : ""}
          </p>
        )}

        {!loading && granted && (
          <>
            <MemoryFactGroup
              title="What you've told it to remember"
              emptyText="Nothing yet — ask the AI to remember something and confirm it, and it'll show up here."
              facts={statedFacts}
              onForget={handleForget}
              forgettingKey={forgettingKey}
            />

            <MemoryFactGroup
              title="What it's inferred from your usage"
              emptyText="Nothing inferred yet — this fills in over time as you use the app."
              facts={inferredFacts}
              onForget={handleForget}
              forgettingKey={forgettingKey}
              inferred
            />
          </>
        )}

        {loading && <p style={{ fontSize: 13, opacity: 0.6 }}>Loading…</p>}
      </div>
    </section>
  );
}

function MemoryFactGroup({ title, emptyText, facts, onForget, forgettingKey, inferred }) {
  return (
    <div style={{ marginTop: 18 }}>
      <strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>{title}</strong>

      {facts.length === 0 ? (
        <p style={{ fontSize: 12.5, opacity: 0.55 }}>{emptyText}</p>
      ) : (
        <div className="settings-integration-list">
          {facts.map((fact) => (
            <div className="settings-integration-item" key={fact.key}>
              <div className="settings-integration-left">
                <div>
                  <strong>{fact.value}</strong>
                  <span>
                    {fact.key}
                    {inferred && typeof fact.confidence === "number"
                      ? ` · ${Math.round(fact.confidence * 100)}% confidence`
                      : ""}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="settings-save-button"
                style={{ padding: "6px 12px" }}
                disabled={forgettingKey === fact.key}
                onClick={() => onForget(fact.key)}
              >
                {forgettingKey === fact.key ? (
                  <RefreshCw size={14} className="settings-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Forget
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
