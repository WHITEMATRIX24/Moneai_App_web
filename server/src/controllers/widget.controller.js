import WidgetLayout from "../models/WidgetLayout.js";

// System catalog of available modules that can be added to the dashboard
export const AVAILABLE_WIDGET_CATALOG = [
  {
    widgetId: "overview",
    key: "overview",
    title: "Executive Overview",
    name: "Executive Overview",
    description: "System KPI status, metrics summary, and fast action indicators.",
    type: "module",
    category: "General",
    defaultWidth: 2,
    defaultHeight: 1,
    x: 0,
    y: 0,
  },
  {
    widgetId: "todo",
    key: "todo",
    title: "To-Do & Tasks",
    name: "To-Do & Tasks",
    description: "Manage daily tasks, priorities and checklist items in real time.",
    type: "module",
    category: "Productivity",
    defaultWidth: 1,
    defaultHeight: 1,
    x: 2,
    y: 0,
  },
  {
    widgetId: "medicines",
    key: "medicines",
    title: "Medication Tracker",
    name: "Medication Tracker",
    description: "Daily doses, prescription schedules, and intake adherence reminders.",
    type: "module",
    category: "Health",
    defaultWidth: 1,
    defaultHeight: 1,
    x: 0,
    y: 1,
  },
  {
    widgetId: "health",
    key: "health",
    title: "Health & Vitals",
    name: "Health & Vitals",
    description: "Daily vitals, heart rate, sleep metrics and fitness telemetry.",
    type: "module",
    category: "Health",
    defaultWidth: 1,
    defaultHeight: 1,
    x: 1,
    y: 1,
  },
  {
    widgetId: "finance",
    key: "finance",
    title: "Financial Telemetry",
    name: "Financial Telemetry",
    description: "Account balances, recent transactions, budgets and expense tracking.",
    type: "module",
    category: "Finance",
    defaultWidth: 2,
    defaultHeight: 1,
    x: 0,
    y: 2,
  },
  {
    widgetId: "ai",
    key: "ai",
    title: "AI Intelligence",
    name: "AI Intelligence",
    description: "AI analytics, model requests, prompt tokens and automated recommendations.",
    type: "module",
    category: "Intelligence",
    defaultWidth: 2,
    defaultHeight: 1,
    x: 0,
    y: 3,
  },
  {
    widgetId: "notifications",
    key: "notifications",
    title: "Alerts & Notifications",
    name: "Alerts & Notifications",
    description: "Real-time alerts, critical health updates and platform notices.",
    type: "module",
    category: "Communication",
    defaultWidth: 1,
    defaultHeight: 1,
    x: 2,
    y: 1,
  },
  {
    widgetId: "analytics",
    key: "analytics",
    title: "System Analytics",
    name: "System Analytics",
    description: "Deep usage patterns, response latencies and system telemetry.",
    type: "module",
    category: "System",
    defaultWidth: 2,
    defaultHeight: 1,
    x: 0,
    y: 4,
  },
  {
    widgetId: "calendar",
    key: "calendar",
    title: "Schedule & Calendar",
    name: "Schedule & Calendar",
    description: "Upcoming events, deadlines and schedule timetable.",
    type: "module",
    category: "Productivity",
    defaultWidth: 1,
    defaultHeight: 1,
    x: 2,
    y: 2,
  },
];

export const DEFAULT_ACTIVE_LAYOUT = [
  {
    widgetId: "overview",
    key: "overview",
    title: "Financial Overview",
    description: "Account balance, income vs. expenses overview.",
    type: "module",
    x: 0,
    y: 0,
    width: 2,
    height: 1,
    enabled: true,
  },
  {
    widgetId: "health",
    key: "health",
    title: "Wellness & Daily Progress",
    description: "Daily step progress, activity goals, and wellness status.",
    type: "module",
    x: 1,
    y: 0,
    width: 1,
    height: 1,
    enabled: true,
  },
  {
    widgetId: "finance",
    key: "finance",
    title: "Recent Transactions",
    description: "Latest income and expense transactions across your account.",
    type: "module",
    x: 0,
    y: 1,
    width: 2,
    height: 1,
    enabled: true,
  },
  {
    widgetId: "ai",
    key: "ai",
    title: "Recent AI Activity",
    description: "Latest AI assistant chats, conversations, and token metrics.",
    type: "module",
    x: 1,
    y: 1,
    width: 2,
    height: 1,
    enabled: true,
  },
  {
    widgetId: "todo",
    key: "todo",
    title: "To-Do & Tasks",
    description: "Manage daily tasks, priorities and checklist items in real time.",
    type: "module",
    x: 0,
    y: 2,
    width: 1,
    height: 1,
    enabled: true,
  },
  {
    widgetId: "medicines",
    key: "medicines",
    title: "Medication Tracker",
    description: "Daily doses, prescription schedules, and intake adherence reminders.",
    type: "module",
    x: 1,
    y: 2,
    width: 1,
    height: 1,
    enabled: true,
  },
];

