import { useEffect, useState } from "react";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
} from "lucide-react";

import { getFinanceSummary } from "../../services/financeSummary.service.js";

export default function FinanceSummaryCards({ refreshKey }) {
  const [summary, setSummary] = useState({
    netWorth: 0,
    income: 0,
    expense: 0,
    accounts: 0,
  });

  async function loadSummary() {
    try {
      const response = await getFinanceSummary();
      const data = response?.data || response || {};

      setSummary({
        netWorth: Number(data.netWorth) || 0,
        income: Number(data.income) || 0,
        expense: Number(data.expense) || 0,
        accounts: Number(data.accounts) || 0,
      });
    } catch (err) {
      console.error("Failed to load finance summary:", err);
    }
  }

  useEffect(() => {
    loadSummary();
  }, [refreshKey]);

  const cards = [
    {
      title: "Net Worth",
      value: `₹${Number(summary?.netWorth || 0).toLocaleString()}`,
      change: "",
      icon: Wallet,
      color: "#2563eb",
    },
    {
      title: "Income",
      value: `₹${Number(summary?.income || 0).toLocaleString()}`,
      change: "",
      icon: TrendingUp,
      color: "#16a34a",
    },
    {
      title: "Expense",
      value: `₹${Number(summary?.expense || 0).toLocaleString()}`,
      change: "",
      icon: TrendingDown,
      color: "#dc2626",
    },
    {
      title: "Accounts",
      value: summary?.accounts ?? 0,
      change: "",
      icon: Landmark,
      color: "#f97316",
    },
  ];

  return (
    <div className="finance-summary-grid">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="finance-summary-card"
          >
            <div className="summary-top">

              <div>

                <p className="summary-label">
                  {card.title}
                </p>

                <h2>{card.value}</h2>

              </div>

              <div
                className="summary-icon"
                style={{
                  background: card.color,
                }}
              >
                <Icon size={24} color="white" />
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}