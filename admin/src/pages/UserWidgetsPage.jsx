// src/pages/UserWidgetsPage.jsx

import { useEffect, useMemo, useState } from "react";

import {
  LayoutGrid,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  WalletCards,
  Bell,
  BrainCircuit,
  BarChart3,
  HeartPulse,
  ListTodo,
  PanelsTopLeft,
  Sparkles,
  Settings2,
  X,
  ChartNoAxesCombined,
  List,
  CircleGauge,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import api from "../services/api.js";
import "./UserWidgetsPage.css";


/* =========================================================
   EXISTING MODULE ICON MAP
========================================================= */

const iconMap = {
  overview: PanelsTopLeft,
  finance: WalletCards,
  health: HeartPulse,
  todo: ListTodo,
  "to-do": ListTodo,
  ai: BrainCircuit,
  notifications: Bell,
  analytics: BarChart3,
  insights: Sparkles,
  accounts: WalletCards,
  budgets: WalletCards,
  goals: CircleGauge,
  transactions: WalletCards,
  health_metrics: HeartPulse,
  health_summary: HeartPulse,
  medicines: HeartPulse,
  calendar: ListTodo,
};

export const FALLBACK_MODULES = [
  {
    widgetId: "overview",
    key: "overview",
    title: "Executive Overview",
    name: "Executive Overview",
    description: "System KPI status, metrics summary, and fast action indicators.",
    type: "module",
    category: "General",
    width: 2,
    height: 1,
  },
  {
    widgetId: "todo",
    key: "todo",
    title: "To-Do & Tasks",
    name: "To-Do & Tasks",
    description: "Manage daily tasks, priorities and checklist items in real time.",
    type: "module",
    category: "Productivity",
    width: 1,
    height: 1,
  },
  {
    widgetId: "medicines",
    key: "medicines",
    title: "Medication Tracker",
    name: "Medication Tracker",
    description: "Daily doses, prescription schedules, and intake adherence reminders.",
    type: "module",
    category: "Health",
    width: 1,
    height: 1,
  },
  {
    widgetId: "health",
    key: "health",
    title: "Health & Vitals",
    name: "Health & Vitals",
    description: "Daily vitals, heart rate, sleep metrics and fitness telemetry.",
    type: "module",
    category: "Health",
    width: 1,
    height: 1,
  },
  {
    widgetId: "finance",
    key: "finance",
    title: "Financial Telemetry",
    name: "Financial Telemetry",
    description: "Account balances, recent transactions, budgets and expense tracking.",
    type: "module",
    category: "Finance",
    width: 2,
    height: 1,
  },
  {
    widgetId: "ai",
    key: "ai",
    title: "AI Intelligence",
    name: "AI Intelligence",
    description: "AI analytics, model requests, prompt tokens and automated recommendations.",
    type: "module",
    category: "Intelligence",
    width: 2,
    height: 1,
  },
  {
    widgetId: "notifications",
    key: "notifications",
    title: "Alerts & Notifications",
    name: "Alerts & Notifications",
    description: "Real-time alerts, critical health updates and platform notices.",
    type: "module",
    category: "Communication",
    width: 1,
    height: 1,
  },
  {
    widgetId: "analytics",
    key: "analytics",
    title: "System Analytics",
    name: "System Analytics",
    description: "Deep usage patterns, response latencies and system telemetry.",
    type: "module",
    category: "System",
    width: 2,
    height: 1,
  },
  {
    widgetId: "calendar",
    key: "calendar",
    title: "Schedule & Calendar",
    name: "Schedule & Calendar",
    description: "Upcoming events, deadlines and schedule timetable.",
    type: "module",
    category: "Productivity",
    width: 1,
    height: 1,
  },
];

/* =========================================================
   CUSTOM WIDGET TYPES
========================================================= */

const CUSTOM_TYPES = [
  "summary",
  "stat",
  "list",
  "chart",
  "progress",
];

/* =========================================================
   CUSTOM WIDGET ICON
========================================================= */

function getCustomIcon(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "stat":
      return ChartNoAxesCombined;

    case "list":
      return List;

    case "chart":
      return BarChart3;

    case "progress":
      return CircleGauge;

    case "summary":
      return PanelsTopLeft;

    default:
      return PanelsTopLeft;
  }
}

