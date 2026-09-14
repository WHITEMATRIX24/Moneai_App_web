// src/controllers/userNotification.controller.js

import Notification from "../models/Notification.js";

/**
 * Returns sent notifications visible to this user (personal or broadcast).
 * Attaches an `isRead` field based on the notification type:
 *  - Personal (userId set): use the `read` boolean
 *  - Broadcast (audience set): check if userId is in `readBy`
 */
export async function listUserNotifications(req, res) {
  try {
    const userId = req.auth.user._id;
    const userPlan = (req.auth.user.subscriptionPlan || "FREE").toUpperCase();
    const allowedAudiences = ["ALL", "ALL_USERS", userPlan];
    if (userPlan === "ENTERPRISE" || userPlan === "PRO") {
      allowedAudiences.push("PREMIUM");
    }

    const notifications = await Notification.find({
      status: "SENT",
      $or: [
        { userId },
        { audience: { $in: allowedAudiences } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Attach computed `isRead` without mutating stored docs
    const enriched = notifications.map((n) => ({
      ...n,
      isRead: n.userId
        ? Boolean(n.read)
        : (n.readBy || []).some((id) => String(id) === String(userId)),
    }));

    return res.json({ notifications: enriched });
  } catch (error) {
    console.error("listUserNotifications error:", error);
    return res.status(500).json({ message: "Unable to load notifications" });
  }
}

/**
 * Lightweight unread count — no full document fetch.
 */
export async function getUnreadCount(req, res) {
  try {
    const userId = req.auth.user._id;
    const userPlan = req.auth.user.subscriptionPlan || "FREE";
    const allowedAudiences = ["ALL", "ALL_USERS", userPlan];

    // Count personal unread
    const personalUnread = await Notification.countDocuments({
      userId,
      status: "SENT",
      read: { $ne: true },
    });

    // Count broadcast not yet read by this user
    const broadcastUnread = await Notification.countDocuments({
      userId: { $exists: false },
      status: "SENT",
      audience: { $in: allowedAudiences },
      readBy: { $nin: [userId] },
    });

    return res.json({ count: personalUnread + broadcastUnread });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    return res.status(500).json({ message: "Unable to get unread count" });
  }
}

/**
 * Mark a single notification as read by this user.
 */
export async function markNotificationRead(req, res) {
  try {
    const userId = req.auth.user._id;
    const userPlan = req.auth.user.subscriptionPlan || "FREE";
    const allowedAudiences = ["ALL", "ALL_USERS", userPlan];

    const notification = await Notification.findOne({
      _id: req.params.id,
      $or: [
        { userId },
        { audience: { $in: allowedAudiences } },
      ],
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const shouldMarkRead = req.body?.read !== undefined ? Boolean(req.body.read) : true;

    if (notification.userId) {
      notification.read = shouldMarkRead;
      notification.readAt = shouldMarkRead ? new Date() : null;
    } else {
      notification.readBy = notification.readBy || [];
      if (shouldMarkRead) {
        const alreadyRead = notification.readBy.some(
          (id) => String(id) === String(userId)
        );
        if (!alreadyRead) {
          notification.readBy.push(userId);
        }
      } else {
        notification.readBy = notification.readBy.filter(
          (id) => String(id) !== String(userId)
        );
      }
    }

    await notification.save();

    return res.json({
      notification: {
        ...notification.toObject(),
        isRead: shouldMarkRead,
      },
    });
  } catch (error) {
    console.error("markNotificationRead error:", error);
    return res.status(500).json({ message: "Unable to update notification" });
  }
}

/**
 * Mark all visible notifications as read for this user.
 */
export async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.auth.user._id;
    const userPlan = req.auth.user.subscriptionPlan || "FREE";
    const allowedAudiences = ["ALL", "ALL_USERS", userPlan];

    // Mark personal notifications
    await Notification.updateMany(
      { userId, status: "SENT", read: { $ne: true } },
      { $set: { read: true, readAt: new Date() } }
    );

    // Add userId to readBy for unread broadcast notifications
    await Notification.updateMany(
      {
        userId: { $exists: false },
        status: "SENT",
        audience: { $in: allowedAudiences },
        readBy: { $nin: [userId] },
      },
      { $addToSet: { readBy: userId } }
    );

    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    return res.status(500).json({ message: "Unable to update notifications" });
  }
}
