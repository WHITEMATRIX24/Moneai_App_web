// src/pages/DashboardPage.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  HeartPulse,
  ListTodo,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Zap,
  CalendarDays,
  Pill,
  Check,
  Users,
  UserCheck,
  Bell,
  ShieldAlert,
  ExternalLink,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  GripVertical,
  EyeOff,
  Maximize2,
  Minimize2,
  Save,
  RotateCcw,
  Plus,
  X,
  LayoutGrid,
} from "lucide-react";
import { toast } from "react-toastify";

import { overviewService } from "../services/overview.service.js";
import { adminService } from "../services/admin.service.js";
import { todoService } from "../services/todo.service.js";
import { medicineService } from "../services/medicine.service.js";
import { getStoredUser } from "../services/auth.service.js";
import api from "../services/api.js";
import PageHeader from "../components/PageHeader.jsx";
import { useCurrency, formatCurrency as globalFormatCurrency } from "../utils/currency.js";
import "./DashboardPage.css";

const STEP_GOAL = 10000;

export const ALL_SYSTEM_WIDGETS = [
  { key: "overview", id: "default-overview", title: "Financial Overview", colSpan: 1, type: "module" },
  { key: "health", id: "default-health", title: "Wellness & Daily Progress", colSpan: 1, type: "module" },
  { key: "finance", id: "default-finance", title: "Recent Transactions", colSpan: 1, type: "module" },
  { key: "ai", id: "default-ai", title: "Recent AI Activity", colSpan: 1, type: "module" },
  { key: "todo", id: "default-todo", title: "To-Do & Tasks", colSpan: 1, type: "module" },
  { key: "medicines", id: "default-medicines", title: "Medication Tracker", colSpan: 1, type: "module" },
  { key: "notifications", id: "default-notifications", title: "Alerts & Notifications", colSpan: 1, type: "module" },
];

export const DEFAULT_WIDGET_ORDER = [
  { id: "default-overview", key: "overview", title: "Financial Overview", enabled: true, colSpan: 1 },
  { id: "default-health", key: "health", title: "Wellness & Daily Progress", enabled: true, colSpan: 1 },
  { id: "default-finance", key: "finance", title: "Recent Transactions", enabled: true, colSpan: 1 },
  { id: "default-ai", key: "ai", title: "Recent AI Activity", enabled: true, colSpan: 1 },
  { id: "default-todo", key: "todo", title: "To-Do & Tasks", enabled: true, colSpan: 1 },
  { id: "default-medicines", key: "medicines", title: "Medication Tracker", enabled: true, colSpan: 1 },
];

function getWidgetKey(widget) {
  if (!widget) return "";
  if (typeof widget === "string") return widget.toLowerCase();
  return String(
    widget.key ||
    widget.widgetId ||
    widget.slug ||
    widget.code ||
    widget.type ||
    widget.id ||
    ""
  ).toLowerCase();
}

function getWidgetTitle(widget) {
  if (!widget) return "Widget";
  if (typeof widget === "string") {
    const found = ALL_SYSTEM_WIDGETS.find((w) => w.key === widget);
    return found?.title || widget;
  }
  return widget.title || widget.name || widget.label || widget.key || "Widget";
}

function formatCurrency(value) {
  return globalFormatCurrency(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-block skeleton-hero" />

      <div className="dashboard-stat-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="skeleton-block skeleton-card"
            key={`stat-skeleton-${index}`}
          />
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="skeleton-block skeleton-panel" />
        <div className="skeleton-block skeleton-panel" />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, variant, footer }) {
  return (
    <article className={`dashboard-stat-card ${variant || ""}`}>
      <div className="dashboard-stat-card__top">
        <div className="dashboard-stat-card__icon">
          <Icon size={20} strokeWidth={2} />
        </div>

        {footer && <span className="dashboard-stat-card__badge">{footer}</span>}
      </div>

      <div className="dashboard-stat-card__body">
        <span className="dashboard-stat-card__label">{title}</span>
        <strong>{value}</strong>
        <span className="dashboard-stat-card__subtitle">{subtitle}</span>
      </div>
    </article>
  );
}