/* =========================================================
   CUSTOM TYPE LABEL
========================================================= */

function getCustomTypeLabel(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "stat":
      return "Statistic";

    case "list":
      return "List";

    case "chart":
      return "Chart";

    case "progress":
      return "Progress";

    case "summary":
      return "Summary";

    default:
      return "Custom";
  }
}

/* =========================================================
   NORMALIZE CUSTOM TYPE
========================================================= */

function normalizeCustomType(widget) {
  if (!widget) {
    return "summary";
  }

  /*
   * Check all possible fields.
   *
   * customType is the primary field.
   * The other fields support older records/backends.
   */

  const possibleTypes = [
    widget.customType,
    widget.widgetType,
    widget.variant,
    widget.layoutType,
    widget.config?.customType,
    widget.config?.type,
    widget.settings?.customType,
    widget.settings?.type,
  ];

  for (const value of possibleTypes) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();

    if (CUSTOM_TYPES.includes(normalized)) {
      return normalized;
    }
  }

  /*
   * Backward compatibility:
   *
   * Older custom widgets may have been stored as:
   *
   * type: "chart"
   * type: "stat"
   * etc.
   */

  const oldType = String(
    widget.type || "",
  )
    .trim()
    .toLowerCase();

  if (CUSTOM_TYPES.includes(oldType)) {
    return oldType;
  }

  return "summary";
}

/* =========================================================
   PAGE
========================================================= */

