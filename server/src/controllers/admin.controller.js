import mongoose from "mongoose";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Todo from "../models/Todo.js";
import AIUsage from "../models/AIUsage.js";
import AuditLog from "../models/AuditLog.js";
import RefreshSession from "../models/RefreshSession.js";
import AIConversation from "../models/AIConversation.js";
import FinanceTransaction from "../models/FinanceTransaction.js";
import Medicine from "../models/Medicine.js";
import HealthMetric from "../models/HealthMetric.js";

export async function getDashboard(req, res) {
  try {
    const [
      totalUsers,
      activeUsers,
      aiRequests,
      openTodos,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "ACTIVE" }),
      AIUsage.countDocuments(),
      Todo.countDocuments({ completed: false }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select("name email subscriptionPlan status createdAt"),
    ]);

    return res.json({
      totalUsers,
      activeUsers,
      aiRequests,
      openTodos,
      recentUsers,
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    return res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select(
        "name email phone status subscriptionPlan createdAt lastActiveAt"
      );

    return res.json({ users });
  } catch (error) {
    console.error("listUsers error:", error);
    return res.status(500).json({ message: "Failed to list users" });
  }
}

export async function getUser(req, res) {
  try {
    const u = await User.findById(req.params.id).select(
      "name email phone timezone status subscriptionPlan lastActiveAt lastLoginAt createdAt updatedAt"
    );

    if (!u) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(u);
  } catch (error) {
    console.error("getUser error:", error);
    return res.status(500).json({ message: "Failed to get user" });
  }
}

// ==============================
// UPDATE USER STATUS
// ==============================

