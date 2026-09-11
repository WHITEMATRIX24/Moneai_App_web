// src/pages/AIPage.jsx

import { useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  MessageSquare,
  TrendingUp,
  HeartPulse,
  WalletCards,
  ListTodo,
  ChevronRight,
  Zap,
  Star,
  Bot,
  ArrowUpRight,
  Lightbulb,
  Clock,
  RefreshCw,
} from "lucide-react";

import { getStoredUser } from "../services/auth.service.js";
import PageHeader from "../components/PageHeader.jsx";
import "./AIPage.css";

// ─── AI CAPABILITIES ─────────────────────────────────────────────────────────

const AI_CAPABILITIES = [
  {
    id: "finance",
    icon: WalletCards,
    title: "Finance Intelligence",
    desc: "Analyze your spending, predict cash flow, and surface savings opportunities automatically.",
    accent: "#10b981",
  },
  {
    id: "health",
    icon: HeartPulse,
    title: "Health Insights",
    desc: "Identify health trends, flag anomalies in your vitals, and suggest lifestyle improvements.",
    accent: "#3b82f6",
  },
  {
    id: "tasks",
    icon: ListTodo,
    title: "Smart Task Management",
    desc: "Auto-prioritize your to-do list based on deadlines, energy levels, and past behavior.",
    accent: "#f59e0b",
  },
  {
    id: "recommendations",
    icon: Lightbulb,
    title: "Personalized Recommendations",
    desc: "Receive daily action items tailored to your goals across finance, health, and productivity.",
    accent: "#8b5cf6",
  },
  {
    id: "predictions",
    icon: TrendingUp,
    title: "Predictive Analytics",
    desc: "Forecast your financial runway, health trajectories, and goal completion timelines.",
    accent: "#ec4899",
  },
  {
    id: "alerts",
    icon: Zap,
    title: "Intelligent Alerts",
    desc: "Get notified about important changes before they become problems.",
    accent: "#ff6500",
  },
];

// ─── MOCK INSIGHTS ─────────────────────────────────────────────────────────────

const RECENT_INSIGHTS = [
  {
    id: "ins-1",
    category: "Finance",
    icon: WalletCards,
    color: "#10b981",
    title: "Spending up 18% this week",
    body: "Dining & subscriptions are the main drivers. Consider reviewing recurring charges.",
    time: "2h ago",
  },
  {
    id: "ins-2",
    category: "Health",
    icon: HeartPulse,
    color: "#3b82f6",
    title: "Sleep quality trending down",
    body: "Your average sleep score dropped from 78 to 64 over the past 5 days.",
    time: "5h ago",
  },
  {
    id: "ins-3",
    category: "Tasks",
    icon: ListTodo,
    color: "#f59e0b",
    title: "3 overdue tasks detected",
    body: "Tasks from last week haven't been completed. Reprioritize to stay on track.",
    time: "1d ago",
  },
];

// ─── QUICK ACTIONS ───────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Ask AI anything", icon: MessageSquare },
  { label: "Generate insights report", icon: Sparkles },
  { label: "Summarize my week", icon: Star },
  { label: "Optimize my schedule", icon: Clock },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function AIPage() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "there";

  const [activeInsight, setActiveInsight] = useState(null);

  return (
    <div className="ai-page">
      <PageHeader
        title="AI Assistant"
        subtitle="Your personal intelligence engine — finance, health and productivity."
      />

      {/* HERO */}
      <div className="ai-hero">
        <div className="ai-hero__orb" aria-hidden="true" />
        <div className="ai-hero__inner">
          <div className="ai-hero__badge">
            <Bot size={14} />
            <span>MONE AI Active</span>
          </div>
          <h2 className="ai-hero__greeting">
            Good to see you, <span>{firstName}</span>
          </h2>
          <p className="ai-hero__desc">
            Your AI assistant has analyzed your activity and has{" "}
            <strong>3 new insights</strong> ready for you today.
          </p>
          <div className="ai-quick-actions">
            {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
              <button key={label} type="button" className="ai-quick-btn" title={label}>
                <Icon size={16} />
                <span>{label}</span>
                <ArrowUpRight size={13} className="ai-quick-btn__arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT INSIGHTS */}
      <section className="ai-section">
        <div className="ai-section__header">
          <div className="ai-section__title-group">
            <BrainCircuit size={18} />
            <h3>Recent Insights</h3>
          </div>
          <button type="button" className="ai-section__refresh">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
        <div className="ai-insights-grid">
          {RECENT_INSIGHTS.map((ins) => {
            const Icon = ins.icon;
            return (
              <button
                key={ins.id}
                type="button"
                className={`ai-insight-card${activeInsight === ins.id ? " active" : ""}`}
                onClick={() => setActiveInsight((p) => (p === ins.id ? null : ins.id))}
              >
                <div className="ai-insight-card__icon" style={{ background: `${ins.color}22`, color: ins.color }}>
                  <Icon size={17} />
                </div>
                <div className="ai-insight-card__body">
                  <span className="ai-insight-card__category" style={{ color: ins.color }}>{ins.category}</span>
                  <strong className="ai-insight-card__title">{ins.title}</strong>
                  <p className="ai-insight-card__desc">{ins.body}</p>
                </div>
                <div className="ai-insight-card__meta">
                  <Clock size={11} />
                  <span>{ins.time}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="ai-section">
        <div className="ai-section__header">
          <div className="ai-section__title-group">
            <Sparkles size={18} />
            <h3>What MONE AI Can Do</h3>
          </div>
        </div>
        <div className="ai-capabilities-grid">
          {AI_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.id} className="ai-cap-card">
                <div className="ai-cap-card__icon" style={{ background: `${cap.accent}22`, color: cap.accent }}>
                  <Icon size={20} />
                </div>
                <h4 className="ai-cap-card__title">{cap.title}</h4>
                <p className="ai-cap-card__desc">{cap.desc}</p>
                <div className="ai-cap-card__footer" style={{ color: cap.accent }}>
                  <span>Explore</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
