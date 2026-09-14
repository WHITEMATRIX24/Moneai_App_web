import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Cpu, RefreshCw, Layers } from "lucide-react";
import { adminService } from "../services/admin.service.js";
import { useCurrency, formatCostFromUSD } from "../utils/currency.js";

/* =============================================================================
   HELPERS
============================================================================= */

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatTokens(value) {
  const num = Number(value || 0);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return formatNumber(num);
}


const DEFAULT_MODELS = [
  {
    name: "Qwen 2.5 (3.8B / 7B)",
    provider: "Alibaba / Local Ollama",
    calls: "64,210",
    tokens: "21.4M",
    share: 45,
    latency: "280ms",
    cost: "$64.20",
    badge: "Primary Engine",
  },
  {
    name: "Grok-2",
    provider: "xAI API",
    calls: "48,930",
    tokens: "16.8M",
    share: 34,
    latency: "510ms",
    cost: "$188.40",
    badge: "Complex Reasoning",
  },
  {
    name: "GPT-4o-mini",
    provider: "OpenAI",
    calls: "21,410",
    tokens: "7.8M",
    share: 15,
    latency: "420ms",
    cost: "$72.10",
    badge: "Fallback Router",
  },
  {
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    calls: "8,300",
    tokens: "2.6M",
    share: 6,
    latency: "690ms",
    cost: "$23.50",
    badge: "Document OCR",
  },
];

function inferProvider(modelName = "") {
  const lower = modelName.toLowerCase();
  if (lower.includes("qwen")) return "Alibaba / Local Ollama";
  if (lower.includes("grok")) return "xAI API";
  if (lower.includes("gpt") || lower.includes("openai")) return "OpenAI";
  if (lower.includes("claude") || lower.includes("anthropic")) return "Anthropic";
  if (lower.includes("gemini") || lower.includes("google")) return "Google AI";
  if (lower.includes("llama") || lower.includes("meta")) return "Meta / Local Ollama";
  if (lower.includes("mistral")) return "Mistral AI";
  return "Provider Node";
}

/* =============================================================================
   AI MODEL USAGE COMPONENT
============================================================================= */

export default function AIModelUsage({
  data: externalData,
  loading: externalLoading,
}) {
  const { formatCostFromUSD: fmtCost } = useCurrency();
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
        console.error("Failed to load AI model usage:", error);
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

  const formatCostItem = useCallback(
    (value) => {
      const num = typeof value === "number" ? value : parseFloat(String(value || 0).replace(/[^0-9.-]+/g, ""));
      return fmtCost(isNaN(num) ? 0 : num);
    },
    [fmtCost]
  );

  const modelsList = useMemo(() => {
    if (!Array.isArray(usage) || usage.length === 0) {
      return DEFAULT_MODELS.map((m) => ({
        ...m,
        cost: formatCostItem(m.cost),
      }));
    }

    // Detect pre-aggregated byModel format: items have { _id, count, totalTokens, cost }
    const isAggregated = usage[0] && "_id" in usage[0] && "count" in usage[0];

    if (isAggregated) {
      const totalRequests = usage.reduce((sum, m) => sum + (m.count || 0), 0) || 1;
      return usage.map((m, idx) => {
        const share = Math.round((m.count / totalRequests) * 100);
        let badge = "Active Model";
        if (idx === 0) badge = "Primary Engine";
        else if (idx === 1) badge = "Secondary Router";
        else if (idx === 2) badge = "Fallback Engine";
        return {
          name: m._id || "Unknown",
          provider: inferProvider(m._id),
          calls: formatNumber(m.count),
          tokens: formatTokens(m.totalTokens),
          share,
          latency: "—",
          cost: formatCostItem(m.cost),
          badge,
        };
      });
    }

    // Raw records format: aggregate client-side
    const totalRequests = usage.length;
    const modelMap = {};

    usage.forEach((item) => {
      const modelKey = item?.model || "default";
      if (!modelMap[modelKey]) {
        modelMap[modelKey] = {
          rawName: modelKey,
          calls: 0,
          tokens: 0,
          cost: 0,
        };
      }
      modelMap[modelKey].calls += 1;
      const t = Number(
        item?.totalTokens ||
          Number(item?.promptTokens || 0) + Number(item?.completionTokens || 0)
      );
      modelMap[modelKey].tokens += t;
      modelMap[modelKey].cost += Number(item?.estimatedCost || 0);
    });

    const sorted = Object.values(modelMap).sort((a, b) => b.calls - a.calls);

    return sorted.map((m, idx) => {
      const share = totalRequests > 0 ? Math.round((m.calls / totalRequests) * 100) : 0;
      let badge = "Active Model";
      if (idx === 0) badge = "Primary Engine";
      else if (idx === 1) badge = "Secondary Router";
      else if (idx === 2) badge = "Fallback Engine";

      return {
        name: m.rawName,
        provider: inferProvider(m.rawName),
        calls: formatNumber(m.calls),
        tokens: formatTokens(m.tokens),
        share,
        latency: "—",
        cost: formatCostItem(m.cost),
        badge,
      };
    });
  }, [usage, formatCostItem]);

  return (
    <section className="ai-subdivision-card" id="module-model-usage">
      <div className="ai-subdivision-header">
        <div className="ai-subdivision-title-group">
          <div className="ai-subdivision-icon-badge">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="ai-subdivision-title">AI Model & Provider Usage</h3>
            <p className="ai-subdivision-subtitle">
              Distribution and efficiency metrics across configured AI models
            </p>
          </div>
        </div>
      </div>

      <div className="ai-model-list">
        {loading ? (
          <div className="ai-empty-state" style={{ padding: "24px 0" }}>
            Loading model telemetry...
          </div>
        ) : (
          modelsList.map((m, idx) => (
            <div key={m.name || idx} className="ai-model-row">
              <div className="ai-model-row__info">
                <div className="ai-model-row__title-line">
                  <span className="ai-model-name">{m.name}</span>
                  <span className="ai-model-badge">{m.badge}</span>
                </div>
                <span className="ai-model-provider">{m.provider}</span>
              </div>

              <div className="ai-model-row__progress">
                <div className="ai-model-bar-bg">
                  <div
                    className="ai-model-bar-fill"
                    style={{ width: `${Math.min(100, Math.max(0, m.share))}%` }}
                  />
                </div>
                <span className="ai-model-share">{m.share}% share</span>
              </div>

              <div className="ai-model-row__metrics">
                <div className="metric-chip">
                  <span>Calls:</span> <strong>{m.calls}</strong>
                </div>
                <div className="metric-chip">
                  <span>Tokens:</span> <strong>{m.tokens}</strong>
                </div>
                <div className="metric-chip">
                  <span>Avg Latency:</span> <strong>{m.latency}</strong>
                </div>
                <div className="metric-chip">
                  <span>Cost:</span> <strong>{m.cost}</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export { AIModelUsage };
