import { useState, useEffect } from "react";

import PageHeader from "../components/PageHeader.jsx";

import FinanceSummaryCards from "../components/finance/FinanceSummaryCards.jsx";
import FinanceTabs from "../components/finance/FinanceTabs.jsx";
import FinanceLoadingScreen from "../components/finance/FinanceLoadingScreen.jsx";

import AccountsTab from "../components/finance/AccountsTab.jsx";
import TransactionsTab from "../components/finance/TransactionsTab.jsx";
import BudgetsTab from "../components/finance/BudgetsTab.jsx";
import GoalsTab from "../components/finance/GoalsTab.jsx";
import AnalyticsTab from "../components/finance/AnalyticsTab.jsx";

import { getFinanceSummary } from "../services/financeSummary.service.js";
import { getAccounts } from "../services/financeAccount.service.js";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initialLoad() {
      setLoading(true);
      const minLoadTime = new Promise((resolve) => setTimeout(resolve, 450));
      try {
        await Promise.allSettled([
          getFinanceSummary(),
          getAccounts(),
          minLoadTime,
        ]);
      } catch (err) {
        console.error("Finance initial load error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      mounted = false;
    };
  }, []);

  function refreshFinance() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="finance-page">

      <PageHeader
        title="Finance"
        subtitle="Manage accounts, transactions, budgets, goals and analytics."
      />

      {loading ? (
        <FinanceLoadingScreen />
      ) : (
        <>
          <section className="finance-summary-section">
            <FinanceSummaryCards refreshKey={refreshKey} />
          </section>

          <section className="finance-tabs-section">
            <FinanceTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </section>

          <section className="finance-content">

            {activeTab === "accounts" && (
              <AccountsTab onRefresh={refreshFinance} />
            )}

            {activeTab === "transactions" && (
              <TransactionsTab onRefresh={refreshFinance} />
            )}

            {activeTab === "budgets" && (
              <BudgetsTab onRefresh={refreshFinance} />
            )}

            {activeTab === "goals" && (
              <GoalsTab onRefresh={refreshFinance} />
            )}

            {activeTab === "analytics" && (
              <AnalyticsTab />
            )}

          </section>
        </>
      )}

    </div>
  );
}