/**
 * GET /api/v1/widgets
 * Return list of all available widgets / modules
 */
export async function listAvailableWidgets(req, res) {
  try {
    return res.json({
      success: true,
      widgets: AVAILABLE_WIDGET_CATALOG,
      data: AVAILABLE_WIDGET_CATALOG,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to list available widgets", error: error.message });
  }
}

/**
 * GET /api/v1/widgets/layout
 * Return user's layout or default active layout if uncustomized
 */
export async function getWidgetLayout(req, res) {
  try {
    const userId = req.auth?.user?._id;
    let layout = null;
    if (userId) {
      layout = await WidgetLayout.findOne({ userId });
    }

    if (!layout || !Array.isArray(layout.widgets) || layout.widgets.length === 0) {
      return res.json({
        userId,
        widgets: DEFAULT_ACTIVE_LAYOUT,
        data: { widgets: DEFAULT_ACTIVE_LAYOUT },
      });
    }

    return res.json({
      userId: layout.userId,
      widgets: layout.widgets,
      data: layout,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get widget layout", error: error.message });
  }
}

/**
 * PUT /api/v1/widgets/layout
 * Save user's widget layout
 */
export async function saveWidgetLayout(req, res) {
  try {
    const userId = req.auth?.user?._id;
    const widgets = req.body?.widgets || [];

    const updated = await WidgetLayout.findOneAndUpdate(
      { userId },
      { widgets },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      widgets: updated.widgets,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save widget layout", error: error.message });
  }
}

/**
 * POST /api/v1/widgets/custom
 * Create a new custom widget and append to user's layout
 */
export async function createCustomWidget(req, res) {
  try {
    const userId = req.auth?.user?._id;
    const body = req.body || {};

    const customWidget = {
      widgetId: body.widgetId || `custom_${Date.now()}`,
      title: body.title || "Custom Widget",
      description: body.description || "",
      type: "custom",
      customType: body.customType || body.widgetType || "summary",
      widgetType: body.widgetType || body.customType || "summary",
      variant: body.variant || body.customType || "summary",
      x: Number.isFinite(Number(body.x)) ? Number(body.x) : 0,
      y: Number.isFinite(Number(body.y)) ? Number(body.y) : 0,
      width: Number.isFinite(Number(body.width)) ? Number(body.width) : 1,
      height: Number.isFinite(Number(body.height)) ? Number(body.height) : 1,
      enabled: true,
      config: body.config || body.settings || {},
      settings: body.settings || body.config || {},
    };

    let layout = await WidgetLayout.findOne({ userId });
    if (!layout) {
      layout = await WidgetLayout.create({
        userId,
        widgets: [...DEFAULT_ACTIVE_LAYOUT, customWidget],
      });
    } else {
      layout.widgets.push(customWidget);
      await layout.save();
    }

    return res.status(201).json({
      success: true,
      widget: customWidget,
      data: customWidget,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create custom widget", error: error.message });
  }
}

/**
 * DELETE /api/v1/widgets/custom/:id
 * Delete a custom widget from user's layout
 */
export async function deleteCustomWidget(req, res) {
  try {
    const userId = req.auth?.user?._id;
    const widgetId = req.params.id;

    const layout = await WidgetLayout.findOne({ userId });
    if (layout) {
      layout.widgets = layout.widgets.filter((w) => String(w.widgetId) !== String(widgetId));
      await layout.save();
    }

    return res.json({
      success: true,
      message: "Custom widget removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete custom widget", error: error.message });
  }
}