export async function updateUserStatus(req, res) {
  try {
    const { status } = req.body;

    if (!["ACTIVE", "SUSPENDED", "BLOCKED", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const u = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!u) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await AuditLog.create({
      actorAdminId: req.auth.user._id,
      action: "UPDATE_USER_STATUS",
      entityType: "User",
      entityId: u._id.toString(),
      metadata: { status },
      ip: req.ip,
    });

    return res.json(u);
  } catch (error) {
    console.error("updateUserStatus error:", error);
    return res.status(500).json({ message: "Failed to update user status" });
  }
}

// ==============================
// UPDATE USER PLAN
// ==============================

export async function updateUserPlan(req, res) {
  try {
    const { subscriptionPlan } = req.body;

    if (!["FREE", "TRIAL", "PREMIUM", "ENTERPRISE"].includes(subscriptionPlan)) {
      return res.status(400).json({
        message: "Invalid plan",
      });
    }

    const u = await User.findByIdAndUpdate(
      req.params.id,
      { subscriptionPlan },
      { new: true }
    );

    if (!u) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await AuditLog.create({
      actorAdminId: req.auth.user._id,
      action: "UPDATE_USER_PLAN",
      entityType: "User",
      entityId: u._id.toString(),
      metadata: { subscriptionPlan },
      ip: req.ip,
    });

    return res.json(u);
  } catch (error) {
    console.error("updateUserPlan error:", error);
    return res.status(500).json({ message: "Failed to update user plan" });
  }
}

// ==============================
// GET USER DEVICES / SESSIONS
// ==============================

// ==============================
// GET USER DEVICES / SESSIONS
// ==============================

export async function getUserDevices(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select(
      "name email lastActiveAt lastLoginAt createdAt"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sessions = await RefreshSession.find({
      userId: id,
      userType: "user",
    }).sort({ lastActiveAt: -1, createdAt: -1 });

    if (sessions.length === 0) {
      if (user.lastLoginAt || user.lastActiveAt) {
        return res.json([
          {
            id: `current_${user._id}`,
            device: "Web Browser (Chrome)",
            type: "desktop",
            browser: "Chrome",
            os: "Current OS",
            location: "Recent Login",
            lastActive: new Date(user.lastLoginAt || user.lastActiveAt).toLocaleString(),
            status: "Active",
            activeSessionCount: 1,
            isCurrent: true,
            createdAt: user.lastLoginAt || user.lastActiveAt,
          },
        ]);
      }
      return res.json([]);
    }

    // Group sessions by distinct device signature so the same device is not repeated
    const deviceMap = new Map();

    for (const s of sessions) {
      const isRevoked = Boolean(s.revokedAt);
      const isExpired = s.expiresAt && new Date(s.expiresAt) < new Date();
      const isActive = !isRevoked && !isExpired;

      const deviceName = s.device || (s.os ? `${s.os} Device` : "Web Browser");
      const browserName = s.browser || "Web Browser";
      const osName = s.os || "Desktop";
      const ip = s.ip || "127.0.0.1";
      const deviceType = s.deviceType || "desktop";

      // Unique device key: combinations of device name, browser, OS, and IP
      const key = `${deviceName}__${browserName}__${osName}__${ip}`;

      if (!deviceMap.has(key)) {
        deviceMap.set(key, {
          id: s.sessionId || String(s._id),
          sessionId: s.sessionId,
          device: deviceName,
          type: deviceType,
          browser: browserName,
          os: osName,
          ip,
          location: s.location || (ip !== "127.0.0.1" ? `IP: ${ip}` : "Current Location"),
          lastActive: s.lastActiveAt
            ? new Date(s.lastActiveAt).toLocaleString()
            : (s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "Active recently"),
          lastActiveTimestamp: new Date(s.lastActiveAt || s.updatedAt || s.createdAt).getTime(),
          status: isActive ? "Active" : (isRevoked ? "Revoked" : "Expired"),
          activeSessionCount: isActive ? 1 : 0,
          totalSessionCount: 1,
          createdAt: s.createdAt,
        });
      } else {
        const existing = deviceMap.get(key);
        existing.totalSessionCount += 1;
        if (isActive) {
          existing.activeSessionCount += 1;
          existing.status = "Active"; // If any session is active, the device is active
        }
        const sTime = new Date(s.lastActiveAt || s.updatedAt || s.createdAt).getTime();
        if (sTime > existing.lastActiveTimestamp) {
          existing.lastActiveTimestamp = sTime;
          existing.lastActive = s.lastActiveAt
            ? new Date(s.lastActiveAt).toLocaleString()
            : new Date(s.updatedAt || s.createdAt).toLocaleString();
          existing.id = s.sessionId || String(s._id);
          existing.sessionId = s.sessionId;
        }
      }
    }

    const devices = Array.from(deviceMap.values()).map((d, idx) => ({
      ...d,
      isCurrent: idx === 0 && d.status === "Active",
    }));

    return res.json(devices);
  } catch (error) {
    console.error("getUserDevices error:", error);
    return res.status(500).json({ message: "Failed to fetch user devices" });
  }
}

// ==============================
// REVOKE USER DEVICE SESSION
// ==============================

export async function revokeUserDevice(req, res) {
  try {
    const { id, deviceId } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isObjectId = mongoose.isValidObjectId(deviceId);
    const targetSession = await RefreshSession.findOne({
      userId: id,
      $or: [
        { sessionId: deviceId },
        ...(isObjectId ? [{ _id: deviceId }] : []),
      ],
    });

    if (!targetSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    const now = new Date();

    // Revoke all active sessions on this specific device
    await RefreshSession.updateMany(
      {
        userId: id,
        device: targetSession.device,
        browser: targetSession.browser,
        ip: targetSession.ip,
        revokedAt: null,
      },
      { revokedAt: now }
    );

    targetSession.revokedAt = now;
    await targetSession.save();

    await AuditLog.create({
      actorAdminId: req.auth.user._id,
      action: "REVOKE_USER_DEVICE",
      entityType: "RefreshSession",
      entityId: deviceId,
      metadata: {
        userId: id,
        device: targetSession.device,
        ip: targetSession.ip,
      },
      ip: req.ip,
    });

    return res.json({
      message: "Device sessions revoked successfully",
      session: {
        id: targetSession.sessionId || String(targetSession._id),
        status: "Revoked",
      },
    });
  } catch (error) {
    console.error("revokeUserDevice error:", error);
    return res.status(500).json({ message: "Failed to revoke user device" });
  }
}

// ==============================
// GET USER ACTIVITY TIMELINE
// ==============================

function formatActivityTime(date) {
  if (!date) return "Recently";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday, " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export async function getUserActivity(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select(
      "name email createdAt lastLoginAt lastActiveAt"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [sessions, aiConvs, todos, transactions, medicines, healthMetrics, auditLogs] =
      await Promise.all([
        RefreshSession.find({ userId: id }).sort({ createdAt: -1 }).limit(10),
        AIConversation.find({ userId: id }).sort({ updatedAt: -1 }).limit(10),
        Todo.find({ userId: id }).sort({ createdAt: -1 }).limit(10),
        FinanceTransaction.find({ userId: id }).sort({ createdAt: -1 }).limit(10),
        Medicine.find({ userId: id }).sort({ createdAt: -1 }).limit(10),
        HealthMetric.find({ userId: id }).sort({ createdAt: -1 }).limit(10),
        AuditLog.find({
          $or: [{ entityId: id }, { "metadata.userId": id }],
        })
          .populate("actorAdminId", "name email")
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    const activities = [];

    // 1. Account creation
    if (user.createdAt) {
      activities.push({
        id: `account_created_${user._id}`,
        type: "account",
        category: "account",
        title: "Account Created",
        description: `Account registered with email ${user.email}`,
        time: formatActivityTime(user.createdAt),
        timestamp: new Date(user.createdAt).getTime(),
      });
    }

    // 2. Refresh Sessions (Logins & Devices)
    sessions.forEach((s) => {
      activities.push({
        id: `session_login_${s._id}`,
        type: "login",
        category: "login",
        title: "User Logged In",
        description: `${s.device || "Device"} • ${s.browser || "Web"} on ${s.os || "OS"} (${s.ip || "127.0.0.1"})`,
        time: formatActivityTime(s.createdAt),
        timestamp: new Date(s.createdAt).getTime(),
      });

      if (s.revokedAt) {
        activities.push({
          id: `session_revoke_${s._id}`,
          type: "device",
          category: "login",
          title: "Session Revoked",
          description: `${s.device || "Device"} session was terminated`,
          time: formatActivityTime(s.revokedAt),
          timestamp: new Date(s.revokedAt).getTime(),
        });
      }
    });

    // 3. AI Chat Conversations
    aiConvs.forEach((c) => {
      activities.push({
        id: `ai_conv_${c._id}`,
        type: "ai",
        category: "ai",
        title: "AI Chat Interaction",
        description: c.title || "User chatted with Mone AI Assistant",
        time: formatActivityTime(c.updatedAt || c.createdAt),
        timestamp: new Date(c.updatedAt || c.createdAt).getTime(),
      });
    });

    // 4. Finance Transactions
    transactions.forEach((tx) => {
      const typeLabel =
        tx.type === "Income"
          ? "Income Added"
          : tx.type === "Expense"
          ? "Expense Logged"
          : "Transfer";
      activities.push({
        id: `finance_tx_${tx._id}`,
        type: "finance",
        category: "finance",
        title: `${typeLabel} (${tx.category || "General"})`,
        description: `${tx.description ? `${tx.description} • ` : ""}Amount: ₹${Number(tx.amount || 0).toLocaleString()}`,
        time: formatActivityTime(tx.transactionDate || tx.createdAt),
        timestamp: new Date(tx.transactionDate || tx.createdAt).getTime(),
      });
    });

    // 5. Tasks / Todos
    todos.forEach((t) => {
      activities.push({
        id: `todo_${t._id}`,
        type: "todo",
        category: "todo",
        title: t.completed ? "Task Completed" : "Task Created",
        description: `${t.title}${t.priority ? ` [${t.priority} Priority]` : ""}`,
        time: formatActivityTime(t.completed && t.completedAt ? t.completedAt : t.createdAt),
        timestamp: new Date(t.completed && t.completedAt ? t.completedAt : t.createdAt).getTime(),
      });
    });

    // 6. Medication
    medicines.forEach((m) => {
      activities.push({
        id: `med_${m._id}`,
        type: "medicine",
        category: "health",
        title: `Medication Added: ${m.name}`,
        description: `${m.dosage ? `Dosage: ${m.dosage} • ` : ""}Frequency: ${m.frequency || "Everyday"}`,
        time: formatActivityTime(m.createdAt),
        timestamp: new Date(m.createdAt).getTime(),
      });
    });

    // 7. Health Metrics
    healthMetrics.forEach((h) => {
      activities.push({
        id: `health_${h._id}`,
        type: "health",
        category: "health",
        title: `Health Metric Logged: ${h.type}`,
        description: `Value: ${h.value} ${h.unit || ""}`,
        time: formatActivityTime(h.recordedAt || h.createdAt),
        timestamp: new Date(h.recordedAt || h.createdAt).getTime(),
      });
    });

    // 8. Admin Audit Logs
    auditLogs.forEach((a) => {
      let title = "Admin Action";
      let description = `Performed by ${a.actorAdminId?.name || "System Admin"}`;
      if (a.action === "UPDATE_USER_STATUS") {
        title = `Status Updated to ${a.metadata?.status || "Modified"}`;
      } else if (a.action === "UPDATE_USER_PLAN") {
        title = `Plan Changed to ${a.metadata?.subscriptionPlan || "Updated"}`;
      } else if (a.action === "REVOKE_USER_DEVICE") {
        title = "Device Revoked by Admin";
      }
      activities.push({
        id: `audit_${a._id}`,
        type: "account",
        category: "account",
        title,
        description,
        time: formatActivityTime(a.createdAt),
        timestamp: new Date(a.createdAt).getTime(),
      });
    });

    // Sort newest to oldest
    activities.sort((a, b) => b.timestamp - a.timestamp);

    return res.json({
      userId: id,
      userName: user.name,
      total: activities.length,
      activities,
    });
  } catch (error) {
    console.error("getUserActivity error:", error);
    return res.status(500).json({ message: "Failed to fetch user activity" });
  }
}


// ==============================
// LIST ADMIN USERS
// ==============================

export async function listAdmins(req, res) {
  try {
    const admins = await Admin.find()
      .sort({ createdAt: -1 })
      .select(
        "name email role isActive lastLoginAt createdAt updatedAt"
      );

    return res.status(200).json({
      admins,
    });
  } catch (error) {
    console.error("List admins error:", error);

    return res.status(500).json({
      message: "Failed to list admin users",
    });
  }
}

// ==============================
// CREATE ADMIN USER
// ==============================

export async function createAdmin(req, res) {
  try {
    if (req.auth?.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only SUPER_ADMIN can create admin users",
      });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const allowedRoles = [
      "ADMIN",
      "SUPPORT",
      "ANALYST",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid admin role",
      });
    }

    const normalizedName = String(name).trim();

    const normalizedEmail = String(email)
      .toLowerCase()
      .trim();

    if (!normalizedName) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const existingAdmin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (existingAdmin) {
      return res.status(409).json({
        message: "An admin with this email already exists",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists",
      });
    }

    const admin = await Admin.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role,
      isActive: true,
    });

    await AuditLog.create({
      actorAdminId: req.auth.user._id,
      action: "CREATE_ADMIN",
      entityType: "Admin",
      entityId: admin._id.toString(),
      metadata: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      ip: req.ip,
    });

    return res.status(201).json({
      message: "Admin created successfully",

      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt || null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create admin user",
    });
  }
}

