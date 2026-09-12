import { useEffect, useState } from "react";

import {
  FaSave,
  FaUndo,
  FaPalette,
  FaCog,
  FaShieldAlt,
  FaBell,
  FaRobot,
  FaServer,
  FaGlobe,
  FaUserPlus,
  FaCheckCircle,
  FaWrench,
  FaEnvelope,
  FaMoon,
  FaSun,
  FaTextHeight,
  FaLock,
  FaBrain,
} from "react-icons/fa";

import { adminService } from "../services/admin.service.js";
import PageHeader from "../components/PageHeader.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import "./PlatformSettingsPage.css";


/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
  platformName: "MONE AI",
  supportEmail: "support@moneai.com",
  defaultCurrency: "INR",
  timezone: "Asia/Kolkata",

  requireEmailVerification: true,
  allowUserRegistration: true,
  maxLoginAttempts: 5,

  emailNotifications: true,
  pushNotifications: true,
  systemNotifications: true,

  aiEnabled: true,
  aiUsageLimit: 100,

  maintenanceMode: false,
  maintenanceMessage:
    "MONE AI is currently undergoing maintenance. Please try again later.",

  themeColor: "#ff6500",
  themeMode: "light",
  fontSize: "16",
};


/* =========================================================
   COLOUR PRESETS
========================================================= */

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