export default function UserWidgetsPage() {
  /* =======================================================
     STATE
  ======================================================= */

  const [widgets, setWidgets] = useState([]);

  const [selectedWidgets, setSelectedWidgets] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [creating, setCreating] = useState(false);

  const [deletingWidgetId, setDeletingWidgetId] =
    useState("");

  const [error, setError] = useState("");

  const [showCreateWidget, setShowCreateWidget] =
    useState(false);

  const [newWidget, setNewWidget] = useState({
    name: "",
    description: "",
    type: "summary",
  });

  /* =======================================================
     GET WIDGET KEY
  ======================================================= */

  function getWidgetKey(widget) {
    if (!widget) {
      return "";
    }

    if (typeof widget === "string") {
      return widget;
    }

    return (
      widget.widgetId ||
      widget.key ||
      widget.slug ||
      widget.code ||
      widget.widgetKey ||
      widget.id ||
      ""
    );
  }

  /* =======================================================
     CHECK CUSTOM WIDGET
  ======================================================= */

  function isCustomWidget(widget) {
    if (!widget || typeof widget === "string") {
      return false;
    }

    /*
     * Primary identification:
     *
     * type === "custom"
     */

    if (
      String(widget.type || "")
        .trim()
        .toLowerCase() === "custom"
    ) {
      return true;
    }

    /*
     * Backward compatibility.
     *
     * Old records may have:
     *
     * type: "chart"
     * type: "stat"
     * type: "list"
     * etc.
     */

    const oldType = String(
      widget.type || "",
    )
      .trim()
      .toLowerCase();

    return CUSTOM_TYPES.includes(oldType);
  }

  /* =======================================================
     GET CUSTOM TYPE
  ======================================================= */

  function getCustomType(widget) {
    return normalizeCustomType(widget);
  }

  /* =======================================================
     GET WIDGET NAME
  ======================================================= */

  function getWidgetName(widget) {
    if (!widget) {
      return "Widget";
    }

    if (typeof widget === "string") {
      const definition = widgets.find(
        (item) =>
          String(getWidgetKey(item)) ===
          String(widget),
      );

      return (
        definition?.title ||
        definition?.name ||
        definition?.label ||
        widget
      );
    }

    return (
      widget.title ||
      widget.name ||
      widget.label ||
      widget.key ||
      widget.widgetId ||
      "Widget"
    );
  }

  /* =======================================================
     GET WIDGET DESCRIPTION
  ======================================================= */

  function getWidgetDescription(widget) {
    if (!widget) {
      return "Dashboard widget.";
    }

    if (typeof widget === "string") {
      const definition = widgets.find(
        (item) =>
          String(getWidgetKey(item)) ===
          String(widget),
      );

      return (
        definition?.description ||
        definition?.subtitle ||
        "Dashboard module."
      );
    }

    return (
      widget.description ||
      widget.subtitle ||
      "Dashboard module."
    );
  }

  /* =======================================================
     GET NORMAL MODULE ICON
  ======================================================= */

  function getIcon(widget) {
    const key = String(
      getWidgetKey(widget),
    ).toLowerCase();

    return iconMap[key] || LayoutGrid;
  }

  /* =======================================================
     LOAD ALL WIDGET DATA
  ======================================================= */

  async function loadWidgets() {
    try {
      setLoading(true);
      setError("");

      const [
        definitionsResponse,
        layoutResponse,
      ] = await Promise.all([
        api.get("/widgets"),
        api.get("/widgets/layout"),
      ]);

      /* ---------------------------------------------------
         AVAILABLE MODULES
      --------------------------------------------------- */

      const definitionData =
        definitionsResponse?.data?.data ||
        definitionsResponse?.data?.widgets ||
        definitionsResponse?.data ||
        [];

      const availableWidgets = Array.isArray(definitionData) && definitionData.length
        ? definitionData
        : FALLBACK_MODULES;

      /*
       * Custom widgets must NOT appear
       * in existing modules.
       */

      const existingModules =
        availableWidgets.filter(
          (widget) =>
            !isCustomWidget(widget),
        );

      setWidgets(existingModules.length ? existingModules : FALLBACK_MODULES);

      /* ---------------------------------------------------
         USER LAYOUT
      --------------------------------------------------- */

      const layoutData =
        layoutResponse?.data?.data ||
        layoutResponse?.data?.layout ||
        layoutResponse?.data ||
        {};

      let savedWidgets = Array.isArray(layoutData?.widgets) && layoutData.widgets.length
        ? layoutData.widgets
        : FALLBACK_MODULES.slice(0, 4);

      /*
       * Normalize everything immediately.
       *
       * This is important because customType
       * must survive loading from MongoDB.
       */

      const normalized = savedWidgets
        .filter(
          (widget) =>
            widget &&
            widget.enabled !== false,
        )
        .map((widget, index) => {
          if (isCustomWidget(widget)) {
            return normalizeCustomWidget(
              widget,
              index,
            );
          }

          return normalizeModuleWidget(
            widget,
          );
        });

      setSelectedWidgets(normalized.length ? normalized : FALLBACK_MODULES.slice(0, 4));
    } catch (err) {
      console.warn(
        "Widget network request notice, activating local fallback catalog:",
        err?.message || err,
      );

      // Gracefully show default widgets so the page is never blank
      setWidgets(FALLBACK_MODULES);
      setSelectedWidgets(FALLBACK_MODULES.slice(0, 4));
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadWidgets();
  }, []);

  /* =======================================================
     NORMALIZE EXISTING MODULE
  ======================================================= */

  function normalizeModuleWidget(widget) {
    const key = getWidgetKey(widget);

    const definition = widgets.find(
      (item) =>
        String(getWidgetKey(item)) ===
        String(key),
    );

    return {
      widgetId: key,

      title:
        widget?.title ||
        widget?.name ||
        definition?.title ||
        definition?.name ||
        key,

      description:
        widget?.description ||
        definition?.description ||
        "Dashboard module.",

      type: "module",

      x: Number.isFinite(
        Number(widget?.x),
      )
        ? Number(widget.x)
        : 0,

      y: Number.isFinite(
        Number(widget?.y),
      )
        ? Number(widget.y)
        : selectedWidgets.length,

      width:
        Number(widget?.width) ||
        definition?.minWidth ||
        1,

      height:
        Number(widget?.height) ||
        definition?.minHeight ||
        1,

      enabled:
        widget?.enabled !== false,
    };
  }

  /* =======================================================
     NORMALIZE CUSTOM WIDGET
  ======================================================= */

  function normalizeCustomWidget(
    widget,
    index = 0,
  ) {
    const customType =
      normalizeCustomType(widget);

    return {
      widgetId:
        widget?.widgetId ||
        widget?.id ||
        `custom-${Date.now()}-${index}`,

      title:
        widget?.title ||
        widget?.name ||
        "Custom Widget",

      description:
        widget?.description ||
        "Custom dashboard widget.",

      /*
       * IMPORTANT:
       *
       * type = custom
       * customType = actual widget design
       */

      type: "custom",

      customType,

      /*
       * Preserve these too.
       *
       * This makes the layout payload explicit.
       */

      widgetType: customType,

      variant: customType,

      x: Number.isFinite(
        Number(widget?.x),
      )
        ? Number(widget.x)
        : 0,

      y: Number.isFinite(
        Number(widget?.y),
      )
        ? Number(widget.y)
        : index,

      width:
        Number(widget?.width) || 1,

      height:
        Number(widget?.height) || 1,

      enabled:
        widget?.enabled !== false,
    };
  }

  /* =======================================================
     IS SELECTED
  ======================================================= */

  function isSelected(widget) {
    const key = getWidgetKey(widget);

    return selectedWidgets.some(
      (item) =>
        String(
          getWidgetKey(item),
        ) === String(key),
    );
  }

  /* =======================================================
     ADD EXISTING MODULE
  ======================================================= */

  function addWidget(widget) {
    const key = getWidgetKey(widget);

    if (!key) {
      return;
    }

    if (isSelected(widget)) {
      return;
    }

    const normalized =
      normalizeModuleWidget(widget);

    setSelectedWidgets(
      (previous) => [
        ...previous,
        normalized,
      ],
    );
  }

  /* =======================================================
     MOVE WIDGET (REORDER)
  ======================================================= */

  function moveWidget(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedWidgets.length) {
      return;
    }

    setSelectedWidgets((previous) => {
      const updated = [...previous];
      const item = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = item;
      return updated.map((w, i) => ({ ...w, y: i }));
    });
  }

  /* =======================================================
     REMOVE WIDGET
  ======================================================= */

  function removeWidget(widget) {
    const key = getWidgetKey(widget);

    setSelectedWidgets(
      (previous) =>
        previous.filter(
          (item) =>
            String(
              getWidgetKey(item),
            ) !== String(key),
        ),
    );
  }

  /* =======================================================
     CUSTOM WIDGETS
  ======================================================= */

  const customWidgets = useMemo(() => {
    return selectedWidgets.filter(
      (widget) =>
        isCustomWidget(widget),
    );
  }, [selectedWidgets]);

  /* =======================================================
     EXISTING MODULES
  ======================================================= */

  const selectedModuleWidgets =
    useMemo(() => {
      return selectedWidgets.filter(
        (widget) =>
          !isCustomWidget(widget),
      );
    }, [selectedWidgets]);

  void selectedModuleWidgets;

  /* =======================================================
     RESET CREATE FORM
  ======================================================= */

  function resetCreateForm() {
    setNewWidget({
      name: "",
      description: "",
      type: "summary",
    });
  }

  /* =======================================================
     OPEN CREATE MODAL
  ======================================================= */

  function openCreateWidgetModal() {
    resetCreateForm();
    setShowCreateWidget(true);
  }

  /* =======================================================
     CLOSE CREATE MODAL
  ======================================================= */

  function closeCreateWidgetModal() {
    if (creating) {
      return;
    }

    setShowCreateWidget(false);
    resetCreateForm();
  }

  /* =======================================================
     CREATE CUSTOM WIDGET
  ======================================================= */

  async function handleCreateWidget() {
    const title =
      newWidget.name.trim();

    const description =
      newWidget.description.trim();

    const customType =
      String(newWidget.type)
        .trim()
        .toLowerCase();

    if (!title) {
      setError(
        "Widget name is required.",
      );

      return;
    }

    if (
      !CUSTOM_TYPES.includes(
        customType,
      )
    ) {
      setError(
        "Invalid widget type.",
      );

      return;
    }

    try {
      setCreating(true);
      setError("");

      /*
       * IMPORTANT PAYLOAD
       *
       * type:
       *   identifies this as custom
       *
       * customType:
       *   identifies the actual design
       *
       * widgetType / variant:
       *   additional persistence compatibility
       */

      const payload = {
        title,

        name: title,

        description,

        type: "custom",

        customType,

        widgetType: customType,

        variant: customType,

        width: 1,

        height: 1,

        enabled: true,
      };

      console.log(
        "Creating custom widget:",
        payload,
      );

      const response =
        await api.post(
          "/widgets/custom",
          payload,
        );

      /*
       * Backend may return:
       *
       * response.data.widget
       *
       * OR
       *
       * response.data.data
       */

      const createdWidget =
        response?.data?.widget ||
        response?.data?.data ||
        null;

      if (createdWidget) {
        const normalized =
          normalizeCustomWidget({
            ...createdWidget,

            type: "custom",

            customType:
              createdWidget.customType ||
              createdWidget.widgetType ||
              createdWidget.variant ||
              customType,

            widgetType:
              createdWidget.widgetType ||
              customType,

            variant:
              createdWidget.variant ||
              customType,
          });

        setSelectedWidgets(
          (previous) => [
            ...previous,
            normalized,
          ],
        );
      }

      setShowCreateWidget(false);
      resetCreateForm();

      /*
       * Reload from backend.
       */

      await loadWidgets();
    } catch (err) {
      console.error(
        "Create custom widget error:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          "Unable to create custom widget.",
      );
    } finally {
      setCreating(false);
    }
  }

  /* =======================================================
     DELETE CUSTOM WIDGET
  ======================================================= */

  async function deleteCustomWidget(
    widget,
  ) {
    const widgetId =
      widget?.widgetId ||
      widget?.id;

    if (!widgetId) {
      return;
    }

    try {
      setDeletingWidgetId(
        String(widgetId),
      );

      setError("");

      await api.delete(
        `/widgets/custom/${encodeURIComponent(
          widgetId,
        )}`,
      );

      await loadWidgets();
    } catch (err) {
      console.error(
        "Delete custom widget error:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          "Unable to delete custom widget.",
      );
    } finally {
      setDeletingWidgetId("");
    }
  }

  /* =======================================================
     SAVE LAYOUT
  ======================================================= */

  async function saveLayout() {
    try {
      setSaving(true);
      setError("");

      const normalizedWidgets =
        selectedWidgets.map(
          (widget, index) => {
            if (
              isCustomWidget(widget)
            ) {
              return normalizeCustomWidget(
                widget,
                index,
              );
            }

            return normalizeModuleWidget(
              widget,
            );
          },
        );

      /*
       * IMPORTANT:
       *
       * Send customType explicitly.
       */

      const response =
        await api.put(
          "/widgets/layout",
          {
            widgets:
              normalizedWidgets,
          },
        );

      const savedLayout =
        response?.data?.widgets ||
        response?.data?.data?.widgets;

      if (
        Array.isArray(
          savedLayout,
        )
      ) {
        setSelectedWidgets(
          savedLayout.map(
            (widget, index) =>
              isCustomWidget(
                widget,
              )
                ? normalizeCustomWidget(
                    widget,
                    index,
                  )
                : normalizeModuleWidget(
                    widget,
                  ),
          ),
        );
      } else {
        setSelectedWidgets(
          normalizedWidgets,
        );
      }
    } catch (err) {
      console.error(
        "Failed to save widget layout:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          "Unable to save widget layout.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     RESET LAYOUT
  ======================================================= */

  async function resetLayout() {
    try {
      setSaving(true);
      setError("");

      const response =
        await api.get(
          "/widgets/layout",
        );

      const layoutData =
        response?.data?.data ||
        response?.data?.layout ||
        response?.data ||
        {};

      const savedWidgets =
        Array.isArray(
          layoutData?.widgets,
        )
          ? layoutData.widgets
          : [];

      setSelectedWidgets(
        savedWidgets
          .filter(
            (widget) =>
              widget?.enabled !== false,
          )
          .map(
            (widget, index) =>
              isCustomWidget(
                widget,
              )
                ? normalizeCustomWidget(
                    widget,
                    index,
                  )
                : normalizeModuleWidget(
                    widget,
                  ),
          ),
      );
    } catch (err) {
      console.error(
        "Failed to reset layout:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          "Unable to reset layout.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="widgets-page">
        <div className="widgets-loading">
          <RefreshCw
            size={22}
            className="widgets-spin"
          />

          <span>
            Loading widgets...
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="widgets-page">

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="widgets-hero">

        <div className="widgets-hero-grid" />

        <div className="widgets-hero-content">

          <div className="widgets-eyebrow">
            <LayoutGrid size={14} />

            <span>
              WIDGET CENTER
            </span>
          </div>

          <h1>
            Widgets
          </h1>

          <p>
            Customize your personal
            dashboard with the
            information you use most.
          </p>

        </div>

        <div className="widgets-hero-actions">

          <button
            type="button"
            className="widgets-btn widgets-btn-secondary"
            onClick={loadWidgets}
            disabled={
              saving ||
              creating
            }
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            className="widgets-btn widgets-btn-primary"
            onClick={
              openCreateWidgetModal
            }
            disabled={
              saving ||
              creating
            }
          >
            <Plus size={17} />
            Create Widget
          </button>

        </div>

      </section>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="widgets-error">
          {error}
        </div>
      )}

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <section className="widgets-summary">

        <div className="widget-summary-card">

          <div className="widget-summary-icon">
            <LayoutGrid size={19} />
          </div>

          <div>
            <span>
              Selected Widgets
            </span>

            <strong>
              {selectedWidgets.length}
            </strong>

            <small>
              On your dashboard
            </small>
          </div>

        </div>

        <div className="widget-summary-card">

          <div className="widget-summary-icon">
            <PanelsTopLeft size={19} />
          </div>

          <div>
            <span>
              Available Widgets
            </span>

            <strong>
              {widgets.length}
            </strong>

            <small>
              Existing modules
            </small>
          </div>

        </div>

        <div className="widget-summary-card">

          <div className="widget-summary-icon">
            <Plus size={19} />
          </div>

          <div>
            <span>
              Custom Widgets
            </span>

            <strong>
              {customWidgets.length}
            </strong>

            <small>
              Created by you
            </small>
          </div>

        </div>

        <div className="widget-summary-card">

          <div className="widget-summary-icon">
            <Settings2 size={19} />
          </div>

          <div>
            <span>
              Dashboard
            </span>

            <strong>
              Active
            </strong>

            <small>
              Personal layout
            </small>
          </div>

        </div>

      </section>

      {/* ===================================================
          DASHBOARD CUSTOMIZATION
      =================================================== */}

      <section className="widgets-section">

        <div className="widgets-section-header">

          <div>

            <span className="widgets-section-label">
              DASHBOARD
            </span>

            <h2>
              Dashboard Customization
            </h2>

            <p>
              Manage the modules currently
              displayed on your personal
              dashboard.
            </p>

          </div>

          <div className="widgets-count-badge">
            {selectedWidgets.length} selected
          </div>

        </div>

        <div className="selected-widget-grid">

          {selectedWidgets.length === 0 ? (

            <div className="widgets-empty">

              <LayoutGrid size={28} />

              <h3>
                No widgets selected
              </h3>

              <p>
                Add existing modules from
                the section below or create
                your own widget.
              </p>

            </div>

          ) : (

            selectedWidgets.map(
              (widget, index) => {

                const key =
                  getWidgetKey(widget);

                const custom =
                  isCustomWidget(widget);

                const customType =
                  custom
                    ? getCustomType(
                        widget,
                      )
                    : "";

                const Icon = custom
                  ? getCustomIcon(
                      customType,
                    )
                  : getIcon(
                      widget,
                    );

                return (
                  <article
                    className="selected-widget-card"
                    key={`${key}-${index}`}
                  >

                    <div className="widget-number">
                      {index + 1}
                    </div>

                    <div className="selected-widget-icon">
                      <Icon size={19} />
                    </div>

                    <div className="selected-widget-info">

                      <h3>
                        {getWidgetName(
                          widget,
                        )}
                      </h3>

                      <p>
                        {getWidgetDescription(
                          widget,
                        )}
                      </p>

                      <span>
                        {custom
                          ? `Custom • ${getCustomTypeLabel(
                              customType,
                            )}`
                          : "Dashboard module"}
                      </span>

                    </div>

                    <div className="widget-actions-group">
                      <button
                        type="button"
                        className="widget-move-btn"
                        title="Move Up"
                        aria-label="Move Up"
                        onClick={() => moveWidget(index, -1)}
                        disabled={index === 0 || saving}
                      >
                        <ChevronUp size={15} />
                      </button>

                      <button
                        type="button"
                        className="widget-move-btn"
                        title="Move Down"
                        aria-label="Move Down"
                        onClick={() => moveWidget(index, 1)}
                        disabled={index === selectedWidgets.length - 1 || saving}
                      >
                        <ChevronDown size={15} />
                      </button>

                      <button
                        type="button"
                        className="widget-remove-btn"
                        onClick={() =>
                          removeWidget(
                            widget,
                          )
                        }
                        disabled={
                          saving
                        }
                        title="Remove from dashboard"
                        aria-label="Remove from dashboard"
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>

                  </article>
                );
              },
            )
          )}

        </div>

        <div className="widgets-section-actions">

          <button
            type="button"
            className="widgets-btn widgets-btn-outline"
            onClick={resetLayout}
            disabled={saving}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="button"
            className="widgets-btn widgets-btn-primary"
            onClick={saveLayout}
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </section>

      {/* ===================================================
          EXISTING MODULES
      =================================================== */}

      <section className="widgets-section">

        <div className="widgets-section-header">

          <div>

            <span className="widgets-section-label">
              EXISTING MODULES
            </span>

            <h2>
              Available Widgets
            </h2>

            <p>
              Add existing MONE AI modules
              to your dashboard.
            </p>

          </div>

          <div className="widgets-count-badge">
            {widgets.length} widgets
          </div>

        </div>

        <div className="available-widget-grid">

          {widgets.map(
            (widget) => {

              const key =
                getWidgetKey(
                  widget,
                );

              const Icon =
                getIcon(
                  widget,
                );

              const selected =
                isSelected(
                  widget,
                );

              return (
                <article
                  className={`available-widget-card ${
                    selected
                      ? "is-selected"
                      : ""
                  }`}
                  key={key}
                >

                  <div className="available-widget-top">

                    <div className="available-widget-icon">
                      <Icon size={20} />
                    </div>

                    {selected && (
                      <span className="widget-added-badge">
                        ✓ Added
                      </span>
                    )}

                  </div>

                  <h3>
                    {getWidgetName(
                      widget,
                    )}
                  </h3>

                  <p>
                    {getWidgetDescription(
                      widget,
                    )}
                  </p>

                  <div className="available-widget-footer">

                    <span>
                      {selected
                        ? "On dashboard"
                        : "Available"}
                    </span>

                    {selected ? (

                      <button
                        type="button"
                        className="widget-small-btn widget-small-remove"
                        onClick={() =>
                          removeWidget(
                            widget,
                          )
                        }
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>

                    ) : (

                      <button
                        type="button"
                        className="widget-small-btn widget-small-add"
                        onClick={() =>
                          addWidget(
                            widget,
                          )
                        }
                      >
                        <Plus size={14} />
                        Add Widget
                      </button>

                    )}

                  </div>

                </article>
              );
            },
          )}

        </div>

      </section>

      {/* ===================================================
          MY CUSTOM WIDGETS
      =================================================== */}

      {customWidgets.length > 0 && (

        <section className="widgets-section">

          <div className="widgets-section-header">

            <div>

              <span className="widgets-section-label">
                CUSTOM
              </span>

              <h2>
                My Custom Widgets
              </h2>

              <p>
                Only widgets created by you
                are shown here.
              </p>

            </div>

            <div className="widgets-count-badge">
              {customWidgets.length} custom
            </div>

          </div>

          <div className="available-widget-grid">

            {customWidgets.map(
              (widget) => {

                const customType =
                  getCustomType(
                    widget,
                  );

                const Icon =
                  getCustomIcon(
                    customType,
                  );

                return (
                  <article
                    className="available-widget-card custom-widget-card"
                    key={
                      widget.widgetId
                    }
                  >

                    <div className="available-widget-top">

                      <div className="available-widget-icon">
                        <Icon size={20} />
                      </div>

                      <span className="widget-added-badge">
                        {getCustomTypeLabel(
                          customType,
                        )}
                      </span>

                    </div>

                    <h3>
                      {widget.title ||
                        widget.name ||
                        "Custom Widget"}
                    </h3>

                    <p>
                      {widget.description ||
                        "Custom dashboard widget."}
                    </p>

                    <div className="available-widget-footer">

                      <span>
                        Custom Widget
                      </span>

                      <button
                        type="button"
                        className="widget-small-btn widget-small-remove"
                        onClick={() =>
                          deleteCustomWidget(
                            widget,
                          )
                        }
                        disabled={
                          deletingWidgetId ===
                          String(
                            widget.widgetId,
                          )
                        }
                      >

                        <Trash2 size={14} />

                        {deletingWidgetId ===
                        String(
                          widget.widgetId,
                        )
                          ? "Deleting..."
                          : "Delete"}

                      </button>

                    </div>

                  </article>
                );
              },
            )}

          </div>

        </section>

      )}

      {/* ===================================================
          CREATE WIDGET MODAL
      =================================================== */}

      {showCreateWidget && (

        <div
          className="widget-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreateWidgetModal();
            }

          }}
        >

          <div
            className="widget-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="widget-modal-header">

              <div>

                <span className="widget-modal-label">
                  CREATE WIDGET
                </span>

                <h2>
                  Create New Widget
                </h2>

                <p>
                  Create a custom widget
                  for your dashboard.
                </p>

              </div>

              <button
                type="button"
                className="widget-modal-close"
                onClick={
                  closeCreateWidgetModal
                }
                disabled={
                  creating
                }
              >
                <X size={19} />
              </button>

            </div>

            {/* FORM */}

            <div className="widget-form">

              {/* NAME */}

              <div className="widget-form-group">

                <label>
                  Widget Name
                </label>

                <input
                  type="text"
                  value={
                    newWidget.name
                  }
                  placeholder="Example: Monthly Savings"
                  onChange={(event) =>
                    setNewWidget(
                      (previous) => ({
                        ...previous,
                        name:
                          event.target
                            .value,
                      }),
                    )
                  }
                  autoFocus
                />

              </div>

              {/* DESCRIPTION */}

              <div className="widget-form-group">

                <label>
                  Description
                </label>

                <textarea
                  rows="4"
                  value={
                    newWidget.description
                  }
                  placeholder="Describe what this widget is for..."
                  onChange={(event) =>
                    setNewWidget(
                      (previous) => ({
                        ...previous,
                        description:
                          event.target
                            .value,
                      }),
                    )
                  }
                />

              </div>

              {/* TYPE */}

              <div className="widget-form-group">

                <label>
                  Widget Type
                </label>

                <select
                  value={
                    newWidget.type
                  }
                  onChange={(event) =>
                    setNewWidget(
                      (previous) => ({
                        ...previous,
                        type:
                          event.target
                            .value,
                      }),
                    )
                  }
                >

                  <option value="summary">
                    Summary
                  </option>

                  <option value="stat">
                    Statistic
                  </option>

                  <option value="list">
                    List
                  </option>

                  <option value="chart">
                    Chart
                  </option>

                  <option value="progress">
                    Progress
                  </option>

                </select>

              </div>

              {/* PREVIEW */}

              <div className="widget-form-preview">

                <div className="preview-icon">

                  {(() => {

                    const PreviewIcon =
                      getCustomIcon(
                        newWidget.type,
                      );

                    return (
                      <PreviewIcon
                        size={22}
                      />
                    );

                  })()}

                </div>

                <div>

                  <strong>
                    {newWidget.name ||
                      "Your Widget"}
                  </strong>

                  <p>
                    {newWidget.description ||
                      "Your custom widget preview"}
                  </p>

                  <small>
                    {getCustomTypeLabel(
                      newWidget.type,
                    )}
                  </small>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="widget-modal-actions">

                <button
                  type="button"
                  className="widget-secondary-btn"
                  onClick={
                    closeCreateWidgetModal
                  }
                  disabled={
                    creating
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="widget-primary-submit"
                  disabled={
                    creating ||
                    !newWidget.name.trim()
                  }
                  onClick={
                    handleCreateWidget
                  }
                >

                  {creating ? (
                    <RefreshCw
                      size={17}
                      className="widgets-spin"
                    />
                  ) : (
                    <Plus size={17} />
                  )}

                  {creating
                    ? "Creating..."
                    : "Create Widget"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}