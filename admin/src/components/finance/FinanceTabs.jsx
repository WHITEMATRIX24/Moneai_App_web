import {
  Landmark,
  Receipt,
  Wallet,
  Target,
  BarChart3,
} from "lucide-react";

const tabs = [
  {
    id: "accounts",
    label: "Accounts",
    icon: Landmark,
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: Receipt,
  },
  {
    id: "budgets",
    label: "Budgets",
    icon: Wallet,
  },
  {
    id: "goals",
    label: "Goals",
    icon: Target,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
  },
];

export default function FinanceTabs({
  activeTab,
  setActiveTab,
}) {
  return (
    <div className="finance-tabs">

      {tabs.map((tab) => {

        const Icon = tab.icon;

        return (

          <button
            key={tab.id}
            className={
              activeTab === tab.id
                ? "finance-tab active"
                : "finance-tab"
            }
            onClick={() => setActiveTab(tab.id)}
          >

            <Icon size={18} />

            <span>{tab.label}</span>

          </button>

        );

      })}

    </div>
  );
}