export default function DashboardPage({ isAdmin = false }) {
  const { currency } = useCurrency();
  const location = useLocation();
  const isAdminView = isAdmin || location.pathname.startsWith("/admin");
  const user = getStoredUser();

  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [aiChats, setAiChats] = useState([]);
  const [todos, setTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [doses, setDoses] = useState([]);
  const [dosesLoading, setDosesLoading] = useState(true);
  const [dosingId, setDosingId] = useState(null);
  const [customWidgets, setCustomWidgets] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [widgetLayout, setWidgetLayout] = useState([]);
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const firstName = user?.name?.trim()?.split(" ")[0] || "there";

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const transactionsRequest = overviewService.transactions();
      const aiUsageRequest = isAdminView ? adminService.getAIUsage() : overviewService.aiUsage();
      const layoutRequest = api.get("/widgets/layout");

      const requests = [transactionsRequest, aiUsageRequest, layoutRequest];

      if (isAdminView) {
        requests.push(adminService.dashboard());
        requests.push(adminService.notifications());
      } else {
        requests.push(overviewService.metrics());
        requests.push(api.get("/notifications"));
      }

      const results = await Promise.allSettled(requests);
      const [transactionsResult, aiUsageResult, layoutResult, primaryResult, notifResult] = results;

      let failedRequests = 0;

      if (transactionsResult.status === "fulfilled") {
        setTransactions(
          Array.isArray(transactionsResult.value?.data?.transactions)
            ? transactionsResult.value.data.transactions
            : [],
        );
      } else {
        setTransactions([]);
        failedRequests += 1;
      }

      if (aiUsageResult.status === "fulfilled") {
        const usageData = aiUsageResult.value?.data?.usage || aiUsageResult.value?.data?.data || [];
        setAiChats(Array.isArray(usageData) ? usageData : []);
      } else {
        setAiChats([]);
        failedRequests += 1;
      }

      if (layoutResult.status === "fulfilled") {
        const list = layoutResult.value?.data?.widgets || layoutResult.value?.data?.data?.widgets || [];
        setWidgetLayout(list);
        const customOnly = list.filter((w) => w && (w.type === "custom" || w.customType));
        setCustomWidgets(customOnly);

        const activeList = list.filter((w) => w && w.enabled !== false && w.active !== false);
        if (activeList.length > 0) {
          setActiveWidgets(activeList);
        } else {
          setActiveWidgets(DEFAULT_WIDGET_ORDER);
        }
      } else {
        setActiveWidgets(DEFAULT_WIDGET_ORDER);
      }

      if (isAdminView) {
        if (primaryResult.status === "fulfilled") {
          setAdminData(primaryResult.value?.data || null);
        } else {
          setAdminData(null);
          failedRequests += 1;
        }

        if (notifResult && notifResult.status === "fulfilled") {
          const list = notifResult.value?.data?.notifications || notifResult.value?.data?.data || [];
          setNotifications(Array.isArray(list) ? list : []);
        }
      } else {
        if (primaryResult.status === "fulfilled") {
          setMetrics(
            Array.isArray(primaryResult.value?.data?.metrics)
              ? primaryResult.value.data.metrics
              : [],
          );
        } else {
          setMetrics([]);
          failedRequests += 1;
        }

        if (notifResult && notifResult.status === "fulfilled") {
          const list = notifResult.value?.data?.notifications || notifResult.value?.data?.data || [];
          setNotifications(Array.isArray(list) ? list : []);
        }
      }

      if (failedRequests > 0) {
        setError(
          "Some dashboard information could not be loaded. The available data is shown below.",
        );
      }
    } catch (err) {
      console.error("Dashboard load error:", err);

      setError("Unable to load your dashboard right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdminView]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const loadDoses = useCallback(async () => {
    setDosesLoading(true);

    try {
      const response = await medicineService.listToday();

      setDoses(Array.isArray(response?.data?.doses) ? response.data.doses : []);
    } catch (err) {
      console.error("Failed to load medicine widget:", err);

      setDoses([]);
    } finally {
      setDosesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdminView) {
      loadDoses();
    }
  }, [loadDoses, isAdminView]);

  const loadCustomWidgets = useCallback(async () => {
    try {
      const response = await api.get("/widgets/layout");
      const list = response?.data?.widgets || response?.data?.data?.widgets || [];
      const customOnly = list.filter((w) => w && (w.type === "custom" || w.customType));
      setCustomWidgets(customOnly);
    } catch {
      // quiet fallback
    }
  }, []);

  useEffect(() => {
    loadCustomWidgets();
  }, [loadCustomWidgets]);

  const remainingDoses = useMemo(() => {
    return [...doses]
      .filter((d) => !d.taken)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [doses]);

  const handleMarkDoseTaken = async (dose) => {
    const key = `${dose.medicineId}-${dose.time}`;

    setDosingId(key);

    try {
      await medicineService.markTaken(dose.medicineId, dose.time);

      setDoses((prev) =>
        prev.map((d) =>
          d.medicineId === dose.medicineId && d.time === dose.time
            ? { ...d, taken: true }
            : d,
        ),
      );
      toast.success("Dose marked as taken!");
    } catch (err) {
      console.error("Failed to mark dose taken:", err);
      toast.error("Unable to update dose.");
    } finally {
      setDosingId(null);
    }
  };

  const loadTodos = useCallback(async () => {
    setTodosLoading(true);

    try {
      const response = await todoService.list({});

      setTodos(Array.isArray(response?.data?.todos) ? response.data.todos : []);
    } catch (err) {
      console.error("Failed to load tasks widget:", err);

      setTodos([]);
    } finally {
      setTodosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdminView) {
      loadTodos();
    }
  }, [loadTodos, isAdminView]);

  const upcomingTodos = useMemo(() => {
    return [...todos]
      .filter((todo) => !todo.completed)
      .sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return 0;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;

        return new Date(a.dueAt) - new Date(b.dueAt);
      })
      .slice(0, 5);
  }, [todos]);

  const handleCompleteTask = async (id) => {
    setCompletingId(id);

    try {
      await todoService.complete(id);

      setTodos((prev) =>
        prev.map((todo) =>
          todo._id === id ? { ...todo, completed: true } : todo,
        ),
      );
      toast.success("Task completed!");
    } catch (err) {
      console.error("Failed to complete task:", err);
      toast.error("Unable to complete task.");
    } finally {
      setCompletingId(null);
    }
  };

  const availableToAdd = useMemo(() => {
    const activeKeys = new Set(activeWidgets.map((w) => getWidgetKey(w)));
    const systemAvailable = ALL_SYSTEM_WIDGETS.filter((w) => !activeKeys.has(w.key));
    const customAvailable = customWidgets.filter((w) => !activeKeys.has(getWidgetKey(w)));
    return [...systemAvailable, ...customAvailable];
  }, [activeWidgets, customWidgets]);

  const handleMoveWidget = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= activeWidgets.length) return;
    setActiveWidgets((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleToggleColSpan = (index) => {
    setActiveWidgets((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      const currentSpan = target.colSpan || (target.width === 2 ? 2 : 1);
      const newSpan = currentSpan === 2 ? 1 : 2;
      target.colSpan = newSpan;
      target.width = newSpan;
      copy[index] = target;
      return copy;
    });
  };

  const handleRemoveWidget = (index) => {
    const removed = activeWidgets[index];
    setActiveWidgets((prev) => prev.filter((_, i) => i !== index));
    toast.info(`${removed.title || "Widget"} hidden from dashboard.`);
  };

  const handleAddWidget = (widgetDef) => {
    setActiveWidgets((prev) => [
      ...prev,
      {
        ...widgetDef,
        enabled: true,
        colSpan: widgetDef.colSpan || 1,
      },
    ]);
    toast.success(`${widgetDef.title} added to dashboard!`);
  };

  const handleResetLayout = async () => {
    try {
      setSavingLayout(true);
      setActiveWidgets(DEFAULT_WIDGET_ORDER);
      await api.put("/widgets/layout", { widgets: DEFAULT_WIDGET_ORDER });
      toast.success("Dashboard reset to default layout.");
    } catch (err) {
      console.error("Failed to reset layout:", err);
      toast.error("Could not reset layout on server.");
    } finally {
      setSavingLayout(false);
    }
  };

  const handleSaveLayout = async () => {
    try {
      setSavingLayout(true);
      const payload = activeWidgets.map((w, idx) => ({
        id: w.id || w.widgetId || `widget-${w.key || idx}`,
        widgetId: w.widgetId || w.id || w.key,
        key: w.key || w.widgetId,
        title: w.title || getWidgetTitle(w),
        type: w.type || (w.customType ? "custom" : "module"),
        customType: w.customType,
        config: w.config,
        colSpan: w.colSpan || (w.width === 2 ? 2 : 1),
        width: w.width || w.colSpan || 1,
        height: w.height || 1,
        enabled: true,
        order: idx,
      }));

      await api.put("/widgets/layout", { widgets: payload });
      toast.success("Dashboard layout saved successfully!");
      setIsCustomizing(false);
    } catch (err) {
      console.error("Failed to save layout:", err);
      toast.error(err?.response?.data?.message || "Failed to save dashboard layout.");
    } finally {
      setSavingLayout(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    setActiveWidgets((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(draggedIndex, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const finance = useMemo(() => {
    return transactions.reduce(
      (summary, transaction) => {
        const amount = Number(transaction.amount || 0);

        if (transaction.type === "INCOME") {
          summary.income += amount;
        } else {
          summary.expenses += amount;
        }

        return summary;
      },
      {
        income: 0,
        expenses: 0,
      },
    );
  }, [transactions]);

  const balance = finance.income - finance.expenses;

  const todaySteps = useMemo(() => {
    const today = new Date().toDateString();

    return metrics
      .filter((metric) => {
        if (metric.type !== "STEPS" || !metric.recordedAt) {
          return false;
        }

        return new Date(metric.recordedAt).toDateString() === today;
      })
      .reduce((sum, metric) => sum + Number(metric.value || 0), 0);
  }, [metrics]);

  const stepProgress = Math.min(
    Math.round((todaySteps / STEP_GOAL) * 100),
    100,
  );

  const openTasks = useMemo(() => {
    return todos.filter((todo) => !todo.completed).length;
  }, [todos]);

  const completedTasks = useMemo(() => {
    return todos.filter((todo) => todo.completed).length;
  }, [todos]);

  const latestTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateA = new Date(a.transactionDate || a.createdAt || 0).getTime();

        const dateB = new Date(b.transactionDate || b.createdAt || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 6);
  }, [transactions]);

  const latestAIChats = useMemo(() => {
    return [...aiChats]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 5);
  }, [aiChats]);

  const totalTokens = useMemo(() => {
    return aiChats.reduce((sum, chat) => {
      const count =
        chat.totalTokens ??
        chat.tokens ??
        ((chat.promptTokens || 0) + (chat.completionTokens || 0));
      return sum + Number(count || 0);
    }, 0);
  }, [aiChats]);

  const expensePercentage =
    finance.income > 0
      ? Math.min(Math.round((finance.expenses / finance.income) * 100), 100)
      : 0;

  if (loading) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle="Loading your personal overview."
        />

        <DashboardSkeleton />
      </>
    );
  }

  const renderFinancialOverview = () => (
    <article className="dashboard-panel dashboard-finance-panel">
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">Finance</span>
          <h2>Financial overview</h2>
          <p>Income and spending across your account.</p>
        </div>

        <div className="dashboard-panel-icon">
          <CircleDollarSign size={21} />
        </div>
      </div>

      <div className="dashboard-money-summary">
        <div className="dashboard-money-item">
          <div className="dashboard-money-icon income">
            <TrendingUp size={18} />
          </div>

          <div>
            <span>Total income</span>
            <strong>{formatCurrency(finance.income)}</strong>
          </div>
        </div>

        <div className="dashboard-money-item">
          <div className="dashboard-money-icon expense">
            <TrendingDown size={18} />
          </div>

          <div>
            <span>Total expenses</span>
            <strong>{formatCurrency(finance.expenses)}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-progress-section">
        <div className="dashboard-progress-heading">
          <span>Income used</span>
          <strong>{expensePercentage}%</strong>
        </div>

        <div className="dashboard-progress-track">
          <div
            className="dashboard-progress-value dashboard-progress-value--finance"
            style={{
              width: `${expensePercentage}%`,
            }}
          />
        </div>

        <div className="dashboard-progress-footer">
          <span>{formatCurrency(finance.expenses)} spent</span>
          <span>{formatCurrency(balance)} remaining</span>
        </div>
      </div>
    </article>
  );

  const renderDailyProgress = () => (
    <article className="dashboard-panel dashboard-wellness-panel">
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">Wellness</span>
          <h2>Daily progress</h2>
          <p>Keep moving toward your activity goal.</p>
        </div>

        <div className="dashboard-panel-icon">
          <HeartPulse size={21} />
        </div>
      </div>

      <div className="dashboard-step-content">
        <div className="dashboard-progress-ring">
          <svg viewBox="0 0 120 120">
            <circle
              className="dashboard-progress-ring__track"
              cx="60"
              cy="60"
              r="50"
            />

            <circle
              className="dashboard-progress-ring__value"
              cx="60"
              cy="60"
              r="50"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - stepProgress}
            />
          </svg>

          <div className="dashboard-progress-ring__center">
            <strong>{stepProgress}%</strong>
            <span>complete</span>
          </div>
        </div>

        <div className="dashboard-step-details">
          <span>Steps completed</span>

          <strong>{formatNumber(todaySteps)}</strong>

          <p>
            {todaySteps >= STEP_GOAL
              ? "Daily goal achieved. Great work!"
              : `${formatNumber(
                  Math.max(STEP_GOAL - todaySteps, 0),
                )} steps remaining today.`}
          </p>

          <div className="dashboard-mini-status">
            {todaySteps >= STEP_GOAL ? (
              <CheckCircle2 size={16} />
            ) : (
              <Zap size={16} />
            )}

            <span>
              {todaySteps >= STEP_GOAL ? "Goal completed" : "Keep going"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );

  const renderRecentTransactions = () => (
    <article className="dashboard-panel dashboard-transactions-panel">
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">Activity</span>
          <h2>Recent transactions</h2>
          <p>Your latest income and expense activity.</p>
        </div>

        <span className="dashboard-count-badge">{transactions.length}</span>
      </div>

      {latestTransactions.length ? (
        <div className="dashboard-transaction-list">
          {latestTransactions.slice(0, 5).map((transaction) => {
            const isIncome = transaction.type === "INCOME";

            return (
              <div className="dashboard-transaction" key={transaction._id}>
                <div
                  className={`dashboard-transaction__icon ${
                    isIncome ? "income" : "expense"
                  }`}
                >
                  {isIncome ? (
                    <ArrowDownRight size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </div>

                <div className="dashboard-transaction__info">
                  <strong>{transaction.category || "Uncategorized"}</strong>

                  <span>
                    {formatDate(
                      transaction.transactionDate || transaction.createdAt,
                    )}
                  </span>
                </div>

                <div className="dashboard-transaction__amount">
                  <strong className={isIncome ? "income" : "expense"}>
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </strong>

                  <span>{transaction.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-state__icon">
            <WalletCards size={24} />
          </div>

          <strong>No transactions yet</strong>
          <p>Your recent income and expenses will appear here.</p>
        </div>
      )}
    </article>
  );

  const renderRecentAI = () => (
    <article className="dashboard-panel dashboard-ai-panel">
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">Intelligence</span>
          <h2>Recent AI activity</h2>
          <p>Your latest assistant conversations.</p>
        </div>

        <div className="dashboard-panel-icon dashboard-panel-icon--ai">
          <BrainCircuit size={21} />
        </div>
      </div>

      {latestAIChats.length ? (
        <div className="dashboard-ai-list">
          {latestAIChats.slice(0, 5).map((chat, index) => (
            <div className="dashboard-ai-item" key={chat._id || index}>
              <div className="dashboard-ai-item__avatar">
                <Sparkles size={17} />
              </div>

              <div className="dashboard-ai-item__content">
                <div className="dashboard-ai-item__heading">
                  <strong>{chat.model || "AI Assistant"}</strong>
                  <span>{formatTime(chat.createdAt)}</span>
                </div>

                <div className="dashboard-ai-item__meta">
                  <span>
                    {(chat.totalTokens ?? chat.tokens)
                      ? `${formatNumber(chat.totalTokens ?? chat.tokens)} tokens`
                      : "Conversation"}
                  </span>
                  <span className="dashboard-dot" />
                  <span>{formatDate(chat.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-state__icon ai">
            <BrainCircuit size={24} />
          </div>

          <strong>No AI activity yet</strong>
          <p>Your latest AI conversations will appear here.</p>
        </div>
      )}

      <Link to={isAdminView ? "/admin/ai" : "/ai"} className="view-all-link">
        {isAdminView ? "View AI analytics →" : "Open AI Assistant →"}
      </Link>
    </article>
  );

  const renderRecentUsers = () => (
    <article className="dashboard-panel dashboard-users-panel">
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">User Management</span>
          <h2>Recent Platform Users</h2>
          <p>Latest registered member accounts across MONE AI.</p>
        </div>

        <div className="dashboard-panel-icon">
          <Users size={20} />
        </div>
      </div>

      {adminData?.recentUsers && adminData.recentUsers.length > 0 ? (
        <div className="dashboard-users-list">
          {adminData.recentUsers.slice(0, 5).map((u) => {
            const initial = (u.name || u.email || "U")[0].toUpperCase();
            const plan = (u.subscriptionPlan || "FREE").toUpperCase();
            const status = (u.status || "ACTIVE").toUpperCase();

            return (
              <div className="dashboard-user-row" key={u._id}>
                <div className="dashboard-user-main">
                  <div className="dashboard-user-avatar">
                    {initial}
                  </div>
                  <div className="dashboard-user-info">
                    <strong>{u.name || "Unnamed User"}</strong>
                    <span>{u.email}</span>
                  </div>
                </div>

                <div className="dashboard-user-badges">
                  <span className={`dashboard-badge dashboard-badge--plan dashboard-badge--${plan.toLowerCase()}`}>
                    {plan}
                  </span>
                  <span className={`dashboard-badge dashboard-badge--status dashboard-badge--${status.toLowerCase()}`}>
                    <span className="dashboard-badge-dot" />
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-state__icon">
            <Users size={24} />
          </div>
          <strong>No users found</strong>
          <p>Registered platform members will be listed here.</p>
        </div>
      )}

      <Link to="/admin/users" className="view-all-link">
        Manage all users →
      </Link>
    </article>
  );

  const renderNotifications = () => (
    <article className={`dashboard-panel dashboard-notif-panel ${customWidgets.length === 0 ? "dashboard-panel--span-2" : ""}`}>
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">Communication</span>
          <h2>Alerts & Notifications</h2>
          <p>Platform security, broadcast events and system notices.</p>
        </div>

        <div className="dashboard-panel-icon">
          <Bell size={20} />
        </div>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="dashboard-notif-list">
          {notifications.slice(0, 5).map((notif) => {
            const priority = (notif.priority || "NORMAL").toUpperCase();

            return (
              <div className="dashboard-notif-row" key={notif._id}>
                <div className="dashboard-notif-main">
                  <div className="dashboard-notif-icon">
                    <Bell size={16} />
                  </div>
                  <div className="dashboard-notif-info">
                    <div className="dashboard-notif-title-row">
                      <strong>{notif.title || notif.subject || "System Notification"}</strong>
                      <span className="dashboard-notif-date">{formatDate(notif.createdAt)}</span>
                    </div>
                    <p>{notif.body || notif.message || notif.content || "Platform event logged."}</p>
                  </div>
                </div>

                <div className="dashboard-notif-meta">
                  {notif.priority && (
                    <span className={`dashboard-badge dashboard-badge--priority dashboard-badge--${priority.toLowerCase()}`}>
                      {priority}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-state__icon">
            <Bell size={24} />
          </div>
          <strong>All caught up</strong>
          <p>No active platform alerts or critical notifications.</p>
        </div>
      )}

      <Link to={isAdminView ? "/admin/notifications" : "/notifications"} className="view-all-link">
        View all notifications →
      </Link>
    </article>
  );

  const renderSingleCustomWidget = (widget) => (
    <article className="dashboard-panel dashboard-custom-panel" key={widget.widgetId || widget.id}>
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">{widget.customType || widget.category || "Custom"}</span>
          <h2>{widget.title || "Custom Widget"}</h2>
          <p>{widget.description || "Personalized dashboard widget."}</p>
        </div>
        <div className="dashboard-panel-icon">
          <Sparkles size={20} />
        </div>
      </div>

      <div className="dashboard-custom-widget-body" style={{ marginTop: "14px" }}>
        {widget.config?.statValue && (
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "12px" }}>
            <strong style={{ fontSize: "28px", fontWeight: 700, color: "var(--dash-text, #261c14)" }}>
              {widget.config.statValue}
            </strong>
            {widget.config.change && (
              <span style={{ fontSize: "13px", fontWeight: 650, color: "#16a34a" }}>
                {widget.config.change}
              </span>
            )}
          </div>
        )}

        {Array.isArray(widget.config?.items) && widget.config.items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            {widget.config.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--dash-bg-subtle, #faf6f0)",
                  fontSize: "13px",
                }}
              >
                <span>{typeof item === "object" ? (item.title || item.label || item.name) : String(item)}</span>
                {item.value && <strong>{item.value}</strong>}
              </div>
            ))}
          </div>
        )}

        {widget.config?.progress !== undefined && (
          <div className="dashboard-progress-section" style={{ marginTop: "10px" }}>
            <div className="dashboard-progress-heading">
              <span>{widget.config.progressLabel || "Goal progress"}</span>
              <strong>{widget.config.progress}%</strong>
            </div>
            <div className="dashboard-progress-track">
              <div
                className="dashboard-progress-value dashboard-progress-value--finance"
                style={{ width: `${Math.min(100, Math.max(0, Number(widget.config.progress)))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Link to="/widgets" className="view-all-link">
        Manage in Widgets →
      </Link>
    </article>
  );

  const renderWidgetByKey = (widget) => {
    const key = getWidgetKey(widget);

    if (key.includes("overview")) {
      return renderFinancialOverview();
    }
    if (key.includes("health") || key.includes("wellness") || key.includes("vitals")) {
      return renderDailyProgress();
    }
    if (key.includes("finance") || key.includes("transaction")) {
      return renderRecentTransactions();
    }
    if (key.includes("ai") || key.includes("intelligence") || key.includes("insight")) {
      return renderRecentAI();
    }
    if (key.includes("todo") || key.includes("task") || key.includes("calendar")) {
      return renderTasks();
    }
    if (key.includes("medicin") || key.includes("pill") || key.includes("dose")) {
      return renderMedicines();
    }
    if (key.includes("notif") || key.includes("alert")) {
      return renderNotifications();
    }
    if (key.includes("custom") || widget.type === "custom" || widget.customType) {
      return renderSingleCustomWidget(widget);
    }
    if (customWidgets.length > 0) {
      return renderCustomWidgets(false);
    }
    return null;
  };

  const renderCustomWidgets = (spanAll = false) => (
    <article className="dashboard-panel dashboard-tasks-panel" style={{ gridColumn: spanAll ? "1 / -1" : "auto" }}>
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">Personalized</span>
          <h2>Custom Widgets</h2>
          <p>Your custom dashboard telemetry widgets.</p>
        </div>
        <Link to="/widgets" className="view-all-link">
          Customize widgets →
        </Link>
      </div>
      <div className="dashboard-custom-widgets-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginTop: "16px" }}>
        {customWidgets.map((widget) => (
          <div key={widget.widgetId} className="dashboard-custom-widget" style={{ padding: "16px", borderRadius: "14px", border: "1px solid var(--line, #e2e8f0)", background: "var(--panel, #ffffff)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>{widget.title}</h4>
              <span style={{ fontSize: "11px", textTransform: "uppercase", padding: "3px 8px", borderRadius: "999px", background: "var(--accent-soft)", color: "var(--primary-color)", fontWeight: 700 }}>
                {widget.customType || "Custom"}
              </span>
            </div>
            {widget.description && <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--muted, #64748b)" }}>{widget.description}</p>}
            {widget.config?.statValue && (
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <strong style={{ fontSize: "24px", fontWeight: 700 }}>{widget.config.statValue}</strong>
                {widget.config.change && <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>{widget.config.change}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </article>
  );

  const renderTasks = () => (
    <article className="dashboard-panel dashboard-tasks-panel">
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">Productivity</span>
          <h2>Your tasks</h2>
          <p>Current open tasks — mark them done as you go.</p>
        </div>

        <div className="dashboard-panel-icon">
          <ListTodo size={21} />
        </div>
      </div>

      {todosLoading ? (
        <div className="todo-loading">
          <div className="todo-loader" />
          <span>Loading your tasks...</span>
        </div>
      ) : upcomingTodos.length ? (
        <div className="todo-list dashboard-task-list">
          {upcomingTodos.map((todo) => (
            <article className="todo-item" key={todo._id}>
              <div className="todo-item__main">
                <button
                  type="button"
                  className={`todo-check ${completingId === todo._id ? "loading" : ""}`}
                  onClick={() => handleCompleteTask(todo._id)}
                  disabled={completingId === todo._id}
                  aria-label="Mark task complete"
                  title="Mark task complete"
                >
                  {completingId === todo._id ? (
                    <LoaderCircle size={14} className="dashboard-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>

                <div className="todo-item__content">
                  <strong>{todo.title}</strong>

                  <div className="todo-item__meta">
                    <CalendarDays size={13} />
                    <span>
                      {todo.dueAt
                        ? `Due ${formatDate(todo.dueAt)}`
                        : "No due date"}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-state__icon">
            <ListTodo size={24} />
          </div>

          <strong>No open tasks</strong>
          <p>You're all caught up. Add a task from the To-Do page.</p>
        </div>
      )}

      <Link to="/todos" className="view-all-link">
        View all tasks →
      </Link>
    </article>
  );

  const renderMedicines = () => (
    <article className="dashboard-panel dashboard-tasks-panel">
      <div className="dashboard-panel__header">
        <div>
          <span className="dashboard-section-label">Health</span>
          <h2>Today's medicines</h2>
          <p>Doses you still need to take today.</p>
        </div>

        <div className="dashboard-panel-icon">
          <Pill size={21} />
        </div>
      </div>

      {dosesLoading ? (
        <div className="todo-loading">
          <div className="todo-loader" />
          <span>Loading...</span>
        </div>
      ) : remainingDoses.length ? (
        <div className="todo-list dashboard-task-list">
          {remainingDoses.map((dose) => {
            const key = `${dose.medicineId}-${dose.time}`;

            return (
              <article className="todo-item" key={key}>
                <div className="todo-item__main">
                  <button
                    type="button"
                    className="todo-check"
                    onClick={() => handleMarkDoseTaken(dose)}
                    disabled={dosingId === key}
                    aria-label="Mark dose taken"
                    title="Mark dose taken"
                  >
                    {dosingId === key ? (
                      <LoaderCircle size={14} className="dashboard-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                  </button>

                  <div className="todo-item__content">
                    <strong>{dose.name}</strong>

                    <div className="todo-item__meta">
                      <span className="med-person-badge">
                        {dose.personName || "Me"}
                      </span>
                      {dose.dosage && (
                        <span className="med-dosage-badge">
                          {dose.dosage}
                        </span>
                      )}
                      <Clock3 size={13} />
                      <span>{dose.time}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-state__icon">
            <Pill size={24} />
          </div>

          <strong>All doses taken</strong>
          <p>You're caught up on your medicines for today.</p>
        </div>
      )}

      <Link to="/medicines" className="view-all-link">
        View all medicines →
      </Link>
    </article>
  );

  return (
    <div className="moneai-dashboard">
      <PageHeader
        title="Dashboard"
        subtitle="Your money, health, tasks and AI activity in one place."
      />

      {/* =========================================
          HERO
      ========================================= */}

      <section className="dashboard-hero">
        <div className="dashboard-hero__glow dashboard-hero__glow--one" />
        <div className="dashboard-hero__glow dashboard-hero__glow--two" />

        <div className="dashboard-hero__content">
          <div className="dashboard-hero__eyebrow">
            <Sparkles size={15} />
            <span>{isAdminView ? "Platform Control Center" : "Personal overview"}</span>
          </div>

          <h1>
            {getGreeting()},{" "}
            <span>{isAdminView ? (user?.name || "Administrator") : `${firstName}.`}</span>
          </h1>

          <p>
            {isAdminView
              ? "Platform monitoring, security status, user administration and AI telemetry across MONE AI."
              : "Here's your personal snapshot for today. Stay on top of your finances, wellbeing, productivity and AI activity."}
          </p>

          <div className="dashboard-hero__meta">
            <div>
              <Activity size={16} />
              <span>Dashboard synced</span>
            </div>

            <div>
              <Clock3 size={16} />
              <span>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-hero__actions">
          {!isAdminView && (
            <button
              type="button"
              className={`dashboard-customize-btn ${isCustomizing ? "dashboard-customize-btn--active" : ""}`}
              onClick={() => setIsCustomizing((prev) => !prev)}
              title="Rearrange and customize dashboard widgets"
            >
              <SlidersHorizontal size={17} />
              <span>{isCustomizing ? "Done Customizing" : "Rearrange Dashboard"}</span>
            </button>
          )}

          <button
            type="button"
            className="dashboard-refresh-btn"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <LoaderCircle size={17} className="dashboard-spin" />
            ) : (
              <RefreshCw size={17} />
            )}

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {error && (
        <div className="dashboard-alert">
          <Activity size={18} />

          <div>
            <strong>Partial data available</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* =========================================
          KPI CARDS
      ========================================= */}

      <section className="dashboard-stat-grid">
        {isAdminView ? (
          <>
            <StatCard
              title="Total Users"
              value={formatNumber(adminData?.totalUsers ?? 10)}
              subtitle={`${formatNumber(adminData?.activeUsers ?? 10)} active accounts`}
              icon={Users}
              variant="dashboard-stat-card--balance"
              footer="Platform"
            />

            <StatCard
              title="Active Users"
              value={formatNumber(adminData?.activeUsers ?? 10)}
              subtitle="Current platform activity"
              icon={UserCheck}
              variant="dashboard-stat-card--health"
              footer="Active"
            />

            <StatCard
              title="AI Requests"
              value={formatNumber(adminData?.aiRequests ?? aiChats.length)}
              subtitle={`${formatNumber(totalTokens)} tokens consumed`}
              icon={BrainCircuit}
              variant="dashboard-stat-card--ai"
              footer="AI Operations"
            />

            <StatCard
              title="Platform Volume"
              value={formatCurrency(finance.income)}
              subtitle={`${formatCurrency(finance.expenses)} total expenses`}
              icon={WalletCards}
              variant="dashboard-stat-card--tasks"
              footer="Finance"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Available Balance"
              value={formatCurrency(balance)}
              subtitle={`${formatCurrency(finance.income)} total income`}
              icon={WalletCards}
              variant="dashboard-stat-card--balance"
              footer="Finance"
            />

            <StatCard
              title="Steps Today"
              value={formatNumber(todaySteps)}
              subtitle={`${stepProgress}% of ${formatNumber(STEP_GOAL)} goal`}
              icon={HeartPulse}
              variant="dashboard-stat-card--health"
              footer={`${stepProgress}%`}
            />

            <StatCard
              title="AI Conversations"
              value={formatNumber(aiChats.length)}
              subtitle={`${formatNumber(totalTokens)} tokens used`}
              icon={BrainCircuit}
              variant="dashboard-stat-card--ai"
              footer="AI"
            />

            <StatCard
              title="Open Tasks"
              value={formatNumber(openTasks)}
              subtitle={`${formatNumber(completedTasks)} completed`}
              icon={ListTodo}
              variant="dashboard-stat-card--tasks"
              footer="Tasks"
            />
          </>
        )}
      </section>

      {/* =========================================
          CONTENT GRIDS (ADMIN VS USER)
      ========================================= */}

      {isAdminView ? (
        <>
          {/* ROW 1: FINANCIAL OVERVIEW & RECENT TRANSACTIONS */}
          <section className="dashboard-admin-grid">
            {renderFinancialOverview()}
            {renderRecentTransactions()}
          </section>

          {/* ROW 2: USER MANAGEMENT & RECENT AI ACTIVITY */}
          <section className="dashboard-admin-grid">
            {renderRecentUsers()}
            {renderRecentAI()}
          </section>

          {/* ROW 3: CUSTOM WIDGETS (IF CONFIGURED) */}
          {customWidgets.length > 0 && (
            <section className="dashboard-admin-grid">
              {renderCustomWidgets(true)}
            </section>
          )}
        </>
      ) : (
        <>
          {isCustomizing && (
            <div className="dashboard-customize-toolbar">
              <div className="dashboard-customize-toolbar__left">
                <div className="dashboard-customize-badge">
                  <LayoutGrid size={15} />
                  <span>Customize & Rearrange</span>
                </div>
                <p className="dashboard-customize-hint">
                  Drag cards or use <strong>↑ / ↓</strong> buttons to move widgets. Toggle card width or hide items.
                </p>
              </div>

              <div className="dashboard-customize-toolbar__actions">
                {availableToAdd.length > 0 && (
                  <div className="dashboard-add-widget-menu-wrapper">
                    <button
                      type="button"
                      className="dashboard-toolbar-btn dashboard-toolbar-btn--secondary"
                      onClick={() => setShowAddMenu((prev) => !prev)}
                    >
                      <Plus size={15} />
                      <span>Add Widget ({availableToAdd.length})</span>
                    </button>
                    {showAddMenu && (
                      <div className="dashboard-add-widget-dropdown">
                        <div className="dashboard-add-widget-dropdown__header">
                          <span>Add to Dashboard</span>
                          <button
                            type="button"
                            className="dashboard-dropdown-close"
                            onClick={() => setShowAddMenu(false)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="dashboard-add-widget-dropdown__list">
                          {availableToAdd.map((w) => (
                            <button
                              key={w.key || w.widgetId || w.id}
                              type="button"
                              className="dashboard-add-widget-item"
                              onClick={() => {
                                handleAddWidget(w);
                                setShowAddMenu(false);
                              }}
                            >
                              <Plus size={14} />
                              <span>{w.title || getWidgetTitle(w)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="dashboard-toolbar-btn dashboard-toolbar-btn--secondary"
                  onClick={handleResetLayout}
                  disabled={savingLayout}
                  title="Reset to default widgets and order"
                >
                  <RotateCcw size={15} />
                  <span>Reset Default</span>
                </button>

                <Link
                  to="/widgets"
                  className="dashboard-toolbar-btn dashboard-toolbar-btn--secondary"
                  title="Manage and create widgets in Widgets Center"
                >
                  <ExternalLink size={15} />
                  <span>Widgets Center</span>
                </Link>

                <button
                  type="button"
                  className="dashboard-toolbar-btn dashboard-toolbar-btn--primary"
                  onClick={handleSaveLayout}
                  disabled={savingLayout}
                >
                  {savingLayout ? (
                    <LoaderCircle size={15} className="dashboard-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>{savingLayout ? "Saving..." : "Save Layout"}</span>
                </button>

                <button
                  type="button"
                  className="dashboard-toolbar-btn dashboard-toolbar-btn--done"
                  onClick={() => setIsCustomizing(false)}
                >
                  <Check size={15} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          )}

          <section className="dashboard-customizable-grid">
            {activeWidgets.map((widget, index) => {
              const content = renderWidgetByKey(widget);
              if (!content) return null;

              const isCol2 = widget.colSpan === 2 || widget.width === 2;

              return (
                <div
                  key={widget.id || widget.key || widget.widgetId || index}
                  className={`dashboard-widget-slot ${isCol2 ? "dashboard-widget-slot--col-2" : "dashboard-widget-slot--col-1"} ${isCustomizing ? "dashboard-widget-slot--customizing" : ""} ${draggedIndex === index ? "dashboard-widget-slot--dragging" : ""} ${dragOverIndex === index ? "dashboard-widget-slot--dragover" : ""}`}
                  draggable={isCustomizing}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {isCustomizing && (
                    <div className="dashboard-widget-slot__overlay-bar">
                      <div className="dashboard-widget-slot__grip" title="Drag card to rearrange">
                        <GripVertical size={16} />
                        <span className="dashboard-widget-slot__title">
                          {widget.title || getWidgetTitle(widget)}
                        </span>
                      </div>

                      <div className="dashboard-widget-slot__actions">
                        <button
                          type="button"
                          className="dashboard-slot-btn"
                          disabled={index === 0}
                          onClick={() => handleMoveWidget(index, -1)}
                          title="Move Earlier / Up"
                        >
                          <ChevronUp size={15} />
                        </button>

                        <button
                          type="button"
                          className="dashboard-slot-btn"
                          disabled={index === activeWidgets.length - 1}
                          onClick={() => handleMoveWidget(index, 1)}
                          title="Move Later / Down"
                        >
                          <ChevronDown size={15} />
                        </button>

                        <button
                          type="button"
                          className="dashboard-slot-btn"
                          onClick={() => handleToggleColSpan(index)}
                          title={isCol2 ? "Set Half Width" : "Set Full Width"}
                        >
                          {isCol2 ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>

                        <button
                          type="button"
                          className="dashboard-slot-btn dashboard-slot-btn--remove"
                          onClick={() => handleRemoveWidget(index)}
                          title="Hide from dashboard"
                        >
                          <EyeOff size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="dashboard-widget-slot__body">
                    {content}
                  </div>
                </div>
              );
            })}
          </section>

          {activeWidgets.length === 0 && (
            <div className="dashboard-empty-widgets">
              <div className="dashboard-empty-widgets__icon">
                <LayoutGrid size={32} />
              </div>
              <h3>No widgets on your dashboard</h3>
              <p>You have hidden all dashboard modules. You can restore the default layout or re-add widgets anytime.</p>
              <button
                type="button"
                className="dashboard-toolbar-btn dashboard-toolbar-btn--primary"
                onClick={handleResetLayout}
              >
                <RotateCcw size={15} />
                <span>Restore Default Layout</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
