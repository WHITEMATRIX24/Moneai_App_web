import React, { useEffect, useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { adminService } from "../services/admin.service.js";
import { usePrimaryColor } from "../hooks/usePrimaryColor.js";

/* =============================================================================
   HELPERS
============================================================================= */

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

const FEATURE_CONFIG = {
  CHAT: {
    name: "General AI Assistant",
    domain: "Conversational",
    color: "#ff6500",
  },
  FINANCE: {
    name: "Personal Financial Coach",
    domain: "Finance",
    color: "#ff6500",
  },
  FINANCIAL_COACH: {
    name: "Personal Financial Coach",
    domain: "Finance",
    color: "#ff6500",
  },
  HEALTH: {
    name: "Health & Symptom Explainer",
    domain: "Health",
    color: "#10b981",
  },
  HEALTH_EXPLAINER: {
    name: "Health & Symptom Explainer",
    domain: "Health",
    color: "#10b981",
  },
  MEDICINES: {
    name: "Medicine Schedule & OCR",
    domain: "Medicines",
    color: "#3b82f6",
  },
  MEDICINE_OCR: {
    name: "Medicine Schedule & OCR",
    domain: "Medicines",
    color: "#3b82f6",
  },
  TODO: {
    name: "Daily Routine & Todo AI",
    domain: "Productivity",
    color: "#8b5cf6",
  },
  TODO_AI: {
    name: "Daily Routine & Todo AI",
    domain: "Productivity",
    color: "#8b5cf6",
  },
  INSIGHTS: {
    name: "Smart Insights & Summary",
    domain: "Intelligence",
    color: "#f59e0b",
  },
  SMART_INSIGHTS: {
    name: "Smart Insights & Summary",
    domain: "Intelligence",
    color: "#f59e0b",
  },
};

/* =============================================================================
   AI FEATURE USAGE COMPONENT
============================================================================= */

export default function AIFeatureUsage({
  data: externalData,
  loading: externalLoading,
}) {
  const primaryColor = usePrimaryColor();
  const [usage, setUsage] = useState(externalData ?? []);
  const [loading, setLoading] = useState(externalLoading ?? true);

  useEffect(() => {
    if (externalData !== undefined) {
      setUsage(Array.isArray(externalData) ? externalData : []);
      setLoading(Boolean(externalLoading));
      return;
    }

    let mounted = true;

    async function loadUsage() {
      try {
        setLoading(true);
        const result = await adminService.getAIUsage();
        const records = result?.data?.usage ?? result?.usage ?? [];
        if (mounted) setUsage(Array.isArray(records) ? records : []);
      } catch (error) {
        console.error("Failed to load AI feature usage:", error);
        if (mounted) setUsage([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUsage();

    return () => {
      mounted = false;
    };
  }, [externalData, externalLoading]);

  const featuresList = useMemo(() => {
    if (!Array.isArray(usage) || usage.length === 0) {
      return [
        {
          name: "Personal Financial Coach",
          domain: "Finance",
          calls: "46,200",
          percentage: 32,
          trend: "+18%",
          color: primaryColor || "#ff6500",
        },
        {
          name: "Health & Symptom Explainer",
          domain: "Health",
          calls: "38,400",
          percentage: 27,
          trend: "+9%",
          color: "#10b981",
        },
        {
          name: "Medicine Schedule & OCR",
          domain: "Medicines",
          calls: "28,700",
          percentage: 20,
          trend: "+31%",
          color: "#3b82f6",
        },
        {
          name: "Daily Routine & Todo AI",
          domain: "Productivity",
          calls: "18,900",
          percentage: 13,
          trend: "+4%",
          color: "#8b5cf6",
        },
        {
          name: "Smart Insights & Summary",
          domain: "Intelligence",
          calls: "10,650",
          percentage: 8,
          trend: "+12%",
          color: "#f59e0b",
        },
      ];
    }

    // Detect pre-aggregated byRequestType format: items have { _id, count }
    const isAggregated = usage[0] && "_id" in usage[0] && "count" in usage[0];

    if (isAggregated) {
      const totalRequests = usage.reduce((sum, f) => sum + (f.count || 0), 0) || 1;
      return usage.map((f) => {
        const percentage = Math.round((f.count / totalRequests) * 100);
        const typeKey = (f._id || "CHAT").toUpperCase();
        const config = FEATURE_CONFIG[typeKey] || {
          name: typeKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          domain: "AI Module",
          color: "#3b82f6",
        };
        return {
          name: config.name,
          domain: config.domain,
          calls: formatNumber(f.count),
          percentage,
          trend: "Live",
          color: config.color === "#ff6500" && primaryColor ? primaryColor : config.color,
        };
      });
    }

    // Raw records format: aggregate client-side
    const totalRequests = usage.length;
    const featureMap = {};

    usage.forEach((item) => {
      const typeKey = (item?.requestType || item?.feature || "CHAT").toUpperCase();
      if (!featureMap[typeKey]) {
        featureMap[typeKey] = {
          key: typeKey,
          calls: 0,
        };
      }
      featureMap[typeKey].calls += 1;
    });

    const sorted = Object.values(featureMap).sort((a, b) => b.calls - a.calls);

    return sorted.map((f) => {
      const percentage = totalRequests > 0 ? Math.round((f.calls / totalRequests) * 100) : 0;
      const config = FEATURE_CONFIG[f.key] || {
        name: f.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        domain: "AI Module",
        color: "#3b82f6",
      };

      return {
        name: config.name,
        domain: config.domain,
        calls: formatNumber(f.calls),
        percentage,
        trend: "Live",
        color: config.color === "#ff6500" && primaryColor ? primaryColor : config.color,
      };
    });
  }, [usage, primaryColor]);

  return (
    <section className="ai-subdivision-card" id="module-feature-usage">
      <div className="ai-subdivision-header">
        <div className="ai-subdivision-title-group">
          <div className="ai-subdivision-icon-badge">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="ai-subdivision-title">AI Feature & Domain Usage</h3>
            <p className="ai-subdivision-subtitle">
              Module-level request breakdown across MONE AI system capabilities
            </p>
          </div>
        </div>
      </div>

      <div className="ai-feature-grid">
        {loading ? (
          <div className="ai-empty-state" style={{ padding: "24px 0" }}>
            Loading feature telemetry...
          </div>
        ) : (
          featuresList.map((f, idx) => (
            <div key={f.name || idx} className="ai-feature-item">
              <div className="ai-feature-item__head">
                <div>
                  <strong className="ai-feature-name">{f.name}</strong>
                  <span className="ai-feature-domain">{f.domain}</span>
                </div>
                <div className="ai-feature-item__stat">
                  <span className="ai-feature-calls">{f.calls} calls</span>
                  <span className="ai-feature-trend">{f.trend}</span>
                </div>
              </div>
              <div className="ai-feature-progress-bar">
                <div
                  className="ai-feature-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, f.percentage))}%`,
                    background: f.color,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export { AIFeatureUsage };
