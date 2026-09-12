import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import "./styles.css";
import "./chrome-flat.css";
import "./dark-mode.css";
import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";

// ─── Shared helper: apply a hex accent color to ALL CSS tokens ───────────────
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

function hexToDarker(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.max(0, r - 35)}, ${Math.max(0, g - 35)}, ${Math.max(0, b - 35)})`;
}

function applyAccentColor(color) {
  if (!color || !color.startsWith("#")) return;

  try {
    localStorage.setItem("mone_theme_color", color);
  } catch (e) {
    console.error("Failed to save mone_theme_color to localStorage", e);
  }

  const root = document.documentElement;
  const { r, g, b } = hexToRgb(color);

  // Primary token & accent alias — single source of truth
  root.style.setProperty("--primary-color", color);
  root.style.setProperty("--accent", color);

  // RGB triplet for rgba() usage: rgba(var(--primary-color-rgb), 0.12)
  root.style.setProperty("--primary-color-rgb", `${r}, ${g}, ${b}`);

  // Derived tokens
  const darker = `rgb(${Math.max(0, r - 35)}, ${Math.max(0, g - 35)}, ${Math.max(0, b - 35)})`;
  root.style.setProperty("--primary-hover",     darker);
  root.style.setProperty("--primary-light",     `rgba(${r}, ${g}, ${b}, 0.18)`);
  root.style.setProperty("--primary-border",    `rgba(${r}, ${g}, ${b}, 0.28)`);
  root.style.setProperty("--accent-soft",       `rgba(${r}, ${g}, ${b}, 0.15)`);

  // Soft background tints used for selected states, hover backgrounds, badges
  root.style.setProperty("--primary-bg-soft",   `rgba(${r}, ${g}, ${b}, 0.06)`);
  root.style.setProperty("--primary-bg-mid",    `rgba(${r}, ${g}, ${b}, 0.10)`);
  root.style.setProperty("--primary-bg-strong", `rgba(${r}, ${g}, ${b}, 0.18)`);

  // Module-specific color and soft tint aliases
  root.style.setProperty("--dash-orange", color);
  root.style.setProperty("--dash-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty("--dash-orange-pale", `rgba(${r}, ${g}, ${b}, 0.06)`);

  root.style.setProperty("--todo-orange", color);
  root.style.setProperty("--todo-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty("--todo-orange-pale", `rgba(${r}, ${g}, ${b}, 0.06)`);

  root.style.setProperty("--plan-orange", color);
  root.style.setProperty("--plan-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty("--plan-orange-light", `rgba(${r}, ${g}, ${b}, 0.08)`);

  root.style.setProperty("--sub-orange", color);
  root.style.setProperty("--sub-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty("--sub-orange-pale", `rgba(${r}, ${g}, ${b}, 0.06)`);

  root.style.setProperty("--cal-orange", color);
  root.style.setProperty("--cal-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty("--cal-orange-pale", `rgba(${r}, ${g}, ${b}, 0.06)`);

  root.style.setProperty("--med-orange", color);
  root.style.setProperty("--med-orange-dark", darker);
  root.style.setProperty("--med-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty("--med-orange-pale", `rgba(${r}, ${g}, ${b}, 0.06)`);
  root.style.setProperty("--med-orange-light", `rgba(${r}, ${g}, ${b}, 0.08)`);

  root.style.setProperty("--set-orange", color);
  root.style.setProperty("--set-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);

  root.style.setProperty("--ud-orange", color);
  root.style.setProperty("--ud-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);

  root.style.setProperty("--nt-orange", color);
  root.style.setProperty("--nt-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty("--nt-orange-pale", `rgba(${r}, ${g}, ${b}, 0.06)`);

  root.style.setProperty("--widget-orange", color);
  root.style.setProperty("--widget-accent", color);
  root.style.setProperty("--admin-accent", color);

  root.style.setProperty("--health-orange", color);
  root.style.setProperty("--health-orange-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty("--health-orange-pale", `rgba(${r}, ${g}, ${b}, 0.06)`);

  // Button design system tokens
  root.style.setProperty("--btn-primary-bg", color);
  root.style.setProperty("--btn-primary-bg-hover", darker);
  root.style.setProperty("--btn-primary-border", color);
  root.style.setProperty("--btn-secondary-color-hv", color);
  root.style.setProperty("--btn-secondary-border-hv", color);

  // Update SVG dropdown arrow (data URI can't use CSS vars)
  const encoded = color.replace("#", "%23");
  const svgArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${encoded}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
  root.style.setProperty("--select-arrow-icon", svgArrow);
}

// Initialize theme settings on application startup
try {
  const savedMode = localStorage.getItem("mone_theme_mode");
  if (savedMode === "dark") {
    document.documentElement.classList.add("dark-mode");
    document.body.classList.add("dark-mode");
  } else if (savedMode === "light") {
    document.documentElement.classList.remove("dark-mode");
    document.body.classList.remove("dark-mode");
  }

  // Always apply an accent color — defaults to brand orange so all CSS vars are defined
  const savedColor = localStorage.getItem("mone_theme_color") || "#ff6500";
  applyAccentColor(savedColor);

  const savedFont = localStorage.getItem("mone_font_size");
  if (savedFont) {
    document.documentElement.style.setProperty(
      "--base-font-size",
      `${savedFont}px`,
    );
  }
} catch (e) {
  console.error("Theme boot initialization error:", e);
}

// Export for use by PlatformSettingsPage (attached to window for simplicity)
window.__applyAccentColor = applyAccentColor;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>

      <App />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

    </BrowserRouter>
  </React.StrictMode>
);