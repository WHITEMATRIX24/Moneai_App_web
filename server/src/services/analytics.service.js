import AnalyticsEvent from "../models/AnalyticsEvent.js";

/* -------------------------------------------------------------------------- */
/* RECORD ANALYTICS EVENT                                                     */
/* -------------------------------------------------------------------------- */

export async function recordAnalyticsEvent({
  eventName,
  userId = null,
  sessionId = "",
  module = "",
  feature = "",
  platform = "",
  appVersion = "",
  metadata = {},
  timestamp = null,
}) {
  if (!eventName) {
    const error = new Error(
      "eventName is required"
    );

    error.statusCode = 400;

    throw error;
  }

  const event = await AnalyticsEvent.create({
    eventName: eventName.trim(),

    userId,

    sessionId:
      typeof sessionId === "string"
        ? sessionId.trim()
        : "",

    module:
      typeof module === "string"
        ? module.trim().toLowerCase()
        : "",

    feature:
      typeof feature === "string"
        ? feature.trim().toLowerCase()
        : "",

    platform:
      typeof platform === "string"
        ? platform.trim().toLowerCase()
        : "",

    appVersion:
      typeof appVersion === "string"
        ? appVersion.trim()
        : "",

    metadata:
      metadata &&
      typeof metadata === "object"
        ? metadata
        : {},

    timestamp: timestamp
      ? new Date(timestamp)
      : new Date(),
  });

  return event;
}