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

router.get("/", listUserNotifications);

router.get("/unread-count", getUnreadCount);

router.patch("/read-all", markAllNotificationsRead);

router.patch("/:id/read", markNotificationRead);

export default router;
