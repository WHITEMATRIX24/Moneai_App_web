import express from "express";

import { protect } from "../middleware/auth.middleware.js";

import {
  listUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/userNotification.controller.js";

const router = express.Router();

router.use(protect);

// Received Notifications & Inbox operations
router.get("/", listUserNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

// Explicitly reject any attempt to send notifications from the user module
router.post("*", (req, res) => {
  return res.status(403).json({
    message: "Sending notifications is not permitted from the user module.",
  });
});

export default router;