/* =========================================================
   SETTINGS PAGE
========================================================= */

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [activeSection, setActiveSection] = useState("general");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");


  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  useEffect(() => {
    loadSettings();
  }, []);


  async function loadSettings() {
    try {
      setLoading(true);

      let backendSettings = {};

      try {
        if (typeof adminService.getSettings === "function") {
          const response = await adminService.getSettings();

          backendSettings =
            response?.data?.settings ||
            response?.data ||
            {};
        }
      } catch (error) {
        console.log("Backend settings unavailable:", error);
      }

      const savedTheme = localStorage.getItem("mone_theme_color");
      const savedMode = localStorage.getItem("mone_theme_mode");
      const savedFont = localStorage.getItem("mone_font_size");

      // Check if root already has a non-default primary color applied
      const rootColor = document.documentElement.style.getPropertyValue("--primary-color")?.trim();

      const resolvedThemeColor =
        savedTheme ||
        backendSettings.themeColor ||
        (rootColor && rootColor.startsWith("#") ? rootColor : null) ||
        DEFAULT_SETTINGS.themeColor;

      const finalSettings = {
        ...DEFAULT_SETTINGS,
        ...backendSettings,

        themeColor: resolvedThemeColor,

        themeMode:
          savedMode ||
          backendSettings.themeMode ||
          DEFAULT_SETTINGS.themeMode,

        fontSize: Number(
          savedFont ||
          backendSettings.fontSize ||
          DEFAULT_SETTINGS.fontSize
        ),
      };

      setSettings(finalSettings);

      applyTheme(finalSettings.themeColor);
      applyAppearanceMode(finalSettings.themeMode);
      applyFontSize(finalSettings.fontSize);

    } catch (error) {
      console.error("Failed to load settings:", error);

      const fallbackTheme = localStorage.getItem("mone_theme_color") || DEFAULT_SETTINGS.themeColor;
      applyTheme(fallbackTheme);
      applyAppearanceMode(localStorage.getItem("mone_theme_mode") || DEFAULT_SETTINGS.themeMode);
      applyFontSize(Number(localStorage.getItem("mone_font_size")) || DEFAULT_SETTINGS.fontSize);

    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     UPDATE SINGLE SETTING
  ======================================================= */

  function updateSetting(key, value) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }


  /* =======================================================
     DARKEN COLOUR
  ======================================================= */

  function darkenColor(hex) {
    if (!hex || !hex.startsWith("#")) {
      return "#d94f00";
    }

    const cleanHex = hex.replace("#", "");

    if (cleanHex.length !== 6) {
      return "#d94f00";
    }

    const r = Math.max(
      0,
      parseInt(cleanHex.substring(0, 2), 16) - 35
    );

    const g = Math.max(
      0,
      parseInt(cleanHex.substring(2, 4), 16) - 35
    );

    const b = Math.max(
      0,
      parseInt(cleanHex.substring(4, 6), 16) - 35
    );

    return `rgb(${r}, ${g}, ${b})`;
  }


  /* =======================================================
     APPLY PRIMARY COLOUR
  ======================================================= */

  function applyTheme(color) {
    if (!color || !color.startsWith("#")) {
      return;
    }

    try {
      localStorage.setItem("mone_theme_color", color);
    } catch (e) {
      console.error("Failed to store mone_theme_color in localStorage", e);
    }

    if (typeof window.__applyAccentColor === "function") {
      window.__applyAccentColor(color);
    } else {
      const root = document.documentElement;
      root.style.setProperty("--primary-color", color);
      root.style.setProperty("--accent", color);
      root.style.setProperty("--primary-hover", darkenColor(color));
    }
  }


  /* =======================================================
     SELECT COLOUR
  ======================================================= */

  function selectColor(color) {
    updateSetting("themeColor", color);

    try {
      localStorage.setItem("mone_theme_color", color);
    } catch (e) {
      console.error("Failed to store mone_theme_color in localStorage", e);
    }

    applyTheme(color);

    setMessage("Theme colour updated.");
  }


  /* =======================================================
     APPLY LIGHT / DARK MODE
  ======================================================= */

 function applyAppearanceMode(mode) {
  const root = document.documentElement;
  const body = document.body;

  root.classList.remove("dark-mode", "light-mode");
  body.classList.remove("dark-mode", "light-mode");

  if (mode === "dark") {
    root.classList.add("dark-mode");
    body.classList.add("dark-mode");
  } else {
    root.classList.add("light-mode");
    body.classList.add("light-mode");
  }

  localStorage.setItem("mone_theme_mode", mode);
}

  /* =======================================================
     APPLY FONT SIZE
  ======================================================= */

function applyFontSize(size) {
  const fontSize = Number(size);

  if (!fontSize || fontSize < 12 || fontSize > 24) {
    return;
  }

  const scale = fontSize / 16;

  document.documentElement.style.setProperty(
    "--base-font-size",
    `${fontSize}px`
  );

  document.documentElement.style.setProperty(
    "--font-scale",
    String(scale)
  );

  localStorage.setItem(
    "mone_font_size",
    String(fontSize)
  );
}
  /* =======================================================
     SAVE SETTINGS
  ======================================================= */

  async function saveSettings() {
    try {
      setSaving(true);
      setMessage("");

      // Explicitly persist appearance settings to localStorage immediately
      if (settings.themeColor) {
        localStorage.setItem("mone_theme_color", settings.themeColor);
      }
      if (settings.themeMode) {
        localStorage.setItem("mone_theme_mode", settings.themeMode);
      }
      if (settings.fontSize) {
        localStorage.setItem("mone_font_size", String(settings.fontSize));
      }

      applyTheme(settings.themeColor);
      applyAppearanceMode(settings.themeMode);
      applyFontSize(settings.fontSize);


      try {
        if (
          typeof adminService.updateSettings ===
          "function"
        ) {
          await adminService.updateSettings(
            settings
          );
        }
      } catch (error) {
        console.log(
          "Backend settings save failed:",
          error
        );
      }


      setMessage(
        "Settings saved successfully."
      );

    } catch (error) {
      console.error(
        "Failed to save settings:",
        error
      );

      setMessage(
        "Settings updated locally."
      );

    } finally {
      setSaving(false);
    }
  }


  /* =======================================================
     RESET SETTINGS
  ======================================================= */

  function resetSettings() {
  setSettings(DEFAULT_SETTINGS);

  applyTheme(DEFAULT_SETTINGS.themeColor);

  applyAppearanceMode(DEFAULT_SETTINGS.themeMode);

  applyFontSize(DEFAULT_SETTINGS.fontSize);

  localStorage.setItem(
    "mone_theme_color",
    DEFAULT_SETTINGS.themeColor
  );

  localStorage.setItem(
    "mone_theme_mode",
    DEFAULT_SETTINGS.themeMode
  );

  localStorage.setItem(
    "mone_font_size",
    String(DEFAULT_SETTINGS.fontSize)
  );

  setMessage(
    "Settings reset to default values."
  );
}
  /* =======================================================
     SIDEBAR ITEMS
  ======================================================= */

  const sections = [
    {
      id: "general",
      label: "General",
      icon: <FaGlobe />,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <FaPalette />,
    },
    {
      id: "security",
      label: "Security",
      icon: <FaShieldAlt />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <FaBell />,
    },
    {
      id: "ai",
      label: "AI Configuration",
      icon: <FaRobot />,
    },
    {
      id: "system",
      label: "System",
      icon: <FaServer />,
    },
  ];


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="ps-loading">
        Loading platform settings...
      </div>
    );
  }


  return (
    <div className="platform-settings ps-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <PageHeader
        title="Platform Settings"
        subtitle="Configure and manage your MONE AI Admin Dashboard."
        actions={
          <div className="ps-header-status">
            <span className="ps-status-dot" />
            <span>Platform Online</span>
          </div>
        }
      />


      {/* ===================================================
          MAIN LAYOUT
      =================================================== */}

      <div className="ps-layout">


        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="ps-sidebar">

          <div className="ps-sidebar-title">

            <div className="ps-sidebar-icon">
              <FaCog />
            </div>

            <div>
              <strong>Settings</strong>
              <span>Platform controls</span>
            </div>

          </div>


          <div className="ps-sidebar-menu">

            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={
                  activeSection === section.id
                    ? "ps-sidebar-item active"
                    : "ps-sidebar-item"
                }
                onClick={() =>
                  setActiveSection(section.id)
                }
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            ))}

          </div>


          <div className="ps-sidebar-online">

            <FaCheckCircle />

            <div>
              <strong>
                Platform Online
              </strong>

              <span>
                All systems operational
              </span>
            </div>

          </div>

        </aside>


        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="ps-content">


          {/* =================================================
              GENERAL
          ================================================= */}

          {activeSection === "general" && (
            <SettingsCard
              icon={<FaCog />}
              title="General"
              subtitle="Basic platform configuration."
            >

              <div className="ps-form-grid">

                <SettingField
                  label="Platform Name"
                  icon={<FaGlobe />}
                >
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) =>
                      updateSetting(
                        "platformName",
                        e.target.value
                      )
                    }
                  />
                </SettingField>


                <SettingField
                  label="Support Email"
                  icon={<FaEnvelope />}
                >
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) =>
                      updateSetting(
                        "supportEmail",
                        e.target.value
                      )
                    }
                  />
                </SettingField>


                <SettingField
                  label="Default Currency"
                  icon={<FaGlobe />}
                >
                  <CustomSelect
                    fullWidth
                    value={settings.defaultCurrency}
                    onChange={(val) =>
                      updateSetting(
                        "defaultCurrency",
                        val
                      )
                    }
                    options={[
                      { value: "INR", label: "INR - Indian Rupee" },
                      { value: "USD", label: "USD - US Dollar" },
                      { value: "EUR", label: "EUR - Euro" },
                      { value: "GBP", label: "GBP - British Pound" },
                    ]}
                  />
                </SettingField>


                <SettingField
                  label="Timezone"
                  icon={<FaGlobe />}
                >
                  <CustomSelect
                    fullWidth
                    value={settings.timezone}
                    onChange={(val) =>
                      updateSetting(
                        "timezone",
                        val
                      )
                    }
                    options={[
                      { value: "Asia/Kolkata", label: "Asia/Kolkata" },
                      { value: "UTC", label: "UTC" },
                      { value: "America/New_York", label: "America/New_York" },
                      { value: "Europe/London", label: "Europe/London" },
                    ]}
                  />
                </SettingField>

              </div>


              <div className="ps-toggle-list">

                <ToggleRow
                  icon={<FaUserPlus />}
                  title="Allow User Registration"
                  description="Allow new users to create accounts."
                  checked={
                    settings.allowUserRegistration
                  }
                  onChange={(value) =>
                    updateSetting(
                      "allowUserRegistration",
                      value
                    )
                  }
                />

                <ToggleRow
                  icon={<FaEnvelope />}
                  title="Require Email Verification"
                  description="Require users to verify their email."
                  checked={
                    settings.requireEmailVerification
                  }
                  onChange={(value) =>
                    updateSetting(
                      "requireEmailVerification",
                      value
                    )
                  }
                />

              </div>

            </SettingsCard>
          )}


          {/* =================================================
              APPEARANCE
          ================================================= */}

          {activeSection === "appearance" && (
            <SettingsCard
              icon={<FaPalette />}
              title="Appearance"
              subtitle="Customize the visual identity of your Admin Dashboard."
            >


              {/* THEME BANNER */}

              <div className="ps-theme-banner">

                <div className="ps-theme-banner-icon">
                  <FaPalette />
                </div>

                <div>
                  <strong>
                    Admin Dashboard Theme
                  </strong>

                  <span>
                    This colour is applied globally
                    across the Admin Dashboard.
                  </span>
                </div>

              </div>


              {/* COLOUR */}

              <div className="ps-colour-section">

                <div className="ps-colour-left">

                  <h3>
                    Choose primary colour
                  </h3>

                  <div className="ps-colour-picker">

                    <input
                      type="color"
                      value={settings.themeColor}
                      onChange={(e) =>
                        selectColor(
                          e.target.value
                        )
                      }
                    />

                    <div>
                      <strong>
                        {settings.themeColor.toUpperCase()}
                      </strong>

                      <span>
                        Click the colour box to
                        choose any colour.
                      </span>
                    </div>

                  </div>

                </div>


                <div className="ps-quick-colours">

                  <h3>
                    Quick colours
                  </h3>

                  <div className="ps-colour-grid">

                    {COLOR_PRESETS.map(
                      (color) => (
                        <button
                          key={color}
                          type="button"
                          className={
                            settings.themeColor.toLowerCase() ===
                            color.toLowerCase()
                              ? "ps-colour-swatch active"
                              : "ps-colour-swatch"
                          }
                          style={{
                            backgroundColor:
                              color,
                          }}
                          onClick={() =>
                            selectColor(
                              color
                            )
                          }
                          aria-label={`Select ${color}`}
                        />
                      )
                    )}

                  </div>

                </div>

              </div>


              {/* LIVE PREVIEW */}

              <div className="ps-live-preview">

                <div className="ps-preview-header">
                  <span>
                    Live Preview
                  </span>

                  <small>
                    Updates instantly
                  </small>
                </div>


                <div className="ps-preview-body">

                  <button
                    type="button"
                    className="ps-preview-button"
                    style={{
                      backgroundColor:
                        settings.themeColor,
                    }}
                  >
                    Primary Button
                  </button>


                  <span
                    className="ps-preview-badge"
                    style={{
                      color:
                        settings.themeColor,
                      backgroundColor:
                        `${settings.themeColor}18`,
                    }}
                  >
                    Active
                  </span>


                  <div
                    className="ps-preview-line"
                    style={{
                      backgroundColor:
                        settings.themeColor,
                    }}
                  />

                </div>

              </div>


              {/* APPEARANCE MODE */}

              <div className="ps-appearance-option">

                <div className="ps-appearance-option-header">

                  <div className="ps-appearance-option-icon">
                    {settings.themeMode === "dark"
                      ? <FaMoon />
                      : <FaSun />
                    }
                  </div>

                  <div>
                    <strong>
                      Appearance Mode
                    </strong>

                    <span>
                      Choose how the Admin Dashboard looks.
                    </span>
                  </div>

                </div>


                <div className="ps-mode-options">

                  {/* LIGHT */}

                  <button
                    type="button"
                    className={
                      settings.themeMode === "light"
                        ? "ps-mode-card active"
                        : "ps-mode-card"
                    }
                    onClick={() => {
                      updateSetting(
                        "themeMode",
                        "light"
                      );

                      applyAppearanceMode(
                        "light"
                      );
                    }}
                  >

                    <div className="ps-mode-icon light">
                      <FaSun />
                    </div>

                    <div className="ps-mode-card-content">
                      <strong>
                        Light Mode
                      </strong>

                      <span>
                        Bright and clean interface
                      </span>
                    </div>

                    {settings.themeMode ===
                      "light" && (
                      <FaCheckCircle className="ps-mode-check" />
                    )}

                  </button>


                  {/* DARK */}

                  <button
                    type="button"
                    className={
                      settings.themeMode === "dark"
                        ? "ps-mode-card active"
                        : "ps-mode-card"
                    }
                    onClick={() => {
                      updateSetting(
                        "themeMode",
                        "dark"
                      );

                      applyAppearanceMode(
                        "dark"
                      );
                    }}
                  >

                    <div className="ps-mode-icon dark">
                      <FaMoon />
                    </div>

                    <div className="ps-mode-card-content">
                      <strong>
                        Dark Mode
                      </strong>

                      <span>
                        Comfortable for low-light environments
                      </span>
                    </div>

                    {settings.themeMode ===
                      "dark" && (
                      <FaCheckCircle className="ps-mode-check" />
                    )}

                  </button>

                </div>

              </div>


              {/* FONT SIZE */}
              {/* =========================================================
    FONT SIZE
========================================================= */}

<div className="ps-appearance-option">

  <div className="ps-appearance-option-header">

    <div className="ps-appearance-option-icon">
      <FaTextHeight />
    </div>

    <div>
      <strong>Font Size</strong>

      <span>
        Choose the base font size for the Admin Dashboard.
      </span>
    </div>

  </div>


  <div className="ps-font-scale-box">
    <div className="ps-font-scale-top">
      <div>
        <strong>Dashboard Font Size</strong>
        <span>Move the slider to adjust the text size.</span>
      </div>

      <div className="ps-font-size-value">
        {Math.round(Number(settings.fontSize) || 16)}px
      </div>
    </div>

    <input
      type="range"
      min="12"
      max="24"
      step="0.25"
      value={Number(settings.fontSize) || 16}
      onChange={(e) => {
        const val = parseFloat(e.target.value);
        updateSetting("fontSize", val);
        applyFontSize(val);
      }}
      onInput={(e) => {
        const val = parseFloat(e.target.value);
        updateSetting("fontSize", val);
        applyFontSize(val);
      }}
      className="ps-font-slider"
      style={{
        background: `linear-gradient(to right, var(--primary-color, #ff6500) 0%, var(--primary-color, #ff6500) ${Math.max(
          0,
          Math.min(100, (((Number(settings.fontSize) || 16) - 12) / (24 - 12)) * 100)
        )}%, var(--ps-slider-empty, #e5ded6) ${Math.max(
          0,
          Math.min(100, (((Number(settings.fontSize) || 16) - 12) / (24 - 12)) * 100)
        )}%, var(--ps-slider-empty, #e5ded6) 100%)`,
      }}
    />

    <div className="ps-font-scale-labels">
      <span>12px</span>
      <span>16px</span>
      <span>20px</span>
      <span>24px</span>
    </div>

    <div className="ps-font-example">
      <span
        style={{
          fontSize: `${Number(settings.fontSize) || 16}px`,
          transition: "font-size 0.08s ease-out",
        }}
      >
        Aa
      </span>

      <div>
        <strong
          style={{
            fontSize: `${Math.round((Number(settings.fontSize) || 16) * 0.95)}px`,
            transition: "font-size 0.08s ease-out",
          }}
        >
          Example Text ({Math.round(Number(settings.fontSize) || 16)}px)
        </strong>

        <p
          style={{
            fontSize: `${Math.round((Number(settings.fontSize) || 16) * 0.82)}px`,
            transition: "font-size 0.08s ease-out",
          }}
        >
          This is how your dashboard text will appear.
        </p>
      </div>
    </div>
  </div>

</div>

              

              

            </SettingsCard>
          )}


          {/* =================================================
              SECURITY
          ================================================= */}

          {activeSection === "security" && (
            <SettingsCard
              icon={<FaShieldAlt />}
              title="Security"
              subtitle="Configure account and authentication security."
            >

              <div className="ps-form-grid">

                <SettingField
                  label="Maximum Login Attempts"
                  icon={<FaLock />}
                >
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.maxLoginAttempts}
                    onChange={(e) =>
                      updateSetting(
                        "maxLoginAttempts",
                        Number(e.target.value)
                      )
                    }
                  />
                </SettingField>

              </div>


              <div className="ps-toggle-list">

                <ToggleRow
                  icon={<FaEnvelope />}
                  title="Email Verification"
                  description="Require users to verify their email address."
                  checked={
                    settings.requireEmailVerification
                  }
                  onChange={(value) =>
                    updateSetting(
                      "requireEmailVerification",
                      value
                    )
                  }
                />

              </div>

            </SettingsCard>
          )}


          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          {activeSection === "notifications" && (
            <SettingsCard
              icon={<FaBell />}
              title="Notifications"
              subtitle="Control platform notification preferences."
            >

              <div className="ps-toggle-list">

                <ToggleRow
                  icon={<FaEnvelope />}
                  title="Email Notifications"
                  description="Send important platform notifications through email."
                  checked={
                    settings.emailNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "emailNotifications",
                      value
                    )
                  }
                />


                <ToggleRow
                  icon={<FaBell />}
                  title="Push Notifications"
                  description="Allow push notifications for supported devices."
                  checked={
                    settings.pushNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "pushNotifications",
                      value
                    )
                  }
                />


                <ToggleRow
                  icon={<FaBell />}
                  title="System Notifications"
                  description="Display system and platform notifications."
                  checked={
                    settings.systemNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "systemNotifications",
                      value
                    )
                  }
                />

              </div>

            </SettingsCard>
          )}


          {/* =================================================
              AI
          ================================================= */}

          {activeSection === "ai" && (
            <SettingsCard
              icon={<FaRobot />}
              title="AI Configuration"
              subtitle="Manage AI services and usage limits."
            >

              <div className="ps-ai-banner">

                <div className="ps-ai-icon">
                  <FaBrain />
                </div>

                <div>
                  <strong>
                    MONE AI Services
                  </strong>

                  <span>
                    Configure AI availability and usage.
                  </span>
                </div>

              </div>


              <div className="ps-form-grid">

                <SettingField
                  label="AI Usage Limit"
                  icon={<FaRobot />}
                >
                  <input
                    type="number"
                    min="0"
                    value={settings.aiUsageLimit}
                    onChange={(e) =>
                      updateSetting(
                        "aiUsageLimit",
                        Number(e.target.value)
                      )
                    }
                  />
                </SettingField>

              </div>


              <div className="ps-toggle-list">

                <ToggleRow
                  icon={<FaRobot />}
                  title="Enable AI Services"
                  description="Allow AI-powered features across the platform."
                  checked={
                    settings.aiEnabled
                  }
                  onChange={(value) =>
                    updateSetting(
                      "aiEnabled",
                      value
                    )
                  }
                />

              </div>

            </SettingsCard>
          )}


          {/* =================================================
              SYSTEM
          ================================================= */}

          {activeSection === "system" && (
            <SettingsCard
              icon={<FaServer />}
              title="System"
              subtitle="Manage maintenance and system behaviour."
            >

              <div className="ps-toggle-list">

                <ToggleRow
                  icon={<FaWrench />}
                  title="Maintenance Mode"
                  description="Temporarily restrict access while maintenance is being performed."
                  checked={
                    settings.maintenanceMode
                  }
                  onChange={(value) =>
                    updateSetting(
                      "maintenanceMode",
                      value
                    )
                  }
                />

              </div>


              <SettingField
                label="Maintenance Message"
                icon={<FaWrench />}
              >
                <textarea
                  rows="4"
                  value={
                    settings.maintenanceMessage
                  }
                  onChange={(e) =>
                    updateSetting(
                      "maintenanceMessage",
                      e.target.value
                    )
                  }
                />
              </SettingField>

            </SettingsCard>
          )}

        </main>

      </div>


      {/* ===================================================
          SAVE BAR
      =================================================== */}

      <div className="ps-save-bar">

        <div className="ps-save-message">

          <div className="ps-save-icon">
            <FaSave />
          </div>

          <div>
            <strong>
              Configuration changes
            </strong>

            <span>
              {message ||
                "Save your changes to apply them across the Admin Dashboard."}
            </span>
          </div>

        </div>


        <div className="ps-save-actions">

          <button
            type="button"
            className="ps-reset-button"
            onClick={resetSettings}
          >
            <FaUndo />
            Reset
          </button>


          <button
            type="button"
            className="ps-save-button"
            onClick={saveSettings}
            disabled={saving}
          >
            <FaSave />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SETTINGS CARD
========================================================= */

function SettingsCard({
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="ps-card">

      <div className="ps-card-header">

        <div className="ps-card-header-icon">
          {icon}
        </div>

        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

      </div>


      <div className="ps-card-body">
        {children}
      </div>

    </section>
  );
}


/* =========================================================
   SETTING FIELD
========================================================= */

function SettingField({
  label,
  icon,
  children,
}) {
  return (
    <div className="ps-field">

      <label>

        <span className="ps-field-icon">
          {icon}
        </span>

        {label}

      </label>

      {children}

    </div>
  );
}


/* =========================================================
   TOGGLE ROW
========================================================= */

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="ps-toggle-row">

      <div className="ps-toggle-info">

        <div className="ps-toggle-icon">
          {icon}
        </div>

        <div>
          <strong>{title}</strong>

          <span>
            {description}
          </span>
        </div>

      </div>


      <button
        type="button"
        className={
          checked
            ? "ps-toggle active"
            : "ps-toggle"
        }
        onClick={() =>
          onChange(!checked)
        }
        aria-pressed={checked}
      >

        <span />

      </button>

    </div>
  );
}