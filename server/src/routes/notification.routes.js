import express from "express";
import { protect, allowRoles } from "../middleware/auth.middleware.js";
import {
  listNotifications,
  createNotification,
  updateNotification,
  scheduleNotification,
  sendNotificationNow,
  cancelScheduledNotification,
  getNotificationStats,
  markAdminNotificationRead,
} from "../controllers/notification.controller.js";

const r = express.Router();

r.use(protect);

r.get("/", allowRoles("SUPER_ADMIN", "ADMIN", "SUPPORT"), listNotifications);

r.post("/", allowRoles("SUPER_ADMIN", "ADMIN"), createNotification);

r.patch("/:id/read", allowRoles("SUPER_ADMIN", "ADMIN", "SUPPORT"), markAdminNotificationRead);

r.patch("/:id", allowRoles("SUPER_ADMIN", "ADMIN"), updateNotification);

r.post(
  "/:id/schedule",
  allowRoles("SUPER_ADMIN", "ADMIN"),
  scheduleNotification,
);
r.post("/:id/send", allowRoles("SUPER_ADMIN", "ADMIN"), sendNotificationNow);
r.post(
  "/:id/cancel",
  allowRoles("SUPER_ADMIN", "ADMIN"),
  cancelScheduledNotification,
);
r.get(
  "/:id/stats",
  allowRoles("SUPER_ADMIN", "ADMIN", "SUPPORT"),
  getNotificationStats,
);
export default r;
