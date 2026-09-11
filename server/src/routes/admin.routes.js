import express from "express";

import {
  getDashboard,
  listUsers,
  getUser,
  updateUserStatus,
  updateUserPlan,
  getUserDevices,
  listAdmins,
  createAdmin,
  updateAdmin,
  updateAdminStatus,
  deleteAdmin,
} from "../controllers/admin.controller.js";

import {
  protect,
  allowRoles,
} from "../middleware/auth.middleware.js";

import {
  listAIUsage,
  listAIErrors,
  listAIUsers,
} from "../controllers/ai.controller.js";

import {
  adminGetConfig,
  upsertConfig,
  upsertFeatureFlag,
} from "../controllers/appConfig.controller.js";

const r = express.Router();

r.use(protect);

r.use(
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "SUPPORT",
    "ANALYST"
  )
);

// ==============================
// DASHBOARD
// ==============================

r.get("/dashboard", getDashboard);

// ==============================
// USERS
// ==============================

r.get("/users", listUsers);

r.get("/users/:id", getUser);

r.patch(
  "/users/:id/status",
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "SUPPORT"
  ),
  updateUserStatus
);

r.patch(
  "/users/:id/plan",
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "SUPPORT"
  ),
  updateUserPlan
);

r.get(
  "/users/:id/devices",
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "SUPPORT",
    "ANALYST"
  ),
  getUserDevices
);

// ==============================
// ADMIN USERS
// ==============================

// List admin users (all admin roles can view team)
r.get(
  "/admin-users",
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "SUPPORT",
    "ANALYST"
  ),
  listAdmins
);

// Create admin user
r.post(
  "/admin-users",
  allowRoles("SUPER_ADMIN"),
  createAdmin
);

// Edit admin user
r.patch(
  "/admin-users/:id",
  allowRoles("SUPER_ADMIN"),
  updateAdmin
);

// Activate / Disable admin user
r.patch(
  "/admin-users/:id/status",
  allowRoles("SUPER_ADMIN"),
  updateAdminStatus
);

// Delete admin user
r.delete(
  "/admin-users/:id",
  allowRoles("SUPER_ADMIN"),
  deleteAdmin
);

// ==============================
// AI USAGE
// ==============================

r.get(
  "/ai/usage",
  listAIUsage
);

// ==============================
// AI ERRORS
// ==============================

r.get(
  "/ai/errors",
  listAIErrors
);

// ==============================
// AI USERS
// ==============================

r.get(
  "/ai/users",
  listAIUsers
);

// ==============================
// APP CONFIG
// ==============================

r.get(
  "/app-config",
  allowRoles("SUPER_ADMIN", "ADMIN"),
  adminGetConfig
);

r.patch(
  "/app-config",
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  upsertConfig
);

// ==============================
// FEATURE FLAGS
// ==============================

r.patch(
  "/feature-flags",
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  upsertFeatureFlag
);

export default r;
