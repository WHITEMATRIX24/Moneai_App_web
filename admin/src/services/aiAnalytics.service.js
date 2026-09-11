import api from "./api.js";

/**
 * =============================================================================
 * AI ANALYTICS SERVICE & DATA CONTRACTS
 * =============================================================================
 * Decoupled data layer for AI telemetry, token consumption, model performance,
 * and cost tracking. Ready for real backend API integration with built-in
 * mock fallbacks and lifecycle simulation.
 */

// Production baseline KPI contract
export const DEFAULT_AI_KPIS = [
  {
    id: "requests",
    label: "Total AI Requests",
    value: "142,850",
    change: "+14.2%",
    trend: "up",
    subtext: "12,480 today",
    iconName: "Zap",
    spark: [62, 70, 66, 80, 88, 95, 102],
  },
  {
    id: "users",
    label: "Active AI Users",
    value: "8,940",
    change: "+8.7%",
    trend: "up",
    subtext: "64.2% daily engagement",
    iconName: "Users",
    spark: [50, 58, 54, 62, 68, 72, 79],
  },
  {
    id: "tokens",
    label: "Token Consumption",
    value: "48.6M",
    change: "+22.4%",
    trend: "up",
    subtext: "18.2M in · 30.4M out",
    iconName: "Coins",
    spark: [40, 52, 48, 61, 70, 84, 97],
  },
  {
    id: "cost",
    label: "Provider Cost",
    value: "$348.20",
    change: "+5.1%",
    trend: "up",
    subtext: "Avg $0.0024 / 1k tokens",
    iconName: "DollarSign",
    spark: [30, 34, 32, 38, 41, 44, 48],
  },
  {
    id: "latency",
    label: "Avg Latency",
    value: "480ms",
    change: "-12.5%",
    trend: "down",
    subtext: "p50 320ms · p95 890ms",
    iconName: "Clock",
    spark: [90, 82, 76, 70, 66, 58, 52],
  },
  {
    id: "success_rate",
    label: "Success Rate",
    value: "99.42%",
    change: "+0.18%",
    trend: "up",
    subtext: "Error rate: 0.58%",
    iconName: "CheckCircle2",
    spark: [97, 98, 97.8, 99, 99.1, 99.3, 99.42],
  },
];

export const DEFAULT_USAGE_TIMESERIES = {
  tokens: [
    { label: "Mon", input: 5.2, output: 8.4, total: 13.6 },
    { label: "Tue", input: 6.8, output: 10.1, total: 16.9 },
    { label: "Wed", input: 8.1, output: 12.5, total: 20.6 },
    { label: "Thu", input: 7.4, output: 11.3, total: 18.7 },
    { label: "Fri", input: 9.6, output: 13.8, total: 23.4 },
    { label: "Sat", input: 4.9, output: 7.6, total: 12.5 },
    { label: "Sun", input: 5.6, output: 8.9, total: 14.5 },
  ],
  requests: [
    { label: "Mon", input: 18.4, output: 0, total: 18.4 },
    { label: "Tue", input: 22.1, output: 0, total: 22.1 },
    { label: "Wed", input: 27.6, output: 0, total: 27.6 },
    { label: "Thu", input: 24.3, output: 0, total: 24.3 },
    { label: "Fri", input: 31.2, output: 0, total: 31.2 },
    { label: "Sat", input: 15.8, output: 0, total: 15.8 },
    { label: "Sun", input: 19.4, output: 0, total: 19.4 },
  ],
};

export const aiAnalyticsService = {
  /**
   * Fetches AI KPI metrics. Falls back to mock data if endpoint is not wired up.
   */
  async getKpiMetrics({ timeframe = "7d" } = {}) {
    try {
      const response = await api.get(`/ai/kpis?timeframe=${timeframe}`);
      return response.data;
    } catch {
      // Graceful fallback for local development & review with realistic brief delay
      await new Promise((r) => setTimeout(r, 450));
      return DEFAULT_AI_KPIS;
    }
  },

  /**
   * Fetches usage time-series and breakdowns from backend or fallback.
   */
  async getUsageTrends({ timeframe = "7d" } = {}) {
    try {
      const response = await api.get(`/ai/usage-trends?timeframe=${timeframe}`);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 450));
      return DEFAULT_USAGE_TIMESERIES;
    }
  },
};

export default aiAnalyticsService;
