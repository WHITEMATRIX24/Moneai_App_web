// src/pages/SubscriptionPage.jsx

import { Link } from "react-router-dom";
import {
  Crown,
  Zap,
  Check,
  Lock,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Bot,
  Bell,
  Smartphone,
  Users,
  Wrench,
  Headset,
  Infinity as InfinityIcon,
} from "lucide-react";

import { getStoredUser } from "../services/auth.service.js";
import PageHeader from "../components/PageHeader.jsx";
import "./SubscriptionPage.css";

const PLAN_DETAILS = {
  FREE: {
    label: "Free",
    tagline: "The essentials, on us.",
    icon: Sparkles,
    perks: [
      "Up to 20 active tasks",
      "Basic calendar & reminders",
      "1 connected app",
    ],
  },
  TRIAL: {
    label: "Premium Trial",
    tagline: "You're trying out everything Premium has to offer.",
    icon: Crown,
    perks: [
      "Unlimited tasks & medicines",
      "Smart AI insights",
      "Priority notifications",
      "Up to 5 connected apps",
    ],
  },
  PREMIUM: {
    label: "Premium",
    tagline: "For people who run their whole life through mone.ai.",
    icon: Crown,
    perks: [
      "Unlimited tasks & medicines",
      "Smart AI insights",
      "Priority notifications",
      "Up to 5 connected apps",
    ],
  },
  ENTERPRISE: {
    label: "Enterprise",
    tagline: "Built for teams and power users.",
    icon: ShieldCheck,
    perks: [
      "Everything in Premium",
      "Unlimited connected apps",
      "Dedicated support",
      "Custom integrations",
    ],
  },
};

// Feature access levels: FREE = 0, TRIAL & PREMIUM = 2, ENTERPRISE = 3
const PLAN_LEVELS = { FREE: 0, TRIAL: 2, PREMIUM: 2, ENTERPRISE: 3 };

const FEATURE_HIGHLIGHTS = [
  {
    icon: InfinityIcon,
    title: "Unlimited Tasks & Medicines",
    description: "No caps on to-dos, calendar entries or medicine reminders.",
    minLevel: 2,
  },
  {
    icon: Bot,
    title: "Smart AI Insights",
    description: "Personalized suggestions across finance, health and your day.",
    minLevel: 2,
  },
  {
    icon: Bell,
    title: "Priority Notifications",
    description: "Real-time delivery instead of batched, delayed alerts.",
    minLevel: 2,
  },
  {
    icon: Smartphone,
    title: "Up to 5 Connected Apps",
    description: "Link more services to your MONE AI console.",
    minLevel: 2,
  },
  {
    icon: Users,
    title: "Unlimited Connected Apps",
    description: "No limit on the integrations you can connect.",
    minLevel: 3,
  },
  {
    icon: Wrench,
    title: "Custom Integrations",
    description: "Build or request integrations tailored to your workflow.",
    minLevel: 3,
  },
  {
    icon: Headset,
    title: "Dedicated Account Manager",
    description: "A direct point of contact for your account.",
    minLevel: 3,
  },
  {
    icon: ShieldCheck,
    title: "24/7 Priority Support",
    description: "Round-the-clock support with faster response times.",
    minLevel: 3,
  },
];

function getPlanKey(user) {
  const raw = String(user?.subscriptionPlan || "FREE").toUpperCase();

  if (raw.includes("ENTERPRISE")) return "ENTERPRISE";
  if (raw.includes("TRIAL")) return "TRIAL";
  if (raw.includes("PREMIUM")) return "PREMIUM";

  return "FREE";
}

