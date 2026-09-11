import "./FinanceLoadingScreen.css";
import { Wallet, ShieldCheck, TrendingUp, Landmark } from "lucide-react";

export default function FinanceLoadingScreen() {
  return (
    <div className="finance-loading-page" aria-busy="true" aria-label="Loading financial data">
      {/* Top Banner / Pulse Loader */}
      <div className="finance-loading-header">
        <div className="finance-loading-icon-wrapper">
          <div className="finance-loading-icon-glow"></div>
          <div className="finance-loading-icon-core">
            <Wallet className="finance-loading-icon" size={28} />
          </div>
        </div>
        <div className="finance-loading-text-group">
          <h2 className="finance-loading-title">Loading Financial Portfolio</h2>
          <p className="finance-loading-subtitle">
            Securely retrieving your personal accounts, net worth, and ledger...
          </p>
        </div>
        <div className="finance-loading-status-badge">
          <span className="finance-loading-spinner"></span>
          <span>Syncing Live Ledger</span>
        </div>
      </div>

      {/* 4 Shimmer Summary Cards */}
      <div className="finance-loading-cards-grid">
        {[
          { label: "Net Worth", icon: Wallet, color: "#2563eb" },
          { label: "Income", icon: TrendingUp, color: "#16a34a" },
          { label: "Expense", icon: TrendingUp, color: "#dc2626" },
          { label: "Accounts", icon: Landmark, color: "#f97316" },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="finance-loading-card">
              <div className="finance-loading-card-top">
                <div className="finance-loading-card-lines">
                  <div className="skeleton-line skeleton-label"></div>
                  <div className="skeleton-line skeleton-value"></div>
                </div>
                <div
                  className="finance-loading-card-icon-skeleton"
                  style={{ background: `${item.color}22`, color: item.color }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div className="skeleton-line skeleton-footer-bar"></div>
            </div>
          );
        })}
      </div>

      {/* Shimmer Navigation Tabs */}
      <div className="finance-loading-tabs-bar">
        {["Accounts", "Transactions", "Budgets", "Goals", "Analytics"].map(
          (tab, i) => (
            <div
              key={tab}
              className={`finance-loading-tab-skeleton ${
                i === 0 ? "tab-skeleton-active" : ""
              }`}
            >
              <span className="tab-skeleton-dot"></span>
              <span className="tab-skeleton-text"></span>
            </div>
          )
        )}
      </div>

      {/* Shimmer Table / Content Area */}
      <div className="finance-loading-content-card">
        <div className="finance-loading-toolbar-skeleton">
          <div className="skeleton-line skeleton-search-bar"></div>
          <div className="skeleton-line skeleton-btn"></div>
        </div>

        <div className="finance-loading-rows">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="finance-loading-row">
              <div className="skeleton-circle"></div>
              <div className="skeleton-row-details">
                <div className="skeleton-line skeleton-row-title"></div>
                <div className="skeleton-line skeleton-row-sub"></div>
              </div>
              <div className="skeleton-line skeleton-row-pill"></div>
              <div className="skeleton-line skeleton-row-amount"></div>
              <div className="skeleton-line skeleton-row-action"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
