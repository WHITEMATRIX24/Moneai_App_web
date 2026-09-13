// src/pages/LandingPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Wallet,
  Brain,
  HeartPulse,
  CheckCircle2,
  LogIn,
  ChevronDown,
} from "lucide-react";
import { getStoredToken, getAccountType } from "../services/auth.service.js";
import "./LandingPage.css";

const MODULES = [
  {
    id: "finance",
    tone: "finance",
    icon: Wallet,
    name: "Finance",
    metric: "14.2 mo",
    metricLabel: "runway, forecast",
  },
  {
    id: "health",
    tone: "health",
    icon: HeartPulse,
    name: "Health 360°",
    metric: "58 bpm",
    metricLabel: "resting heart rate",
  },
  {
    id: "ai",
    tone: "ai",
    icon: Brain,
    name: "Autonomous AI",
    metric: "3 tasks",
    metricLabel: "automated today",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [accountType, setAccountType] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const t = getStoredToken();
    const a = getAccountType();
    setToken(t);
    setAccountType(a);
  }, []);

  const handlePortalAction = () => {
    if (token) {
      if (accountType === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/login");
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openModule = (id) => {
    setActiveTab(id);
    scrollToSection("platform-brief");
  };

  return (
    <div className="wave-landing-container">
      {/* ============================================================
          1. HERO
      ============================================================ */}
      <section className="wave-hero-section">
        <div className="wave-svg-wrapper" aria-hidden="true" />

        {/* ==========================================================
            HEADER
        ========================================================== */}
        <header className="wave-header">
          <div className="wave-brand" onClick={() => navigate("/")}>
            <div className="wave-brand-info">
              <span className="wave-brand-title">Mone<span className="brand-dot"> </span>ai</span>
              <span className="wave-brand-subtitle">Enterprise Platform</span>
            </div>
          </div>

          <nav className="wave-nav-capsule">
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("platform-brief");
              }}
              className="wave-nav-link"
            >
              About
            </a>
            <a
              href="#finance"
              onClick={(e) => {
                e.preventDefault();
                openModule("finance");
              }}
              className="wave-nav-link"
            >
              Finance
            </a>
            <a
              href="#health"
              onClick={(e) => {
                e.preventDefault();
                openModule("health");
              }}
              className="wave-nav-link"
            >
              Health 360°
            </a>
            <a
              href="#ai"
              onClick={(e) => {
                e.preventDefault();
                openModule("ai");
              }}
              className="wave-nav-link"
            >
              Autonomous AI
            </a>
            <a
              href="#security"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("security");
              }}
              className="wave-nav-link"
            >
              Security
            </a>
          </nav>

          <div className="wave-header-actions">
            {token ? (
              <button
                type="button"
                className="wave-header-btn btn-primary"
                onClick={handlePortalAction}
              >
                <span>Dashboard</span>
              </button>
            ) : (
              <div className="wave-auth-group">
                <Link to="/login" className="wave-header-btn btn-login">
                  <LogIn size={15} />
                  <span>Log in</span>
                </Link>
                <Link to="/signup" className="wave-header-btn btn-signup">
                  <span>Sign up</span>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* ==========================================================
            HERO BODY: copy on the left, live status panel on the right
        ========================================================== */}
        <div className="wave-hero-body">
          <div className="wave-hero-content">
            <h1 className="wave-main-title">
              Run your life with the rigor of a trading floor.
              <span className="wave-sub-title">
                Finance, health, and AI — read continuously, in one place.
              </span>
            </h1>

            <p className="wave-description">
              Mone AI is the executive command center that unifies
              autonomous personal finance, clinical-grade biometric health
              monitoring, and proactive AI workflows into a single
              high-performance view of your life.
            </p>

            <div className="wave-action-row">
              <button
                type="button"
                className="wave-secondary-pill-btn"
                onClick={handlePortalAction}
              >
                <span>{token ? "Open workspace" : "Get started"}</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                className="wave-outline-pill-btn"
                onClick={() => scrollToSection("platform-brief")}
              >
                <span>See how it works</span>
              </button>
            </div>
          </div>

          <div className="wave-readout-panel">
            <div className="wave-readout-heading">
              <span>Live system status</span>
              <span className="readout-live-dot" title="Streaming" />
            </div>

            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  type="button"
                  key={mod.id}
                  className={`readout-module ${
                    activeTab === mod.id ? "active" : ""
                  }`}
                  data-tone={mod.tone}
                  onClick={() => openModule(mod.id)}
                >
                  <div className="readout-module-top">
                    <span className="readout-module-name">
                      <Icon size={16} />
                      {mod.name}
                    </span>
                    <span className="readout-metric">{mod.metric}</span>
                  </div>
                  <span className="readout-metric-label">
                    {mod.metricLabel}
                  </span>
                  <div className="readout-bar-track">
                    <div className="readout-bar-fill" />
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              className="readout-footer-link"
              onClick={() => openModule("all")}
            >
              View full platform brief
            </button>
          </div>
        </div>

        <div
          className="wave-scroll-hint"
          onClick={() => scrollToSection("platform-brief")}
        >
          <span>View platform capabilities</span>
          <ChevronDown size={18} className="bounce-arrow" />
        </div>
      </section>

      {/* ============================================================
          2. PLATFORM BRIEF & CAPABILITIES
      ============================================================ */}
      <section className="wave-brief-section" id="platform-brief">
        <div className="brief-container">
          <div className="brief-header">
            <h2>An integrated intelligence platform</h2>
            <p>
              Built for high-performing executives, administrators, and
              teams. Here is a concise overview of what Mone AI does.
            </p>
          </div>

          <div className="brief-tabs">
            <button
              className={`brief-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All modules
            </button>
            <button
              className={`brief-tab-btn ${activeTab === "finance" ? "active" : ""}`}
              onClick={() => setActiveTab("finance")}
            >
              Finance OS
            </button>
            <button
              className={`brief-tab-btn ${activeTab === "health" ? "active" : ""}`}
              onClick={() => setActiveTab("health")}
            >
              Health 360°
            </button>
            <button
              className={`brief-tab-btn ${activeTab === "ai" ? "active" : ""}`}
              onClick={() => setActiveTab("ai")}
            >
              Autonomous AI
            </button>
          </div>

          <div className="brief-grid">
            {(activeTab === "all" || activeTab === "finance") && (
              <div className="brief-card card-finance">
                <div className="brief-card-icon">
                  <Wallet size={20} />
                </div>
                <h3>Autonomous Finance OS</h3>
                <p>
                  Comprehensive multi-currency cash flow tracking, ledger
                  consolidation, predictive runway forecasting, and instant
                  financial health indexing.
                </p>
                <div className="brief-card-highlights">
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span>Real-time transaction categorization</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span>Predictive recurring expense alerts</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span>Cross-account multi-currency ledger</span>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "all" || activeTab === "health") && (
              <div className="brief-card card-health">
                <div className="brief-card-icon">
                  <HeartPulse size={20} />
                </div>
                <h3>Biometric Health 360°</h3>
                <p>
                  Clinical-grade health management tracking 12+ vital
                  submodules, including vital signs, sleep cycles, fitness
                  workouts, and nutrition.
                </p>
                <div className="brief-card-highlights">
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span>12+ clinical monitoring submodules</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span>Instant vitals anomaly detection</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span>Seamless one-tap quick log</span>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "all" || activeTab === "ai") && (
              <div className="brief-card card-ai">
                <div className="brief-card-icon">
                  <Brain size={20} />
                </div>
                <h3>Multimodal AI Workflows</h3>
                <p>
                  Autonomous agentic intelligence with conversational natural
                  language, voice-to-text integration, and proactive
                  lifestyle recommendations.
                </p>
                <div className="brief-card-highlights">
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span>Voice-to-text logging and commands</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span>Proactive correlation analysis</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span>Autonomous report generation</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="brief-stats-strip">
            <div className="stat-unit">
              <strong>12+</strong>
              <span>Clinical submodules</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-unit">
              <strong>100%</strong>
              <span>Real-time sync</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-unit">
              <strong>AES-256</strong>
              <span>Enterprise encryption</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-unit">
              <strong>99.99%</strong>
              <span>Uptime SLA</span>
            </div>
          </div>

          <div className="brief-cta-banner" id="security">
            <div className="banner-text">
              <h3>Experience the Mone AI platform live</h3>
              <p>
                Log in with your enterprise credentials or contact our team
                for a personalized walk-through.
              </p>
            </div>
            <div className="banner-buttons">
              <button
                type="button"
                className="banner-primary-btn"
                onClick={handlePortalAction}
              >
                <span>{token ? "Launch dashboard" : "Go to login"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. FOOTER
      ============================================================ */}
      <footer className="wave-footer">
        <div className="footer-inner">
          <div className="footer-col-brand">
            <strong>Mone AI Enterprise</strong>
            <p>© {new Date().getFullYear()} White Matrix. All rights reserved.</p>
          </div>
          <div className="footer-col-links">
            <Link to="/login">Account login</Link>
            <Link to="/signup">Register account</Link>
            <a
              href="#platform-brief"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("platform-brief");
              }}
            >
              Platform brief
            </a>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Back to top
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