// ==============================
// UPDATE ADMIN USER
// ==============================

export async function updateAdmin(req, res) {
  try {
    if (req.auth?.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only SUPER_ADMIN can edit admin users",
      });
    }

    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        message: "Name, email and role are required",
      });
    }

    const allowedRoles = [
      "ADMIN",
      "SUPPORT",
      "ANALYST",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid admin role",
      });
    }

    const normalizedName = String(name).trim();

    const normalizedEmail = String(email)
      .toLowerCase()
      .trim();

    if (!normalizedName) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin user not found",
      });
    }

    const existingAdmin = await Admin.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });

    if (existingAdmin) {
      return res.status(409).json({
        message: "An admin with this email already exists",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists",
      });
    }

    if (
      admin.role === "SUPER_ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return res.status(400).json({
        message:
          "SUPER_ADMIN accounts cannot be changed to another role",
      });
    }

    const previousValues = {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    admin.name = normalizedName;
    admin.email = normalizedEmail;
    admin.role = role;

    await admin.save();

    await AuditLog.create({
      actorAdminId: req.auth.user._id,
      action: "UPDATE_ADMIN",
      entityType: "Admin",
      entityId: admin._id.toString(),
      metadata: {
        previous: previousValues,
        updated: {
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      ip: req.ip,
    });

    return res.status(200).json({
      message: "Admin updated successfully",

      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt || null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update admin error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to update admin user",
    });
  }
}

// ==============================
// ACTIVATE / DISABLE ADMIN
// ==============================

export async function updateAdminStatus(req, res) {
  try {
    if (req.auth?.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only SUPER_ADMIN can change admin status",
      });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false",
      });
    }

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin user not found",
      });
    }

    // Prevent a SUPER_ADMIN from disabling their own account.
    if (
      admin._id.toString() ===
      req.auth.user._id.toString()
    ) {
      return res.status(400).json({
        message: "You cannot disable your own account",
      });
    }

    const previousStatus = admin.isActive;

    admin.isActive = isActive;

    await admin.save();

    await AuditLog.create({
      actorAdminId: req.auth.user._id,
      action: isActive
        ? "ACTIVATE_ADMIN"
        : "DISABLE_ADMIN",
      entityType: "Admin",
      entityId: admin._id.toString(),
      metadata: {
        previousIsActive: previousStatus,
        isActive: admin.isActive,
      },
      ip: req.ip,
    });

    return res.status(200).json({
      message: isActive
        ? "Admin activated successfully"
        : "Admin disabled successfully",

      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt || null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update admin status error:", error);

    return res.status(500).json({
      message: "Failed to update admin status",
    });
  }
}

// ==============================
// DELETE ADMIN USER
// ==============================

export async function deleteAdmin(req, res) {
  try {
    if (req.auth?.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only SUPER_ADMIN can delete admin users",
      });
    }

    const { id } = req.params;

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin user not found",
      });
    }

    // Prevent a SUPER_ADMIN from deleting their own account.
    if (
      admin._id.toString() ===
      req.auth.user._id.toString()
    ) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    await Admin.findByIdAndDelete(id);

    await AuditLog.create({
      actorAdminId: req.auth.user._id,
      action: "DELETE_ADMIN",
      entityType: "Admin",
      entityId: admin._id.toString(),
      metadata: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      ip: req.ip,
    });

    return res.status(200).json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);

    return res.status(500).json({
      message: "Failed to delete admin user",
    });
  }
}