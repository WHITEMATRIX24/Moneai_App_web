// src/pages/AIAnalyticsPage.jsx
/**
 * =============================================================================
 * MONE AI - AI ANALYTICS & MONITORING CONSOLE
 * =============================================================================
 * Technical Documentation Reference: Module 5 (Section 11)
 *
 * This page organizes the 8 AI Analytics subdivisions into clean horizontal tabs.
 * Each subdivision is implemented as an isolated, independent component with
 * clean basic placeholders ready for backend/API integration.
 *
 * SUBDIVISIONS:
 * 1. AIKpiCards       -> Total requests, active users, token volume, latency, cost
 * 2. AIUsageChart     -> Input/output/total token trends & request volume
 * 3. AIModelUsage     -> Provider & model distribution (Qwen, Grok, GPT, Claude)
 * 4. AIFeatureUsage   -> Usage by feature/domain (Finance, Health, OCR, Tasks)
 * 5. AICostChart      -> Estimated provider cost trends & spend breakdown
 * 6. AIErrorTable     -> Provider & tool execution errors and status codes
 * 7. AIRecentRequests -> Live request activity stream and inspector
 * 8. AIUserUsage      -> High-usage users & plan distribution (Free/Pro/Enterprise)
 * =============================================================================
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePrimaryColor } from "../hooks/usePrimaryColor.js";
import { adminService } from "../services/admin.service.js";
import "./AIAnalyticsPage.css";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  Database,
  DollarSign,
  Download,
  Inbox,
  Layers,
  LayoutGrid,
  PieChart,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import {
  aiAnalyticsService,
  DEFAULT_AI_KPIS,
  DEFAULT_USAGE_TIMESERIES,
} from "../services/aiAnalytics.service.js";
import AICostChart from "../components/AICostChart.jsx";
import AIErrorTable from "../components/AIErrorTable.jsx";
import AIModelUsage from "../components/AIModelUsage.jsx";
import AIFeatureUsage from "../components/AIFeatureUsage.jsx";

// =============================================================================
// STATE PRIMITIVES: Skeletons, Error, and Empty States
// =============================================================================

function AIKpiCardsSkeleton() {
  return (
    <div className="ai-kpi-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-block ai-kpi-skeleton-card" />
      ))}
    </div>
  );
}

function AIUsageChartSkeleton() {
  return (
    <div className="ai-chart-skeleton-wrap">
      <div className="skeleton-block ai-chart-skeleton-strip" />
      <div className="skeleton-block ai-chart-skeleton-canvas" />
    </div>
  );
}

function AIErrorState({
  title = "Telemetry Ingestion Unavailable",
  message,
  onRetry,
}) {
  return (
    <div className="ai-error-state">
      <div className="ai-error-state__icon">
        <AlertCircle size={22} />
      </div>
      <h4 className="ai-error-state__title">{title}</h4>
      <p className="ai-error-state__message">
        {message || "An unexpected error occurred while communicating with the telemetry aggregator."}
      </p>
      {onRetry && (
        <button type="button" className="ai-error-state__retry-btn" onClick={onRetry}>
          <RefreshCw size={13} />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}

function AIEmptyState({
  title = "No Telemetry Data Recorded",
  description = "No AI requests have been captured for this monitoring window. Telemetry will automatically stream here when models are invoked.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="ai-empty-state">
      <div className="ai-empty-state__icon">
        <Inbox size={22} />
      </div>
      <h4 className="ai-empty-state__title">{title}</h4>
      <p className="ai-empty-state__desc">{description}</p>
      {onAction && (
        <button type="button" className="ai-empty-state__action-btn" onClick={onAction}>
          {actionLabel || "Verify Ingestion Config"}
        </button>
      )}
    </div>
  );
}

const ICON_MAP = {
  Zap,
  Users,
  Coins,
  DollarSign,
  Clock,
  CheckCircle2,
};

// =============================================================================
// SUBDIVISION 1: AI KPI CARDS
// Component: AIKpiCards
// =============================================================================
function Sparkline({ points = [], up = true, id = "spark" }) {
  if (!points || points.length < 2) return null;
  const h = 20;
  const w = 46;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((p) => h - ((p - min) / range) * (h * 0.75) - 3);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const fill = `${d} L${w},${h} L0,${h} Z`;
  const strokeColor = up ? "#10b981" : "#f59e0b";
  const gradId = `spk-${id}-${up ? "up" : "down"}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ overflow: "visible", flexShrink: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={d} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AIKpiCards({
  data = DEFAULT_AI_KPIS,
  loading = false,
  error = null,
  onRetry,
}) {
  return (
    <section className="ai-subdivision-card" id="module-kpi-cards">
      <div className="ai-subdivision-header">
        <div className="ai-subdivision-icon-badge">
          <Activity size={18} />
        </div>
        <div>
          <h3 className="ai-subdivision-title">Performance Overview</h3>
          <p className="ai-subdivision-subtitle">
            Real-time KPIs: requests, users, tokens, cost, latency &amp; reliability
          </p>
        </div>
      </div>

      {loading ? (
        <AIKpiCardsSkeleton />
      ) : error ? (
        <AIErrorState
          title="Failed to Load Performance Metrics"
          message={error}
          onRetry={onRetry}
        />
      ) : !data || data.length === 0 ? (
        <AIEmptyState
          title="No Performance Metrics Available"
          description="Telemetry pipeline is listening, but no metric events match the current filter."
        />
      ) : (
        <div className="ai-kpi-grid">
          {data.map((m) => {
            const Icon = m.icon || ICON_MAP[m.iconName] || Activity;
            const isDown = m.trend === "down";
            const isLatency = m.id === "latency";
            const isPositive = isLatency ? isDown : !isDown;

            return (
              <div key={m.id} className="ai-kpi-item">
                <div className="ai-kpi-item__top">
                  <div className="ai-kpi-icon-badge">
                    <Icon size={15} />
                  </div>
                  <span
                    className={`ai-kpi-trend-chip ${
                      isPositive ? "ai-kpi-trend-chip--up" : "ai-kpi-trend-chip--down"
                    }`}
                  >
                    {isDown ? (
                      <ArrowUpRight size={10} style={{ transform: "rotate(90deg)" }} />
                    ) : (
                      <ArrowUpRight size={10} />
                    )}
                    {m.change}
                  </span>
                </div>

                <div className="ai-kpi-item__value">{m.value}</div>
                <div className="ai-kpi-item__label" title={m.label}>{m.label}</div>

                <div className="ai-kpi-item__footer">
                  <span className="ai-kpi-item__subtext" title={m.subtext}>{m.subtext}</span>
                  {m.spark && <Sparkline points={m.spark} up={isPositive} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// =============================================================================
// SUBDIVISION 2: AI USAGE CHART
// Component: AIUsageChart
// =============================================================================

export function AIUsageChart({
  data = DEFAULT_USAGE_TIMESERIES,
  loading = false,
  error = null,
  onRetry,
  timeframe = "7d",
  onTimeframeChange,
}) {
  const [activeMetric, setActiveMetric] = useState("tokens");
  const [activeTimeframe, setActiveTimeframe] = useState(timeframe);
  const [hoveredBar, setHoveredBar] = useState(null);

  const handleTimeframe = (tf) => {
    setActiveTimeframe(tf);
    if (onTimeframeChange) onTimeframeChange(tf);
  };

  const isTokens = activeMetric === "tokens";
  const tokenUnit = data?.unit || (isTokens ? "K" : "");
  const chartData = data ? data[activeMetric] : null;
  const maxVal =
    chartData && chartData.length > 0
      ? Math.max(...chartData.map((d) => d.total))
      : 1;

  const summary = data?.summary || {
    thisPeriodTokens: "113.0K",
    thisPeriodRequests: "92",
    dailyAvgTokens: "37.7K",
    dailyAvgRequests: "31",
    peakDay: "Fri · 80.7K",
    tokenSplit: "95% / 5%",
  };

  return (
    <section className="ai-subdivision-card" id="module-usage-chart">
      {/* Header */}
      <div className="ai-subdivision-header">
        <div className="ai-subdivision-icon-badge">
          <BarChart3 size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="ai-subdivision-title">Usage &amp; Token Volume</h3>
          <p className="ai-subdivision-subtitle">
            {isTokens
              ? `Input / output token volume over time (${tokenUnit === "M" ? "millions" : "thousands"})`
              : "Total AI request volume over time"}
          </p>
        </div>
        {/* Timeframe switcher */}
        <div className="ai-pill-tabs">
          {["24h", "7d", "30d"].map((tf) => (
            <button
              key={tf}
              type="button"
              className={`ai-pill-btn ${activeTimeframe === tf ? "active" : ""}`}
              onClick={() => handleTimeframe(tf)}
            >
              {tf === "24h" ? "24 Hours" : tf === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <AIUsageChartSkeleton />
      ) : error ? (
        <AIErrorState
          title="Failed to Load Usage Time-Series"
          message={error}
          onRetry={onRetry}
        />
      ) : !chartData || chartData.length === 0 ? (
        <AIEmptyState
          title="No Usage Data for Timeframe"
          description="Try selecting a different time window (e.g. 30 Days) or trigger test requests."
        />
      ) : (
        <>
          {/* Metric switcher + legend */}
          <div className="ai-chart-toolbar">
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className={`ai-chart-metric-btn ${activeMetric === "tokens" ? "active" : ""}`}
                onClick={() => setActiveMetric("tokens")}
              >
                <Coins size={14} />
                Token Volume
              </button>
              <button
                type="button"
                className={`ai-chart-metric-btn ${activeMetric === "requests" ? "active" : ""}`}
                onClick={() => setActiveMetric("requests")}
              >
                <Zap size={14} />
                Request Count
              </button>
            </div>

            <div className="ai-chart-legend">
              {isTokens && (
                <>
                  <span className="legend-item">
                    <span className="legend-dot prompt-dot" style={{ background: "var(--primary-color, #ff6500)" }} /> Input
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot completion-dot" /> Output
                  </span>
                </>
              )}
              <span className="legend-item">
                <span className="legend-dot total-dot" /> {isTokens ? "Total" : "Requests"}
              </span>
            </div>
          </div>

          {/* Summary strip */}
          <div className="ai-chart-summary-strip">
            <div className="ai-chart-summary-item">
              <span className="ai-chart-summary-label">This Period</span>
              <strong className="ai-chart-summary-val">
                {isTokens ? summary.thisPeriodTokens : summary.thisPeriodRequests}
              </strong>
              <span className="ai-chart-summary-delta ai-positive">
                ↑ {isTokens ? "+24.2%" : "+18.4%"} vs prior
              </span>
            </div>
            <div className="ai-chart-summary-item">
              <span className="ai-chart-summary-label">Daily Avg</span>
              <strong className="ai-chart-summary-val">
                {isTokens ? summary.dailyAvgTokens : summary.dailyAvgRequests}
              </strong>
              <span className="ai-chart-summary-delta" style={{ color: "var(--muted)" }}>
                per day
              </span>
            </div>
            <div className="ai-chart-summary-item">
              <span className="ai-chart-summary-label">Peak Day</span>
              <strong className="ai-chart-summary-val">
                {summary.peakDay}
              </strong>
              <span className="ai-chart-summary-delta" style={{ color: "var(--muted)" }}>
                highest volume
              </span>
            </div>
            {isTokens && (
              <div className="ai-chart-summary-item">
                <span className="ai-chart-summary-label">Input / Output</span>
                <strong className="ai-chart-summary-val">{summary.tokenSplit}</strong>
                <span className="ai-chart-summary-delta" style={{ color: "var(--muted)" }}>
                  split ratio
                </span>
              </div>
            )}
          </div>

          {/* Chart canvas */}
          <div className="ai-chart-canvas">
            {/* Y-axis labels */}
            <div className="ai-chart-y-axis">
              {[100, 75, 50, 25, 0].map((pct) => (
                <span key={pct} className="ai-chart-y-label">
                  {pct === 0 ? "0" : `${((maxVal * pct) / 100).toFixed(0)}`}
                  {isTokens ? tokenUnit : ""}
                </span>
              ))}
            </div>

            {/* Grid + bars */}
            <div className="ai-chart-plot-area">
              {/* Grid lines */}
              <div className="ai-chart-grid">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <div key={pct} className="ai-chart-grid-line" />
                ))}
              </div>

              {/* Bar groups */}
              <div className="ai-chart-bars">
                {chartData.map((bar, idx) => {
                  const inputH = (bar.input / maxVal) * 100;
                  const outputH = (bar.output / maxVal) * 100;
                  const totalH = (bar.total / maxVal) * 100;
                  const isHovered = hoveredBar === idx;
                  return (
                    <div
                      key={idx}
                      className={`ai-chart-bar-group ${isHovered ? "hovered" : ""}`}
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="ai-chart-tooltip">
                          <div className="ai-chart-tooltip-label">
                            {bar.fullDate || bar.label}
                          </div>
                          {isTokens ? (
                            <>
                              <div className="ai-chart-tooltip-row">
                                <span className="ai-chart-tooltip-dot" style={{ background: "var(--primary-color, #ff6500)" }} />
                                <span>Input: <strong>{bar.input}{tokenUnit}</strong></span>
                              </div>
                              <div className="ai-chart-tooltip-row">
                                <span className="ai-chart-tooltip-dot" style={{ background: "#3b82f6" }} />
                                <span>Output: <strong>{bar.output}{tokenUnit}</strong></span>
                              </div>
                              <div className="ai-chart-tooltip-row">
                                <span className="ai-chart-tooltip-dot" style={{ background: "#00aa45" }} />
                                <span>Total: <strong>{bar.total}{tokenUnit}</strong></span>
                              </div>
                            </>
                          ) : (
                            <div className="ai-chart-tooltip-row">
                              <span className="ai-chart-tooltip-dot" style={{ background: "#00aa45" }} />
                              <span>Requests: <strong>{bar.total}</strong></span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stacked bars */}
                      <div className="ai-chart-bar-track">
                        {isTokens ? (
                          <>
                            <div
                              className="ai-chart-bar-seg ai-chart-bar-output"
                              style={{ height: `${outputH}%` }}
                            />
                            <div
                              className="ai-chart-bar-seg ai-chart-bar-input"
                              style={{ height: `${inputH}%` }}
                            />
                          </>
                        ) : (
                          <div
                            className="ai-chart-bar-seg ai-chart-bar-total"
                            style={{ height: `${totalH}%` }}
                          />
                        )}
                      </div>

                      {/* X label */}
                      <span className="ai-chart-bar-label">{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// =============================================================================
// TAB 1 SIDEBAR WIDGET: AIOverviewSummary
// Active models, execution modes & gateway health status
// =============================================================================

export function AIOverviewSummary({ data, loading }) {
  const models = data?.byModel || [
    { _id: "gemini-3.6-flash", count: 89, totalTokens: 110204 },
    { _id: "gemini-3.5-flash-lite", count: 2, totalTokens: 1852 },
    { _id: "default", count: 1, totalTokens: 900 },
  ];

  const totalReqs = models.reduce((a, b) => a + b.count, 0) || 1;

  const capabilities = data?.byRequestType || [
    { _id: "CHAT_TOOL", count: 38, totalTokens: 33102 },
    { _id: "CHAT", count: 22, totalTokens: 36504 },
    { _id: "CHAT_TOOL_CONFIRMED", count: 17, totalTokens: 26459 },
    { _id: "CHAT_STREAM", count: 12, totalTokens: 9649 },
    { _id: "CHAT_STREAM_TOOL", count: 3, totalTokens: 7242 },
  ];

  const totalCapTokens = capabilities.reduce((a, b) => a + b.totalTokens, 0) || 1;

  const formatTokens = (t) => {
    if (t >= 1_000_000) return (t / 1_000_000).toFixed(1) + "M";
    if (t >= 1_000) return (t / 1_000).toFixed(1) + "K";
    return t.toLocaleString();
  };

  return (
    <section className="ai-subdivision-card" id="module-overview-summary">
      <div className="ai-subdivision-header">
        <div className="ai-subdivision-icon-badge">
          <Cpu size={18} />
        </div>
        <div>
          <h3 className="ai-subdivision-title">Model Fleet &amp; Capabilities</h3>
          <p className="ai-subdivision-subtitle">
            Live telemetry breakdown across providers and runtime modes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-block" style={{ height: "300px", borderRadius: "12px" }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Active Model Breakdown */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Active Model Fleet ({models.length})
            </div>
            <div className="ai-model-list">
              {models.map((m) => {
                const share = Math.round((m.count / totalReqs) * 100);
                return (
                  <div key={m._id} className="ai-model-row">
                    <div className="ai-model-row__info">
                      <div className="ai-model-row__title-line">
                        <span className="ai-model-name">{m._id}</span>
                        <span className="ai-model-badge">{share}% volume</span>
                      </div>
                      <span className="ai-model-provider">{m.count} calls · {formatTokens(m.totalTokens)}</span>
                    </div>
                    <div className="ai-model-row__progress">
                      <div className="ai-model-bar-bg" style={{ flex: 1 }}>
                        <div className="ai-model-bar-fill" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution Capability Breakdown */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Execution Modes
            </div>
            <div className="ai-capability-list">
              {capabilities.slice(0, 4).map((c) => {
                const pct = Math.round((c.totalTokens / totalCapTokens) * 100);
                const isTool = c._id.includes("TOOL");
                const isStream = c._id.includes("STREAM");
                const tagClass = isTool ? "ai-req-tag--tool" : isStream ? "ai-req-tag--stream" : "ai-req-tag--chat";

                return (
                  <div key={c._id} className="ai-capability-item">
                    <div className="ai-capability-item__head">
                      <span className={`ai-req-tag ${tagClass}`}>{c._id}</span>
                      <span className="ai-capability-item__stat">
                        {c.count} calls · {formatTokens(c.totalTokens)} ({pct}%)
                      </span>
                    </div>
                    <div className="ai-capability-bar-bg">
                      <div className="ai-capability-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gateway Status */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Gateway &amp; Telemetry Status
            </div>
            <div className="ai-gateway-status-list">
              <div className="ai-gateway-status-item">
                <span className="ai-gateway-status-label">
                  <span className="ai-status-pulse-dot" />
                  Gemini API Gateway
                </span>
                <span className="ai-gateway-status-val">Operational · p95 710ms</span>
              </div>
              <div className="ai-gateway-status-item">
                <span className="ai-gateway-status-label">
                  <span className="ai-status-pulse-dot" />
                  MongoDB Atlas Telemetry
                </span>
                <span className="ai-gateway-status-val">Synced · 92 Events</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// =============================================================================
// TAB 2 HERO TILES: AITokenMetricsStrip
// =============================================================================

export function AITokenMetricsStrip({ data, loading }) {
  const summary = data?.summary;
  const byReq = data?.byRequestType || [];
  const totalPrompt = byReq.reduce((a, b) => a + (b.promptTokens || 0), 0) || 107545;
  const totalComp = byReq.reduce((a, b) => a + (b.completionTokens || 0), 0) || 3167;
  const totalTokens = totalPrompt + totalComp;
  const totalReqs = data?.requests?.reduce((a, b) => a + b.total, 0) || 92;

  const promptPct = totalTokens > 0 ? ((totalPrompt / totalTokens) * 100).toFixed(1) : "95.2";
  const compPct = totalTokens > 0 ? ((totalComp / totalTokens) * 100).toFixed(1) : "4.8";

  const formatTokens = (t) => {
    if (t >= 1_000_000) return (t / 1_000_000).toFixed(1) + "M";
    if (t >= 1_000) return (t / 1_000).toFixed(1) + "K";
    return t.toLocaleString();
  };

  const avgPerReq = totalReqs > 0 ? Math.round(totalTokens / totalReqs) : 1228;

  if (loading) {
    return (
      <div className="ai-token-stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-block ai-token-stat-card" style={{ height: "100px" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="ai-token-stats-grid">
      <div className="ai-token-stat-card">
        <div className="ai-token-stat-card__top">
          <span className="ai-token-stat-card__label">Prompt (Input) Tokens</span>
          <div className="ai-token-stat-card__icon"><Coins size={15} /></div>
        </div>
        <div className="ai-token-stat-card__val">{formatTokens(totalPrompt)}</div>
        <span className="ai-token-stat-card__sub">{promptPct}% of total volume</span>
      </div>

      <div className="ai-token-stat-card">
        <div className="ai-token-stat-card__top">
          <span className="ai-token-stat-card__label">Completion (Output) Tokens</span>
          <div className="ai-token-stat-card__icon"><Zap size={15} /></div>
        </div>
        <div className="ai-token-stat-card__val">{formatTokens(totalComp)}</div>
        <span className="ai-token-stat-card__sub">{compPct}% of total volume</span>
      </div>

      <div className="ai-token-stat-card">
        <div className="ai-token-stat-card__top">
          <span className="ai-token-stat-card__label">Total Token Ingest</span>
          <div className="ai-token-stat-card__icon"><Layers size={15} /></div>
        </div>
        <div className="ai-token-stat-card__val">{summary?.thisPeriodTokens || formatTokens(totalTokens)}</div>
        <span className="ai-token-stat-card__sub">Across {summary?.thisPeriodRequests || totalReqs} total requests</span>
      </div>

      <div className="ai-token-stat-card">
        <div className="ai-token-stat-card__top">
          <span className="ai-token-stat-card__label">Mean Token Density</span>
          <div className="ai-token-stat-card__icon"><BrainCircuit size={15} /></div>
        </div>
        <div className="ai-token-stat-card__val">{avgPerReq.toLocaleString()} <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted)" }}>/req</span></div>
        <span className="ai-token-stat-card__sub">Average tokens per request</span>
      </div>
    </div>
  );
}

// =============================================================================
// TAB 2 DEEP DIVE: AIRequestTypeBreakdown
// =============================================================================

export function AIRequestTypeBreakdown({ data, loading }) {
  const list = data?.byRequestType || [
    { _id: "CHAT_TOOL", count: 38, totalTokens: 33102, promptTokens: 31684, completionTokens: 1211 },
    { _id: "CHAT", count: 22, totalTokens: 36504, promptTokens: 33291, completionTokens: 1347 },
    { _id: "CHAT_TOOL_CONFIRMED", count: 17, totalTokens: 26459, promptTokens: 25924, completionTokens: 364 },
    { _id: "CHAT_STREAM", count: 12, totalTokens: 9649, promptTokens: 9431, completionTokens: 218 },
    { _id: "CHAT_STREAM_TOOL", count: 3, totalTokens: 7242, promptTokens: 7215, completionTokens: 27 },
  ];

  const totalTokens = list.reduce((a, b) => a + b.totalTokens, 0) || 1;

  const formatTokens = (t) => {
    if (t >= 1_000_000) return (t / 1_000_000).toFixed(1) + "M";
    if (t >= 1_000) return (t / 1_000).toFixed(1) + "K";
    return t.toLocaleString();
  };

  return (
    <section className="ai-subdivision-card" id="module-req-breakdown">
      <div className="ai-subdivision-header">
        <div className="ai-subdivision-icon-badge">
          <Layers size={18} />
        </div>
        <div>
          <h3 className="ai-subdivision-title">Token Ingestion by Capability</h3>
          <p className="ai-subdivision-subtitle">
            Token volume breakdown across execution capabilities and runtime modes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-block" style={{ height: "240px", borderRadius: "12px" }} />
      ) : (
        <div className="ai-capability-list">
          {list.map((item) => {
            const share = Math.round((item.totalTokens / totalTokens) * 100);
            const isTool = item._id.includes("TOOL");
            const isStream = item._id.includes("STREAM");
            const tagClass = isTool ? "ai-req-tag--tool" : isStream ? "ai-req-tag--stream" : "ai-req-tag--chat";

            return (
              <div key={item._id} className="ai-capability-item">
                <div className="ai-capability-item__head">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`ai-req-tag ${tagClass}`}>{item._id}</span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{item.count} events</span>
                  </div>
                  <span className="ai-capability-item__stat">
                    {formatTokens(item.totalTokens)} · {share}%
                  </span>
                </div>
                <div className="ai-capability-bar-bg">
                  <div className="ai-capability-bar-fill" style={{ width: `${share}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                  <span>In: {formatTokens(item.promptTokens)}</span>
                  <span>Out: {formatTokens(item.completionTokens)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// =============================================================================
// TAB 2 DEEP DIVE: AIRecentIngestionFeed
// =============================================================================

export function AIRecentIngestionFeed({ data, loading }) {
  const list = data?.recentRequests || [];

  return (
    <section className="ai-subdivision-card" id="module-recent-ingestion">
      <div className="ai-subdivision-header">
        <div className="ai-subdivision-icon-badge">
          <Clock size={18} />
        </div>
        <div>
          <h3 className="ai-subdivision-title">Live Ingestion Event Stream</h3>
          <p className="ai-subdivision-subtitle">
            Most recent AI model calls recorded in the MongoDB telemetry collection
          </p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-block" style={{ height: "240px", borderRadius: "12px" }} />
      ) : list.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
          No recent requests captured.
        </div>
      ) : (
        <div className="ai-table-container">
          <table className="ai-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Model</th>
                <th>Type</th>
                <th>Tokens</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, idx) => {
                const date = r.createdAt ? new Date(r.createdAt) : null;
                const timeStr = date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now";
                const isTool = (r.requestType || "").includes("TOOL");
                const isStream = (r.requestType || "").includes("STREAM");
                const tagClass = isTool ? "ai-req-tag--tool" : isStream ? "ai-req-tag--stream" : "ai-req-tag--chat";

                return (
                  <tr key={idx}>
                    <td style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {timeStr}
                    </td>
                    <td>
                      <span className="ai-model-name" style={{ fontSize: "12.5px" }}>{r.model}</span>
                    </td>
                    <td>
                      <span className={`ai-req-tag ${tagClass}`} style={{ fontSize: "10.5px" }}>
                        {r.requestType}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", fontWeight: 700 }}>{r.totalTokens}</span>
                      <span style={{ fontSize: "10.5px", color: "var(--muted)", marginLeft: "4px" }}>
                        ({r.promptTokens}/{r.completionTokens})
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)" }}>
                        ${(r.estimatedCost || 0).toFixed(4)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


// =============================================================================
// SUBDIVISION 3: AI MODEL USAGE
// Component: AIModelUsage (Imported from respective component file)
// =============================================================================
export { AIModelUsage };

// =============================================================================
// SUBDIVISION 4: AI FEATURE USAGE
// Component: AIFeatureUsage (Imported from respective component file)
// =============================================================================
export { AIFeatureUsage };

// =============================================================================
// SUBDIVISION 5: AI COST CHART
// Component: AICostChart (Imported from respective component file)
// =============================================================================
export { AICostChart };

// =============================================================================
// SUBDIVISION 6: AI ERROR TABLE
// Component: AIErrorTable (Imported from respective component file)
// =============================================================================
export { AIErrorTable };

// =============================================================================
// SUBDIVISION 7: AI RECENT REQUESTS
// Component: AIRecentRequests
// Scope:
//   - Recent AI request log stream connected to live backend telemetry
//   - Supports compact preview mode with 'View All' navigation button
//   - Request ID, Model, Feature, Latency (ms), Token count, and Status
// =============================================================================
export function AIRecentRequests({
  data: externalData,
  loading: externalLoading,
  isCompact = false,
  maxItems = 6,
  onViewAll,
}) {
  const [requests, setRequests] = useState(Array.isArray(externalData) ? externalData : []);
  const [loading, setLoading] = useState(externalLoading ?? (externalData === undefined));
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    // If parent passes data, use it directly — no redundant API call
    if (externalData !== undefined && externalData !== null) {
      setRequests(Array.isArray(externalData) ? externalData : []);
      setLoading(Boolean(externalLoading));
      return;
    }

    // Standalone mode: self-fetch from backend
    const loadRequests = async () => {
      try {
        setLoading(true);
        const res = await (adminService.getAIUsage ? adminService.getAIUsage() : adminService.aiUsage());
        setRequests(res?.data?.usage || []);
      } catch (error) {
        console.error("Failed to load AI usage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [externalData, externalLoading]);

  // Fallback demo requests if database has no telemetry events yet
  const defaultRequests = [
    {
      id: "REQ-847291",
      user: "user_7489@mone.ai",
      model: "Qwen 2.5",
      feature: "Finance Summary",
      totalTokens: 840,
      latency: 310,
      successful: true,
      time: "Just now",
    },
    {
      id: "REQ-847290",
      user: "sarah.m@gmail.com",
      model: "Grok-2",
      feature: "Health Q&A",
      totalTokens: 1420,
      latency: 540,
      successful: true,
      time: "15s ago",
    },
    {
      id: "REQ-847289",
      user: "alex.k@techcorp.io",
      model: "GPT-4o-mini",
      feature: "Todo Assistant",
      totalTokens: 450,
      latency: 260,
      successful: true,
      time: "48s ago",
    },
    {
      id: "REQ-847288",
      user: "priya.n@finance.co",
      model: "Claude 3.5",
      feature: "Medicine OCR",
      totalTokens: 2190,
      latency: 720,
      successful: true,
      time: "1m ago",
    },
  ];

  const hasLive = requests.length > 0;
  const allRequests = hasLive ? requests : defaultRequests;

  // Live Metrics Calculations
  const totalLive = requests.length;
  const successCount = requests.filter((r) => r.successful !== false).length;
  const failedCount = requests.filter((r) => r.successful === false).length;
  const errorCodesCount = requests.filter((r) => r.errorCode).length;
  const successRate = totalLive > 0 ? ((successCount / totalLive) * 100).toFixed(1) + "%" : "99.42%";
  const avgLatency = totalLive > 0
    ? Math.round(requests.reduce((acc, r) => acc + (r.latencyMs || r.latency || 0), 0) / totalLive)
    : 480;

  const distinctUsers = new Set(
    requests
      .map((r) => {
        if (typeof r.userId === "object" && r.userId !== null) return r.userId._id || r.userId.email;
        return r.userId || r.user;
      })
      .filter(Boolean)
  );
  const activeUsersCount = hasLive ? (distinctUsers.size || 1) : 428;

  // Slicing: In compact mode, show top maxItems (e.g. 6)
  // In full mode: Paginate 15 items per page
  const totalItems = allRequests.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const displayRequests = isCompact
    ? allRequests.slice(0, maxItems)
    : allRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Helper for relative timestamps
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 15000) return "Just now";
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Helper for user display and avatar
  const getUserDisplay = (req) => {
    if (typeof req.userId === "object" && req.userId !== null) {
      return req.userId.name || req.userId.email || "user@mone.ai";
    }
    if (typeof req.userId === "string") return `user_${req.userId.slice(-4)}@mone.ai`;
    return req.user || "user@mone.ai";
  };

  const getUserInitials = (str) => {
    const clean = str.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase() || "AI";
  };

  const requestVolume = [42, 58, 51, 74, 68, 91, 82, 104, 96, 118, 109, 128];

  return (
    <section className="ai-monitor-section" id="module-recent-requests">
      {/* HEADER */}
      <div className="ai-monitor-header">
        <div>
          <div className="ai-section-kicker">REQUEST MONITORING</div>
          <h3>AI Recent Requests</h3>
          <p>
            Real-time visibility into AI requests, performance and system health.
          </p>
        </div>

        <div className="ai-live-indicator">
          <span className="ai-live-dot"></span>
          Live Monitoring
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="ai-request-kpis">
        <div className="ai-request-kpi">
          <div className="ai-request-kpi-icon">↗</div>
          <div>
            <span>Requests In Window</span>
            <strong>{hasLive ? totalLive.toLocaleString() : "1,284"}</strong>
            <small>{hasLive ? `${totalLive} telemetry records` : "+18.6% vs yesterday"}</small>
          </div>
        </div>

        <div className="ai-request-kpi">
          <div className="ai-request-kpi-icon">✓</div>
          <div>
            <span>Success Rate</span>
            <strong>{successRate}</strong>
            <small>{failedCount === 0 ? "100% healthy" : `${failedCount} failed queries`}</small>
          </div>
        </div>

        <div className="ai-request-kpi">
          <div className="ai-request-kpi-icon">⚡</div>
          <div>
            <span>Avg Latency</span>
            <strong>{avgLatency} ms</strong>
            <small>Live inference speed</small>
          </div>
        </div>

        <div className="ai-request-kpi">
          <div className="ai-request-kpi-icon">◉</div>
          <div>
            <span>Active AI Users</span>
            <strong>{activeUsersCount.toLocaleString()}</strong>
            <small>Interacting with platform</small>
          </div>
        </div>
      </div>

      {/* ANALYTICS ROW */}
      <div className="ai-request-analytics">
        {/* REQUEST VOLUME */}
        <div className="ai-request-chart-card">
          <div className="ai-chart-card-header">
            <div>
              <span>REQUEST ACTIVITY</span>
              <h4>AI Request Volume</h4>
            </div>

            <div className="ai-chart-period">24 Hours ▾</div>
          </div>

          <div className="ai-request-chart">
            <div className="ai-chart-y-axis">
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>

            <div className="ai-chart-area">
              <div className="ai-chart-grid-line"></div>
              <div className="ai-chart-grid-line"></div>
              <div className="ai-chart-grid-line"></div>
              <div className="ai-chart-grid-line"></div>

              <svg
                viewBox="0 0 600 180"
                preserveAspectRatio="none"
                className="ai-line-chart"
              >
                <defs>
                  <linearGradient
                    id="requestGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#ff6500" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ff6500" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <polygon
                  points="
                    0,180
                    0,126
                    54,110
                    109,134
                    164,104
                    218,115
                    273,75
                    327,91
                    382,49
                    436,63
                    491,29
                    545,43
                    600,12
                    600,180
                  "
                  fill="url(#requestGradient)"
                />

                <polyline
                  points="
                    0,126
                    54,110
                    109,134
                    164,104
                    218,115
                    273,75
                    327,91
                    382,49
                    436,63
                    491,29
                    545,43
                    600,12
                  "
                  fill="none"
                  stroke="#ff6500"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {requestVolume.map((value, index) => {
                  const x = index * 54.5;
                  const y = 180 - (value / 150) * 168;

                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#ffffff"
                      stroke="#ff6500"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>

              <div className="ai-chart-x-axis">
                <span>12 AM</span>
                <span>4 AM</span>
                <span>8 AM</span>
                <span>12 PM</span>
                <span>4 PM</span>
                <span>8 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* SYSTEM HEALTH */}
        <div className="ai-health-card">
          <div className="ai-chart-card-header">
            <div>
              <span>SYSTEM HEALTH</span>
              <h4>Request Status</h4>
            </div>
          </div>

          <div className="ai-health-content">
            <div className="ai-donut">
              <div className="ai-donut-inner">
                <strong>{successRate}</strong>
                <span>Success</span>
              </div>
            </div>

            <div className="ai-health-stats">
              <div>
                <span className="ai-health-dot success"></span>
                <label>Successful</label>
                <strong>{hasLive ? successCount.toLocaleString() : "1,277"}</strong>
              </div>

              <div>
                <span className="ai-health-dot failed"></span>
                <label>Failed</label>
                <strong>{hasLive ? failedCount.toLocaleString() : "7"}</strong>
              </div>

              <div>
                <span className="ai-health-dot retry"></span>
                <label>Error Codes</label>
                <strong>{hasLive ? errorCodesCount.toLocaleString() : "18"}</strong>
              </div>
            </div>
          </div>

          <div className="ai-health-footer">
            <span>System status</span>
            <strong>
              <i style={{ background: failedCount > 5 ? "#ef4444" : "#10b981" }}></i>{" "}
              {failedCount > 5 ? "Degraded" : "Operational"}
            </strong>
          </div>
        </div>
      </div>

      {/* REQUEST TABLE */}
      <div className="ai-request-table-card">
        <div className="ai-table-title-row">
          <div>
            <span>RECENT ACTIVITY</span>
            <h4>Latest AI Requests</h4>
          </div>

          {isCompact && onViewAll ? (
            <button
              type="button"
              className="ai-view-all-btn"
              onClick={onViewAll}
            >
              View all ({hasLive ? requests.length : 200}) →
            </button>
          ) : (
            <span className="ai-request-count-badge">
              {hasLive ? `${requests.length} Requests` : "Live Feed"}
            </span>
          )}
        </div>

        <div className="ai-table-wrap">
          <table className="ai-table ai-request-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>User</th>
                <th>Feature</th>
                <th>Model</th>
                <th>Tokens</th>
                <th>Latency</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {displayRequests.map((request, idx) => {
                const userDisplay = getUserDisplay(request);
                const reqId = request._id
                  ? `#${String(request._id).slice(-8).toUpperCase()}`
                  : (request.id || `REQ-${847290 - idx}`);
                const isSuccess = request.successful !== false;

                return (
                  <tr key={request._id || request.id || idx}>
                    <td>
                      <span className="ai-request-id" title={request._id || request.id}>
                        {reqId}
                      </span>
                    </td>

                    <td>
                      <div className="ai-user-cell">
                        <div className="ai-user-avatar">
                          {getUserInitials(userDisplay)}
                        </div>
                        <span title={userDisplay}>{userDisplay}</span>
                      </div>
                    </td>

                    <td>
                      <span className="ai-feature-tag">
                        {request.requestType || request.feature || "Chat"}
                      </span>
                    </td>

                    <td>
                      <span className="ai-model-tag">
                        {request.model || "Gemini 1.5"}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {Number(request.totalTokens || 0).toLocaleString()}
                      </strong>
                    </td>

                    <td>
                      <span className="ai-latency">
                        {request.latencyMs || request.latency || 320} ms
                      </span>
                    </td>

                    <td>
                      <span className={isSuccess ? "status-active" : "status-inactive"}>
                        {isSuccess ? "Success" : (request.errorCode || "Failed")}
                      </span>
                    </td>

                    <td>
                      <span className="ai-time">
                        {request.createdAt ? formatTimeAgo(request.createdAt) : (request.time || "Just now")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* COMPACT FOOTER OR PAGINATION */}
        {isCompact ? (
          <div className="ai-compact-view-all-container">
            <span className="ai-compact-view-all-info">
              Showing latest <strong>{displayRequests.length}</strong> of{" "}
              <strong>{hasLive ? requests.length : 200}</strong> recorded AI requests
            </span>
            {onViewAll && (
              <button
                type="button"
                className="ai-compact-view-all-action"
                onClick={onViewAll}
              >
                View all {hasLive ? requests.length : 200} requests →
              </button>
            )}
          </div>
        ) : (
          totalPages > 1 && (
            <div className="ai-table-pagination">
              <span className="ai-pagination-info">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} requests
              </span>
              <div className="ai-pagination-actions">
                <button
                  type="button"
                  className="ai-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>
                <span className="ai-page-current">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="ai-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

// =============================================================================
// SUBDIVISION 8: AI USER USAGE
// Component: AIUserUsage
// Scope:
//   - High-usage users & plan distribution
//   - Connected live to /admin/ai/users aggregation
// =============================================================================
export function AIUserUsage({ data: externalData, loading: externalLoading }) {
  const [usersData, setUsersData] = useState(externalData ?? null);
  const [loading, setLoading] = useState(externalLoading ?? (externalData === undefined || externalData === null));
  const [period, setPeriod] = useState("30d");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  const PERIOD_OPTIONS = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
    { value: "all", label: "All Time" },
  ];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const loadUsersByPeriod = async (selectedPeriod) => {
    try {
      setLoading(true);
      const res = await (adminService.getAIUsers
        ? adminService.getAIUsers(selectedPeriod)
        : adminService.aiUsers(selectedPeriod));
      setUsersData(res?.data ?? null);
    } catch (error) {
      console.error("AI USERS API ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setDropdownOpen(false);
    loadUsersByPeriod(newPeriod);
  };

  useEffect(() => {
    if (externalData !== undefined && externalData !== null) {
      setUsersData(externalData);
      setLoading(Boolean(externalLoading));
      return;
    }

    loadUsersByPeriod(period);
  }, [externalData, externalLoading]);

  // Default baseline data for clean review when DB has 0 usage events
  const defaultUsers = [
    {
      name: "Ananya Menon",
      email: "ananya.m@demo.com",
      plan: "ENTERPRISE",
      requests: 428,
      tokens: 128640,
      cost: 12.84,
      avgLatency: 382,
      successRate: 99.8,
    },
    {
      name: "Rahul Nair",
      email: "rahul.n@demo.com",
      plan: "PRO",
      requests: 367,
      tokens: 109420,
      cost: 10.92,
      avgLatency: 421,
      successRate: 99.5,
    },
    {
      name: "Meera Thomas",
      email: "meera.t@demo.com",
      plan: "PRO",
      requests: 314,
      tokens: 94280,
      cost: 9.47,
      avgLatency: 468,
      successRate: 98.9,
    },
    {
      name: "Arjun Krishnan",
      email: "arjun.k@demo.com",
      plan: "FREE",
      requests: 286,
      tokens: 81650,
      cost: 8.21,
      avgLatency: 397,
      successRate: 99.2,
    },
    {
      name: "Devika Suresh",
      email: "devika.s@demo.com",
      plan: "FREE",
      requests: 251,
      tokens: 73420,
      cost: 7.38,
      avgLatency: 445,
      successRate: 98.6,
    },
  ];

  const rawList = Array.isArray(usersData?.users)
    ? usersData.users
    : Array.isArray(usersData)
    ? usersData
    : [];

  const hasLive = rawList.length > 0;
  const aiUsers = hasLive ? rawList : defaultUsers;

  // Format number helpers
  const fmtNum = (n) => {
    const num = Number(n) || 0;
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const summary = usersData?.summary;
  const totalUsersCount = summary?.totalUsers || (hasLive ? rawList.length : 8940);
  const totalRequestsCount = summary?.totalRequests || (hasLive ? rawList.reduce((acc, u) => acc + (u.requests || 0), 0) : 142800);
  const totalTokensCount = summary?.totalTokens || (hasLive ? rawList.reduce((acc, u) => acc + (u.totalTokens || u.tokens || 0), 0) : 48600000);
  const totalCostCount = summary?.totalCost ?? (hasLive ? rawList.reduce((acc, u) => acc + (u.cost || 0), 0) : 348.20);
  const hasTokensBreakdown = Boolean(summary?.inputTokens > 0 || summary?.outputTokens > 0);
  const inputTokensCount = hasTokensBreakdown
    ? summary.inputTokens
    : (hasLive ? Math.round(totalTokensCount * 0.38) : Math.round(totalTokensCount * 0.4));
  const outputTokensCount = hasTokensBreakdown
    ? summary.outputTokens
    : (totalTokensCount - inputTokensCount);

  const maxRequests = Math.max(1, ...aiUsers.map((user) => user.requests || 1));

  // Compute live donut percentages
  const inputPct = totalTokensCount > 0 ? Math.round((inputTokensCount / totalTokensCount) * 100) : 38;
  const outputPct = 100 - inputPct;

  return (
    <section className="ai-monitor-section" id="module-user-usage">
      {/* HEADER */}
      <div className="ai-monitor-header">
        <div>
          <div className="ai-section-kicker">USER ANALYTICS</div>
          <h3>AI User Usage</h3>
          <p>
            Understand how users consume AI features, tokens and
            platform resources.
          </p>
        </div>

        <div className="ai-period-dropdown-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="ai-usage-period ai-usage-period-btn"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-label="Filter user usage by timeframe"
          >
            <span>{PERIOD_OPTIONS.find((p) => p.value === period)?.label || "Last 30 Days"}</span>
            <span className="ai-period-arrow">▾</span>
          </button>

          {dropdownOpen && (
            <div className="ai-period-menu">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`ai-period-menu-item ${period === opt.value ? "active" : ""}`}
                  onClick={() => handlePeriodChange(opt.value)}
                >
                  <span>{opt.label}</span>
                  {period === opt.value && <span className="ai-period-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="ai-user-summary">
        <div className="ai-summary-card">
          <span>Total AI Users</span>
          <strong>{fmtNum(totalUsersCount)}</strong>
          <small>{hasLive ? `${totalUsersCount} active accounts` : "+12.8% this month"}</small>
        </div>

        <div className="ai-summary-card">
          <span>Total Requests</span>
          <strong>{fmtNum(totalRequestsCount)}</strong>
          <small>{hasLive ? "Aggregated live" : "+18.4% this month"}</small>
        </div>

        <div className="ai-summary-card">
          <span>Tokens Consumed</span>
          <strong>{fmtNum(totalTokensCount)}</strong>
          <small>{hasLive ? `${fmtNum(inputTokensCount)} in · ${fmtNum(outputTokensCount)} out` : "+9.7% this month"}</small>
        </div>

        <div className="ai-summary-card ai-summary-cost">
          <span>Estimated Spend</span>
          <strong>${Number(totalCostCount).toFixed(2)}</strong>
          <small>{hasLive ? "Based on provider token rates" : "↓ 4.2% vs last month"}</small>
        </div>
      </div>

      {/* USER CONSUMPTION */}
      <div className="ai-user-analytics-grid">
        <div className="ai-user-ranking-card">
          <div className="ai-chart-card-header">
            <div>
              <span>TOP CONSUMERS</span>
              <h4>AI Requests by User</h4>
            </div>

            <span className="ai-ranking-period">{hasLive ? "Live Telemetry" : "This Month"}</span>
          </div>

          <div className="ai-user-ranking">
            {aiUsers.map((user, index) => (
              <div className="ai-ranking-row" key={user._id || user.email || index}>
                <div className="ai-ranking-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="ai-ranking-user">
                  <div className="ai-user-avatar">
                    {(user.name || "User")
                      .split(" ")
                      .map((x) => x[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>{user.name}</strong>
                    <span>{Number(user.requests || 0).toLocaleString()} requests</span>
                  </div>
                </div>

                <div className="ai-ranking-bar-wrap">
                  <div className="ai-ranking-bar">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(4, ((user.requests / maxRequests) * 100))
                        ).toFixed(1)}%`,
                      }}
                    ></span>
                  </div>
                </div>

                <strong className="ai-ranking-value">{Number(user.requests || 0).toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* TOKEN DISTRIBUTION */}
        <div className="ai-token-card">
          <div className="ai-chart-card-header">
            <div>
              <span>CONSUMPTION</span>
              <h4>Token Distribution</h4>
            </div>
          </div>

          <div className="ai-token-visual">
            <div
              className="ai-token-circle"
              style={{
                background: `conic-gradient(#ff6500 0% ${inputPct}%, #2563eb ${inputPct}% 100%)`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
              }}
            >
              <div
                className="ai-token-donut-inner"
                style={{
                  borderRadius: "50%",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <strong>{fmtNum(totalTokensCount)}</strong>
                <span>Total Tokens</span>
              </div>
            </div>
          </div>

          <div className="ai-token-legend">
            <div>
              <span className="token-dot input" style={{ background: "#ff6500" }}></span>
              <label>Input Tokens ({inputPct}%)</label>
              <strong>{fmtNum(inputTokensCount)}</strong>
            </div>

            <div>
              <span className="token-dot output" style={{ background: "#2563eb" }}></span>
              <label>Output Tokens ({outputPct}%)</label>
              <strong>{fmtNum(outputTokensCount)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* USER TABLE */}
      <div className="ai-request-table-card">
        <div className="ai-table-title-row">
          <div>
            <span>USER BREAKDOWN</span>
            <h4>Detailed Usage</h4>
          </div>

          <button className="ai-view-all-btn">
            {hasLive ? `${aiUsers.length} Users` : "Export CSV ↓"}
          </button>
        </div>

        <div className="ai-table-wrap">
          <table className="ai-table ai-user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Requests</th>
                <th>Tokens</th>
                <th>Estimated Cost</th>
                <th>Avg Latency</th>
                <th>Success Rate</th>
              </tr>
            </thead>

            <tbody>
              {aiUsers.map((user, idx) => (
                <tr key={user._id || user.email || idx}>
                  <td>
                    <div className="ai-user-cell">
                      <div className="ai-user-avatar">
                        {(user.name || "User")
                          .split(" ")
                          .map((x) => x[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div className="ai-user-info">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <strong>
                      {Number(user.requests || 0).toLocaleString()}
                    </strong>
                  </td>

                  <td>{Number(user.totalTokens ?? user.tokens ?? 0).toLocaleString()}</td>

                  <td>
                    <span className="ai-cost-value">
                      ${Number(user.cost || 0).toFixed(2)}
                    </span>
                  </td>

                  <td>
                    <span className="ai-latency">{user.avgLatency || user.latency || 380} ms</span>
                  </td>

                  <td>
                    <div className="ai-success-cell">
                      <div className="ai-success-bar">
                        <span
                          style={{
                            width: `${Math.min(100, Math.max(0, user.successRate || user.success || 99.5))}%`,
                          }}
                        ></span>
                      </div>

                      <strong>{user.successRate || user.success || 99.5}%</strong>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// MAIN PAGE CONTAINER: AIAnalyticsPage
// Features horizontal tabs for easy switching between all 8 subdivisions.
// =============================================================================
export default function AIAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe, setTimeframe] = useState("7d");

  // Real Telemetry Data Lifecycle
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [lastSynced, setLastSynced] = useState("Just now");

  const [rawUsage, setRawUsage] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [aiUsersData, setAiUsersData] = useState(null);

  const fetchTelemetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpis, usage, usageRaw, errorsRaw, usersRaw] = await Promise.all([
        aiAnalyticsService.getKpiMetrics(),
        aiAnalyticsService.getUsageTrends({ timeframe }),
        adminService.getAIUsage().then((r) => r?.data?.usage ?? r?.usage ?? []).catch(() => []),
        adminService.getAIErrors().then((r) => r?.data?.errors ?? r?.errors ?? []).catch(() => []),
        adminService.getAIUsers().then((r) => r?.data ?? null).catch(() => null),
      ]);
      setKpiData(kpis);
      setUsageData(usage);
      setRawUsage(Array.isArray(usageRaw) ? usageRaw : []);
      setErrorLogs(Array.isArray(errorsRaw) ? errorsRaw : []);
      setAiUsersData(usersRaw);
      setLastSynced(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.error("AI Telemetry Ingestion Failed:", err);
      setError(err?.message || "Failed to establish telemetry link with inference nodes.");
      setKpiData(DEFAULT_AI_KPIS);
      setUsageData(DEFAULT_USAGE_TIMESERIES);
      setRawUsage([]);
      setErrorLogs([]);
      setAiUsersData(null);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Horizontal Tab Definitions matching the subdivisions with concise labels to prevent cutoffs
  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "usage", label: "Usage & Tokens", icon: BarChart3 },
    { id: "models", label: "Models", icon: Cpu },
    { id: "features", label: "Features", icon: Layers },
    { id: "costs", label: "Cost & Spend", icon: DollarSign },
    { id: "errors", label: "Error Logs", icon: AlertTriangle },
    { id: "requests", label: "Recent Requests", icon: Clock },
    { id: "users", label: "User Analytics", icon: UserCheck },
    { id: "all", label: "View All", icon: LayoutGrid },
  ];

  return (
    <div className="moneai-ai-analytics-page">
      {/* Page Header */}
      <PageHeader
        title="AI Analytics & Monitoring"
        subtitle="Real-time telemetry, model usage, token consumption, cost analysis, and error logs."
        actions={
          <div className="ai-page-header-actions">
            <span className="ai-synced-badge" title="Timestamp of last telemetry ingestion cycle">
              <span className="ai-synced-dot" />
              <span>Synced {lastSynced}</span>
            </span>
            <button
              type="button"
              className="ai-refresh-btn"
              onClick={fetchTelemetry}
              disabled={loading}
              title="Force refresh inference telemetry"
            >
              <RefreshCw size={14} className={loading ? "todo-spin" : ""} />
              <span>{loading ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        }
      />

      {/* =====================================================================
          HORIZONTAL TABS BAR (TOP OF PAGE)
          ===================================================================== */}
      <nav className="ai-horizontal-tabs-container" aria-label="AI Subdivisions">
        <div className="ai-horizontal-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`ai-nav-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* =====================================================================
          TAB CONTENT VIEWS
          ===================================================================== */}
      <div className="ai-tab-content-wrapper">
        {/* Tab 1: Overview & KPIs */}
        {activeTab === "overview" && (
          <div className="ai-tab-pane">
            <AIKpiCards
              data={kpiData}
              loading={loading}
              error={error}
              onRetry={fetchTelemetry}
            />
            <div className="ai-grid-2col" style={{ marginTop: "20px" }}>
              <AIUsageChart
                data={usageData}
                loading={loading}
                error={error}
                onRetry={fetchTelemetry}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
              <AICostChart data={rawUsage} loading={loading} />
            </div>
            <div className="ai-grid-2col" style={{ marginTop: "20px" }}>
              <AIOverviewSummary data={usageData} loading={loading} />
              <AIRecentIngestionFeed data={usageData} loading={loading} />
            </div>
          </div>
        )}

        {/* Tab 2: Usage & Tokens */}
        {activeTab === "usage" && (
          <div className="ai-tab-pane">
            <AITokenMetricsStrip data={usageData} loading={loading} />
            <AIUsageChart
              data={usageData}
              loading={loading}
              error={error}
              onRetry={fetchTelemetry}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
            <div className="ai-grid-2col" style={{ marginTop: "20px" }}>
              <AIRequestTypeBreakdown data={usageData} loading={loading} />
              <AIRecentIngestionFeed data={usageData} loading={loading} />
            </div>
          </div>
        )}

        {/* Tab 3: Model Distribution */}
        {activeTab === "models" && (
          <div className="ai-tab-pane">
            <AIModelUsage
              data={usageData?.byModel ?? rawUsage}
              loading={loading}
            />
          </div>
        )}

        {/* Tab 4: Feature Breakdown */}
        {activeTab === "features" && (
          <div className="ai-tab-pane">
            <AIFeatureUsage
              data={usageData?.byRequestType ?? rawUsage}
              loading={loading}
            />
          </div>
        )}

        {/* Tab 5: Cost & Spend */}
        {activeTab === "costs" && (
          <div className="ai-tab-pane">
            <AICostChart data={rawUsage} loading={loading} />
          </div>
        )}

        {/* Tab 6: Error Logs */}
        {activeTab === "errors" && (
          <div className="ai-tab-pane">
            <AIErrorTable data={errorLogs} loading={loading} />
          </div>
        )}

        {/* Tab 7: Recent Requests */}
        {activeTab === "requests" && (
          <div className="ai-tab-pane">
            <AIRecentRequests
              data={rawUsage.length > 0 ? rawUsage : (usageData?.recentRequests ?? [])}
              loading={loading}
              isCompact={false}
            />
          </div>
        )}

        {/* Tab 8: User Analytics */}
        {activeTab === "users" && (
          <div className="ai-tab-pane">
            <AIUserUsage data={aiUsersData} loading={loading} />
          </div>
        )}

        {/* Tab 9: View All Modules */}
        {activeTab === "all" && (
          <div className="ai-tab-pane ai-tab-pane--all">
            <AIKpiCards
              data={kpiData}
              loading={loading}
              error={error}
              onRetry={fetchTelemetry}
            />
            <div className="ai-grid-2col">
              <AIUsageChart
                data={usageData}
                loading={loading}
                error={error}
                onRetry={fetchTelemetry}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
              <AICostChart data={rawUsage} loading={loading} />
            </div>
            <div className="ai-grid-2col">
              <AIModelUsage
                data={usageData?.byModel ?? rawUsage}
                loading={loading}
              />
              <AIFeatureUsage
                data={usageData?.byRequestType ?? rawUsage}
                loading={loading}
              />
            </div>
            <AIUserUsage data={aiUsersData} loading={loading} />
            <div className="ai-grid-2col">
              <AIOverviewSummary data={usageData} loading={loading} />
              <AIRecentIngestionFeed data={usageData} loading={loading} />
            </div>
            <div className="ai-grid-2col">
              <AIRecentRequests
                data={rawUsage.length > 0 ? rawUsage : (usageData?.recentRequests ?? [])}
                loading={loading}
                isCompact={true}
                maxItems={6}
                onViewAll={() => {
                  setActiveTab("requests");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
              <AIErrorTable data={errorLogs} loading={loading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
