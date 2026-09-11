// src/pages/PlansPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  Crown,
  ShieldCheck,
  Sparkles,
  Zap,
  RefreshCw,
  Lock,
  ChevronDown,
} from "lucide-react";

import { getStoredUser } from "../services/auth.service.js";
import PageHeader from "../components/PageHeader.jsx";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    icon: Sparkles,
    badge: "Starter",
    monthly: 0,
    yearly: 0,
    tagline: "Essential tools to organize your tasks and daily health.",
    features: [
      "Up to 20 active tasks & reminders",
      "Basic medicines tracking (1 schedule)",
      "1 connected app integration",
      "Personal dashboard widgets",
      "Community support",
    ],
    ctaText: "Choose Free",
  },
  {
    key: "PREMIUM",
    name: "Premium",
    icon: Crown,
    badge: "Most Popular",
    popular: true,
    monthly: 499,
    yearly: 4499,
    yearlyMonthlyEq: 375,
    tagline: "All-in-one superpower for personal productivity, AI & health.",
    features: [
      "Unlimited tasks, todos & calendar events",
      "Unlimited medicines & smart dose reminders",
      "Smart AI Assistant & daily insights",
      "Priority notification alerts",
      "Up to 5 connected app integrations",
      "Data export (PDF, CSV)",
      "Priority email support",
    ],
    ctaText: "Upgrade to Premium",
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    icon: ShieldCheck,
    badge: "Maximum Power",
    monthly: 1499,
    yearly: 13999,
    yearlyMonthlyEq: 1166,
    tagline: "Advanced capabilities, dedicated support & custom integrations.",
    features: [
      "Everything included in Premium",
      "Unlimited connected apps & workflows",
      "Advanced AI models with custom tuning",
      "Dedicated account manager",
      "Custom integrations & webhook access",
      "24/7 priority live support & SLAs",
    ],
    ctaText: "Upgrade to Enterprise",
  },
];

const FAQS = [
  {
    q: "Can I switch or cancel my plan anytime?",
    a: "Yes! You can upgrade, downgrade, or cancel your subscription at any time from your account settings. When upgrading, changes apply immediately with prorated billing.",
  },
  {
    q: "How does the yearly discount work?",
    a: "Paying annually gives you an instant 25% discount compared to monthly billing. You'll be billed once a year and enjoy full uninterrupted access.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support all major Credit/Debit cards (Visa, MasterCard, RuPay), UPI, Net Banking, and popular digital wallets.",
  },
];

function getPlanKey(user) {
  const raw = String(user?.subscriptionPlan || "FREE").toUpperCase();
  if (raw.includes("ENTERPRISE")) return "ENTERPRISE";
  if (raw.includes("PREMIUM")) return "PREMIUM";
  return "FREE";
}