function getTrialDaysLeft(user) {
  if (!user?.trialEndsAt) return null;

  const end = new Date(user.trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return days;
}

export default function SubscriptionPage() {
  const user = getStoredUser();
  const planKey = getPlanKey(user);
  const plan = PLAN_DETAILS[planKey];
  const PlanIcon = plan.icon;

  const isFree = planKey === "FREE";
  const isTrial = planKey === "TRIAL";

  const trialDaysLeft = isTrial ? getTrialDaysLeft(user) : null;
  const showTrialBanner = isTrial && trialDaysLeft !== null;
  const trialUrgent = trialDaysLeft !== null && trialDaysLeft <= 3;

  const userLevel = PLAN_LEVELS[planKey] ?? 0;

  return (
    <>
      <PageHeader
        title="Subscription"
        subtitle="Manage your subscription plan and usage."
      />

      <div className="sub-page">
        {/* TRIAL BANNER */}

        {showTrialBanner && (
          <section className={`sub-trial-banner ${trialUrgent ? "urgent" : ""}`}>
            <div className="sub-trial-banner__icon">
              <AlertTriangle size={20} />
            </div>

            <div className="sub-trial-banner__text">
              <strong>
                {trialDaysLeft > 0
                  ? `Your trial runs out in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"}`
                  : "Your trial ends today"}
              </strong>
              <span>
                Upgrade now to keep unlimited tasks, AI insights and priority
                support without interruption.
              </span>
            </div>

            <Link to="/plans" className="sub-trial-banner__cta">
              Upgrade Now
              <ArrowUpRight size={15} />
            </Link>
          </section>
        )}

        {/* CURRENT PLAN HERO */}

        <section className="sub-hero">
          <div className="sub-hero__glow" />

          <div className="sub-hero__content">
            <div className="sub-hero__badge">
              <PlanIcon size={16} />
              Current Plan
            </div>

            <h1>{plan.label}</h1>

            <p>{plan.tagline}</p>

            <div className="sub-hero__perks">
              {plan.perks.map((perk) => (
                <div className="sub-hero__perk" key={perk}>
                  <Check size={15} />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sub-hero__cta">
            {isFree || isTrial ? (
              <Link to="/plans" className="sub-upgrade-btn">
                <Zap size={17} />
                Upgrade Plan
                <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link to="/plans" className="sub-manage-btn">
                Manage Plan
                <ArrowUpRight size={16} />
              </Link>
            )}

            <span className="sub-hero__note">
              {isFree
                ? "Unlock unlimited tasks, medicines and AI insights."
                : isTrial
                  ? "Lock in these features before your trial ends."
                  : "You're on the " + plan.label + " plan."}
            </span>
          </div>
        </section>

        {/* QUICK STATS */}

        <section className="sub-stats-grid">
          <div className="sub-stat-card">
            <div className="sub-stat-icon">
              <Crown size={20} />
            </div>
            <div>
              <span>Plan</span>
              <strong>{plan.label}</strong>
            </div>
          </div>

          <div className="sub-stat-card">
            <div className="sub-stat-icon">
              <InfinityIcon size={20} />
            </div>
            <div>
              <span>Task Limit</span>
              <strong>{isFree ? "20" : "Unlimited"}</strong>
            </div>
          </div>

          <div className="sub-stat-card">
            <div className="sub-stat-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span>Support</span>
              <strong>{planKey === "ENTERPRISE" ? "Dedicated" : "Standard"}</strong>
            </div>
          </div>
        </section>

        {/* FEATURE HIGHLIGHTS */}

        <section className="sub-features">
          <div className="sub-features__heading">
            <span className="sub-section-label">Everything on offer</span>
            <h2>Features across every plan</h2>
            <p>Features you don't have yet are marked — upgrade to unlock them.</p>
          </div>

          <div className="sub-features-grid">
            {FEATURE_HIGHLIGHTS.map((feature) => {
              const Icon = feature.icon;
              const unlocked = userLevel >= feature.minLevel;

              return (
                <div
                  className={`sub-feature-card ${unlocked ? "unlocked" : "locked"}`}
                  key={feature.title}
                >
                  <div className="sub-feature-card__icon">
                    <Icon size={19} />
                  </div>

                  <div className="sub-feature-card__body">
                    <strong>{feature.title}</strong>
                    <p>{feature.description}</p>
                  </div>

                  <div className="sub-feature-card__status">
                    {unlocked ? (
                      <Check size={16} />
                    ) : (
                      <Lock size={14} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* UPSELL PANEL */}

        {(isFree || isTrial) && (
          <section className="sub-upsell">
            <div className="sub-upsell__text">
              <span className="sub-section-label">Get more</span>
              <h2>See what Premium unlocks</h2>
              <p>
                Unlimited tasks, medicine reminders, AI-powered insights and
                priority support — compare every plan side by side.
              </p>
            </div>

            <Link to="/plans" className="sub-upgrade-btn">
              <Zap size={17} />
              View Plans
              <ArrowUpRight size={16} />
            </Link>
          </section>
        )}
      </div>
    </>
  );
}