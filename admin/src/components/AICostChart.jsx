import React, { useEffect, useMemo, useState } from "react";
import { DollarSign } from "lucide-react";
import { adminService } from "../services/admin.service.js";
import { useCurrency } from "../utils/currency.js";

// =============================================================================
// SUBDIVISION 5: AI COST CHART
// Component: AICostChart
// Scope:
//   - Estimated provider cost trends ($ over time)
//   - Cost concentration by provider / tier
//   - Projected budget runway and cost per 1k tokens
// =============================================================================
export default function AICostChart({ data: externalData, loading: externalLoading }) {
  const { formatCostFromUSD } = useCurrency();
  const [internalData, setInternalData] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    if (externalData !== undefined) return;

    let mounted = true;

    async function loadUsage() {
      try {
        setInternalLoading(true);
        const result = await adminService.getAIUsage();
        const records =
          result?.data?.usage ?? result?.usage ?? result?.data ?? [];
        if (mounted) setInternalData(Array.isArray(records) ? records : []);
      } catch (error) {
        console.error("Failed to load AI usage:", error);
        if (mounted) setInternalData([]);
      } finally {
        if (mounted) setInternalLoading(false);
      }
    }

    loadUsage();

    return () => {
      mounted = false;
    };
  }, [externalData]);

  const rawRecords = externalData !== undefined ? externalData : internalData;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  const currentMonthRecords = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return rawRecords.filter((item) => {
      const ts = item?.timestamp || item?.createdAt || item?.date;
      if (!ts) return false;
      const d = new Date(ts);
      return (
        !Number.isNaN(d.getTime()) &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      );
    });
  }, [rawRecords]);

  const { totalCost, totalTokens, costBreakdown } = useMemo(() => {
    let cost = 0;
    let tokens = 0;
    const providerMap = {};

    currentMonthRecords.forEach((item) => {
      const c = Number(item?.estimatedCost || 0);
      const t =
        Number(item?.totalTokens || 0) ||
        Number(item?.promptTokens || 0) + Number(item?.completionTokens || 0);

      cost += c;
      tokens += t;

      const rawProvider =
        item?.provider ||
        (item?.model && String(item.model).includes("gemini")
          ? "Google Gemini"
          : item?.model && String(item.model).includes("gpt")
          ? "OpenAI"
          : "Other");

      providerMap[rawProvider] = (providerMap[rawProvider] || 0) + c;
    });

    const breakdown = Object.entries(providerMap)
      .map(([provider, amount]) => ({
        provider,
        amount,
        percentage: cost > 0 ? (amount / cost) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { totalCost: cost, totalTokens: tokens, costBreakdown: breakdown };
  }, [currentMonthRecords]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const daysElapsed = Math.max(
    1,
    Math.ceil((Date.now() - monthStart.getTime()) / 86400000)
  );

  const avgDailySpend = totalCost / daysElapsed;
  const projectedEnd = avgDailySpend * 30;
  const budget = 600;
  const budgetUsed = budget > 0 ? (totalCost / budget) * 100 : 0;
  const costPer1k =
    totalTokens > 0 ? (totalCost / totalTokens) * 1000 : 0;

  return (
    <section className="ai-subdivision-card" id="module-cost-chart">
      <div className="ai-subdivision-header">
        <div className="ai-subdivision-title-group">
          <div className="ai-subdivision-icon-badge">
            <DollarSign size={18} />
          </div>
          <div>
            <h3 className="ai-subdivision-title">AI Cost & Spend Analysis</h3>
            <p className="ai-subdivision-subtitle">
              Estimated provider expenses, burn rate, and cost concentration
            </p>
          </div>
        </div>

        <div className="ai-cost-header-meta">
          <span className="ai-cost-period-badge">Current Month</span>
          <span className="ai-cost-estimate-badge">
            <span className="ai-cost-live-dot" />
            {loading ? "Loading..." : "Live Usage"}
          </span>
        </div>
      </div>

      <div className="ai-cost-summary-strip">
        <div className="ai-cost-stat">
          <span className="ai-cost-label">Monthly Cumulative</span>
          <strong className="ai-cost-val">
            {formatCostFromUSD(totalCost)}
          </strong>
          <span className="ai-cost-sub">
            Budget: {formatCostFromUSD(budget)} ({Math.min(budgetUsed, 100).toFixed(0)}% used)
          </span>
        </div>

        <div className="ai-cost-stat">
          <span className="ai-cost-label">Avg Daily Spend</span>
          <strong className="ai-cost-val">
            {formatCostFromUSD(avgDailySpend)} / day
          </strong>
          <span className="ai-cost-sub">
            Projected end: {formatCostFromUSD(projectedEnd)}
          </span>
        </div>

        <div className="ai-cost-stat">
          <span className="ai-cost-label">Efficiency</span>
          <strong className="ai-cost-val">
            {formatCostFromUSD(costPer1k, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} / 1k
          </strong>
          <span className="ai-cost-sub">
            Based on recorded current-month tokens
          </span>
        </div>
      </div>

      <div className="ai-cost-budget-panel">
        <div className="ai-cost-budget-header">
          <div>
            <span className="ai-cost-budget-label">Monthly AI Budget</span>
            <div className="ai-cost-budget-value">
              {formatCostFromUSD(totalCost)} <span>/ {formatCostFromUSD(budget)}</span>
            </div>
          </div>
          <span className="ai-cost-budget-status">
            {budgetUsed <= 100 ? "Within budget" : "Over budget"}
          </span>
        </div>

        <div className="ai-cost-budget-track">
          <div
            className="ai-cost-budget-fill"
            style={{ width: `${Math.min(Math.max(budgetUsed, 0), 100)}%` }}
          />
        </div>

        <div className="ai-cost-budget-footer">
          <span>{budgetUsed.toFixed(1)}% used</span>
          <span>
            {formatCostFromUSD(Math.max(budget - totalCost, 0))} remaining
          </span>
        </div>
      </div>

      <div className="ai-cost-breakdown-list">
        <div className="ai-cost-breakdown-header">
          <div>
            <div className="ai-table-title">Spend by Provider</div>
            <span className="ai-cost-breakdown-caption">
              Aggregated from recorded AI usage for the current month
            </span>
          </div>
          <span className="ai-cost-breakdown-total">
            Total {formatCostFromUSD(totalCost)}
          </span>
        </div>

        {loading ? (
          <div className="ai-cost-breakdown-row">
            <span className="ai-provider-rank">—</span>
            <div className="ai-provider-meta">
              <div className="ai-provider-name-line">
                <span className="provider-dot" />
                <strong>Loading usage...</strong>
              </div>
            </div>
          </div>
        ) : costBreakdown.length === 0 ? (
          <div className="ai-cost-breakdown-row">
            <span className="ai-provider-rank">—</span>
            <div className="ai-provider-meta">
              <div className="ai-provider-name-line">
                <span className="provider-dot" />
                <strong>No recorded provider spend</strong>
              </div>
              <span className="ai-provider-model">
                No current-month AI usage records were returned.
              </span>
            </div>
          </div>
        ) : (
          <div className="ai-provider-list">
            {costBreakdown.map((item, idx) => (
              <div key={item.provider} className="ai-cost-breakdown-row">
                <span className="ai-provider-rank">{idx + 1}</span>

                <div className="ai-provider-meta">
                  <div className="ai-provider-name-line">
                    <span className="provider-dot" />
                    <strong>{item.provider}</strong>
                  </div>
                  <span className="ai-provider-model">
                    Current-month recorded usage
                  </span>
                </div>

                <div className="provider-bar-wrap">
                  <div
                    className="provider-bar"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <strong className="provider-amount">
                  {formatCostFromUSD(item.amount)}
                </strong>

                <span className="provider-share">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ai-cost-footer-note">
        Cost figures use the <strong>estimatedCost</strong> values returned by the
        AI usage API; no provider pricing is hard-coded into this component.
      </div>
    </section>
  );
}

export { AICostChart };
