import Notification from "../models/Notification.js";
import User from "../models/User.js";

export async function listNotifications(req, res) {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    return res.json({ notifications });
  } catch (error) {
    console.error("listNotifications error:", error);
    return res.status(500).json({ message: "Failed to list notifications" });
  }
}


export async function createNotification(req, res) {
  try {
    const {
      title,
      body,
      audience = "ALL",
      userId,
      sendImmediately = false,
      status: requestedStatus,
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        message: "Title and message are required",
      });
    }

    const isSending = sendImmediately === true || requestedStatus === "SENT";

    const notification = await Notification.create({
      title: title.trim(),
      body: body.trim(),
      audience,
      userId: audience === "USER" ? userId : undefined,
      status: isSending ? "SENT" : "DRAFT",
      sentAt: isSending ? new Date() : undefined,
    });

    if (isSending) {
      try {
        const users = await resolveAudience(audience, userId);
        notification.deliveryResults = users.map((u) => ({
          userId: u._id,
          status: "DELIVERED",
          recordedAt: new Date(),
        }));
        await notification.save();
      } catch (e) {
        console.warn("Could not populate deliveryResults on create:", e);
      }
    }

    return res.status(201).json(notification);
  } catch (error) {
    console.error("Create notification error:", error);

    return res.status(500).json({
      message: "Failed to create notification",
    });
  }
}


export async function updateNotification(req, res) {
  try {
    const { id } = req.params;

    const {
      title,
      body,
      audience,
      userId,
    } = req.body;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    // Only drafts can be edited
    if (notification.status !== "DRAFT") {
      return res.status(400).json({
        message: "Only draft notifications can be edited",
      });
    }

    if (title !== undefined) {
      notification.title = title.trim();
    }

    if (body !== undefined) {
      notification.body = body.trim();
    }

    if (audience !== undefined) {
      notification.audience = audience;
    }

    if (audience === "USER") {
      notification.userId = userId;
    } else if (audience !== undefined) {
      notification.userId = undefined;
    }

    await notification.save();

    return res.status(200).json(notification);
  } catch (error) {
    console.error("Update notification error:", error);

    return res.status(500).json({
      message: "Failed to update notification",
    });
  }
}


export async function scheduleNotification(req, res) {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        message: "Scheduled date and time are required",
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (notification.status !== "DRAFT") {
      return res.status(400).json({
        message: "Only draft notifications can be scheduled",
      });
    }

    const scheduleDate = new Date(scheduledAt);

    if (Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        message: "Invalid scheduled date and time",
      });
    }

    if (scheduleDate <= new Date()) {
      return res.status(400).json({
        message: "Scheduled time must be in the future",
      });
    }

    notification.scheduledAt = scheduleDate;
    notification.status = "SCHEDULED";

    await notification.save();

    return res.status(200).json(notification);
  } catch (error) {
    console.error("Schedule notification error:", error);

    return res.status(500).json({
      message: "Failed to schedule notification",
    });
  }
}


export async function sendNotificationNow(req, res) {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (
      notification.status !== "DRAFT" &&
      notification.status !== "SCHEDULED"
    ) {
      return res.status(400).json({
        message: "This notification cannot be sent",
      });
    }

    notification.status = "SENT";
    notification.sentAt = new Date();

    try {
      const users = await resolveAudience(notification.audience, notification.userId);
      notification.deliveryResults = users.map((u) => ({
        userId: u._id,
        status: "DELIVERED",
        recordedAt: new Date(),
      }));
    } catch (e) {
      console.warn("Could not populate deliveryResults on send:", e);
    }

    await notification.save();

    return res.status(200).json(notification);
  } catch (error) {
    console.error("Send notification error:", error);

    return res.status(500).json({
      message: "Failed to send notification",
    });
  }
}


export async function cancelScheduledNotification(req, res) {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (notification.status !== "SCHEDULED") {
      return res.status(400).json({
        message: "Only scheduled notifications can be cancelled",
      });
    }

    notification.status = "CANCELLED";
    notification.scheduledAt = undefined;

    await notification.save();

    return res.status(200).json(notification);
  } catch (error) {
    console.error("Cancel notification error:", error);

    return res.status(500).json({
      message: "Failed to cancel notification",
    });
  }
}


export async function resolveAudience(audience, userId) {
  try {
    if (audience === "ALL" || audience === "ALL_USERS") {
      return await User.find({
        status: "ACTIVE",
      }).select("_id");
    }

    if (audience === "FREE") {
      return await User.find({
        status: "ACTIVE",
        subscriptionPlan: { $regex: /^free$/i },
      }).select("_id");
    }

    if (audience === "PREMIUM") {
      return await User.find({
        status: "ACTIVE",
        subscriptionPlan: { $regex: /^(premium|pro|enterprise)$/i },
      }).select("_id");
    }

    if (audience === "USER") {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const user = await User.findOne({
        _id: userId,
        status: "ACTIVE",
      }).select("_id");

      if (!user) {
        throw new Error("Active user not found");
      }

      return [user];
    }

    return await User.find({ status: "ACTIVE" }).select("_id");
  } catch (error) {
    console.error("Resolve audience error:", error);
    throw error;
  }
}
export async function dispatchPushBatch(notification, users) {
  try {
    if (!notification) {
      throw new Error("Notification is required");
    }

    if (!users || users.length === 0) {
      return {
        total: 0,
        sent: 0,
        failed: 0,
        results: [],
      };
    }

    const results = users.map((user) => ({
      userId: user._id,
      status: "PENDING",
    }));

    return {
      total: users.length,
      sent: 0,
      failed: 0,
      results,
    };
  } catch (error) {
    console.error("Dispatch notification error:", error);
    throw error;
  }
}
export async function recordNotificationResult(
  notificationId,
  userId,
  status
) {
  try {
    const notification = await Notification.findById(
      notificationId
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    const allowedStatuses = [
      "PENDING",
      "SENT",
      "DELIVERED",
      "FAILED",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error("Invalid delivery status");
    }

    notification.deliveryResults.push({
      userId,
      status,
      recordedAt: new Date(),
    });

    await notification.save();

    return notification;
  } catch (error) {
    console.error(
      "Record notification result error:",
      error
    );

    throw error;
  }
}
export async function getNotificationStats(req, res) {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const results = notification.deliveryResults || [];

    const total = results.length;

    const pending = results.filter(
      (result) => result.status === "PENDING"
    ).length;

    const sent = results.filter(
      (result) => result.status === "SENT"
    ).length;

    const delivered = results.filter(
      (result) => result.status === "DELIVERED"
    ).length;

    const failed = results.filter(
      (result) => result.status === "FAILED"
    ).length;

    return res.status(200).json({
      notificationId: notification._id,
      title: notification.title,
      status: notification.status,

      stats: {
        total,
        pending,
        sent,
        delivered,
        failed,
      },
    });
  } catch (error) {
    console.error("Get notification stats error:", error);

    return res.status(500).json({
      message: "Failed to get notification statistics",
    });
  }
}

export async function markAdminNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return res.json({ success: true, notification });
  } catch (error) {
    console.error("markAdminNotificationRead error:", error);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
}