export default function PlansPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const currentPlanKey = getPlanKey(user);

  const [billing, setBilling] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);

  const handleChoosePlan = (plan) => {
    if (plan.key === currentPlanKey) return;
    toast.success(`${plan.name} plan selected — checkout gateway opening soon!`);
  };

  return (
    <>
      <PageHeader
        title="Plans & Pricing"
        subtitle="Compare plans and choose the perfect fit for your workflow."
      />

      <div className="plans-page">
        {/* TOP BAR / BACK NAVIGATION */}
        <div className="plans-nav-bar">
          <button
            type="button"
            className="plans-back-btn"
            onClick={() => navigate("/subscriptions")}
          >
            <ArrowLeft size={16} />
            <span>Back to Subscription</span>
          </button>

          <span className="plans-current-pill">
            Current Tier: <strong>{currentPlanKey}</strong>
          </span>
        </div>

        {/* HERO / SWITCHER */}
        <section className="plans-hero-section">
          <div className="plans-hero-badge">
            <Sparkles size={13} />
            Flexible Subscriptions
          </div>
          <h1 className="plans-hero-title">Simple, transparent pricing.</h1>
          <p className="plans-hero-subtitle">
            Scale your productivity with advanced AI, unlimited health tracking,
            and personalized automation.
          </p>

          {/* BILLING TOGGLE */}
          <div className="plans-toggle-container">
            <div className="plans-toggle">
              <button
                type="button"
                className={`plans-toggle-btn ${billing === "monthly" ? "active" : ""}`}
                onClick={() => setBilling("monthly")}
              >
                Monthly
              </button>

              <button
                type="button"
                className={`plans-toggle-btn ${billing === "yearly" ? "active" : ""}`}
                onClick={() => setBilling("yearly")}
              >
                <span>Yearly</span>
                <span className="plans-save-badge">Save 25%</span>
              </button>
            </div>
            <span className="plans-toggle-hint">
              {billing === "yearly"
                ? "✨ You are saving 25% with annual billing"
                : "Switch to yearly to save 25% each year"}
            </span>
          </div>
        </section>

        {/* PRICING CARDS */}
        <div className="plans-grid">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.key === currentPlanKey;
            const price = billing === "monthly" ? plan.monthly : plan.yearly;

            return (
              <article
                key={plan.key}
                className={`plan-card ${plan.popular ? "popular" : ""} ${
                  isCurrent ? "current" : ""
                }`}
              >
                {/* POPULAR / CURRENT BADGE */}
                {plan.popular && !isCurrent && (
                  <div className="plan-card__badge-popular">
                    <Sparkles size={12} />
                    <span>Most Popular</span>
                  </div>
                )}

                {isCurrent && (
                  <div className="plan-card__badge-current">
                    <Check size={12} />
                    <span>Your Active Plan</span>
                  </div>
                )}

                <div className="plan-card__header">
                  <div className="plan-card__icon-box">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="plan-card__name">{plan.name}</h3>
                    <span className="plan-card__sub-badge">{plan.badge}</span>
                  </div>
                </div>

                <p className="plan-card__tagline">{plan.tagline}</p>

                {/* PRICE SECTION */}
                <div className="plan-card__price-box">
                  {price === 0 ? (
                    <div className="plan-card__price-free">
                      <span className="plan-card__amount">Free</span>
                      <span className="plan-card__period">Forever</span>
                    </div>
                  ) : (
                    <div>
                      <div className="plan-card__price-main">
                        <span className="plan-card__currency">₹</span>
                        <span className="plan-card__amount">
                          {price.toLocaleString("en-IN")}
                        </span>
                        <span className="plan-card__period">
                          /{billing === "monthly" ? "mo" : "yr"}
                        </span>
                      </div>
                      {billing === "yearly" && (
                        <div className="plan-card__equivalent">
                          ₹{plan.yearlyMonthlyEq}/mo billed annually
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="plan-card__divider" />

                {/* FEATURES LIST */}
                <div className="plan-card__features-title">What's included:</div>
                <ul className="plan-card__features">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="plan-card__check-icon">
                        <Check size={13} />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA BUTTON */}
                <button
                  type="button"
                  className={`plan-card__cta ${
                    isCurrent
                      ? "is-current"
                      : plan.popular
                      ? "is-popular"
                      : "is-standard"
                  }`}
                  onClick={() => handleChoosePlan(plan)}
                  disabled={isCurrent}
                >
                  {isCurrent ? (
                    <>
                      <Check size={16} />
                      <span>Current Plan</span>
                    </>
                  ) : (
                    <span>{plan.ctaText}</span>
                  )}
                </button>
              </article>
            );
          })}
        </div>

        {/* TRUST / VALUE BANNER */}
        <section className="plans-trust-section">
          <div className="plans-trust-card">
            <div className="plans-trust-icon">
              <Zap size={20} />
            </div>
            <div>
              <h4>Instant Activation</h4>
              <p>Your upgraded limits and AI models activate immediately upon checkout.</p>
            </div>
          </div>

          <div className="plans-trust-card">
            <div className="plans-trust-icon">
              <RefreshCw size={20} />
            </div>
            <div>
              <h4>Cancel or Switch Anytime</h4>
              <p>No locked-in contracts. Upgrade or downgrade whenever your needs change.</p>
            </div>
          </div>

          <div className="plans-trust-card">
            <div className="plans-trust-icon">
              <Lock size={20} />
            </div>
            <div>
              <h4>Bank-Grade Security</h4>
              <p>Your personal data and health records are encrypted end-to-end with 256-bit AES.</p>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="plans-faq-section">
          <div className="plans-faq-header">
            <span className="plans-hero-badge">FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about MONE AI plans and billing.</p>
          </div>

          <div className="plans-faq-list">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`plans-faq-item ${isOpen ? "open" : ""}`}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                >
                  <div className="plans-faq-q">
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`plans-faq-chevron ${isOpen ? "rotated" : ""}`}
                    />
                  </div>
                  {isOpen && <p className="plans-faq-a">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}