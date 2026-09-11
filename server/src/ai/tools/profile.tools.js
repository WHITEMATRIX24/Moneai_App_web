import User from "../../models/User.js";
import Subscription from "../../models/Subscription.js";

/**
 * Doc Section 9 (5-member doc) / Section 18 (4-member doc) — Profile
 * domain. Both docs mark this "Restricted / explicit operations only" /
 * read-only, so there are no write tools here, unlike finance.tools.js
 * and todo.tools.js.
 *
 * get_user_profile and get_subscription read modules that already exist
 * (User, Subscription models). get_notification_preferences does not —
 * there is no notification-preferences data anywhere in the schema yet
 * (Notification.js has delivery/read tracking, not per-user channel
 * settings). Per the request to prewire the AI layer ahead of that
 * module landing: the declaration and handler exist now with the exact
 * shape the doc implies, backed by a documented default until a real
 * settings module ships. Swapping the stub for a real query is a
 * one-function change — the declaration and everything that calls this
 * tool never need to change.
 */

export const getUserProfileDeclaration = {
  name: "get_user_profile",
  description:
    "Get the authenticated user's basic profile information (name, email, phone, timezone).",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

export const getSubscriptionDeclaration = {
  name: "get_subscription",
  description:
    "Get the authenticated user's current subscription plan and status.",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

export const getNotificationPreferencesDeclaration = {
  name: "get_notification_preferences",
  description:
    "Get the authenticated user's notification preferences (which alert types are enabled).",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * @param {string} userId
 */
export async function executeGetUserProfile(userId) {
  const user = await User.findById(userId).select("name email phone timezone -_id").lean();
  if (!user) return null;
  return {
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    timezone: user.timezone,
  };
}

/**
 * @param {string} userId
 */
export async function executeGetSubscription(userId) {
  const sub = await Subscription.findOne({ userId }).select("plan status expiresAt -_id").lean();
  if (!sub) {
    // Doc Section 23 — never fabricate. A user with no Subscription row
    // is on the implicit FREE tier (see User.subscriptionPlan default);
    // say so plainly rather than inventing a subscription record.
    return { plan: "FREE", status: "ACTIVE", expiresAt: null };
  }
  return { plan: sub.plan, status: sub.status, expiresAt: sub.expiresAt || null };
}

/**
 * STUB — no notification-preferences module exists yet (see file header).
 * Returns a fixed default rather than querying anything, and flags
 * itself as such in the response so the model doesn't present this as
 * the user's actual saved choice. Replace the body with a real query
 * once a preferences field/model exists; the declaration above and the
 * registry entry in aiApplicationTools.service.js do not need to change.
 * @param {string} userId
 */
export async function executeGetNotificationPreferences(userId) {
  return {
    source: "default", // becomes "user" once real preferences exist
    email: true,
    push: true,
    budgetAlerts: true,
    goalReminders: true,
    note: "No saved preferences yet — showing default settings.",
  };
}
