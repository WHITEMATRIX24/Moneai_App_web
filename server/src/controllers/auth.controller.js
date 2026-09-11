import crypto from "crypto";
import jwt from "jsonwebtoken";

import Admin from "../models/Admin.js";
import User from "../models/User.js";
import RefreshSession from "../models/RefreshSession.js";

// ==============================
// TOKEN HELPERS
// ==============================

function createAccessToken({ id, type, role = null }) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id,
      type,
      ...(role ? { role } : {}),
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.ACCESS_TOKEN_EXPIRES_IN ||
        process.env.JWT_EXPIRES_IN ||
        "7d",
    },
  );
}

function createRefreshToken({ id, type, sessionId }) {
  const refreshSecret =
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!refreshSecret) {
    throw new Error("JWT refresh secret is not configured");
  }

  return jwt.sign(
    {
      id,
      type,
      sessionId,
    },
    refreshSecret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
    },
  );
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ==============================
// SESSION CREATION
// ==============================

async function createSession({ id, type, role = null }) {
  const sessionId = crypto.randomUUID();

  const refreshToken = createRefreshToken({
    id,
    type,
    sessionId,
  });

  const refreshDays = Number(process.env.REFRESH_TOKEN_DAYS) || 30;

  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

  await RefreshSession.create({
    sessionId,
    userId: id,
    userType: type,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  const accessToken = createAccessToken({
    id,
    type,
    role,
  });

  return {
    accessToken,
    refreshToken,
    sessionId,
  };
}

// ==============================
// USER REGISTRATION
// ==============================

export async function registerUser(req, res) {
  try {
    const { name, email, password, phone, timezone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const existingAdmin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (existingAdmin) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      phone: phone || "",
      timezone: timezone || "Asia/Kolkata",
      status: "ACTIVE",
    });

    const tokens = await createSession({
      id: user._id.toString(),
      type: "user",
    });

    return res.status(201).json({
      message: "User registered successfully",

      accountType: "user",

      ...tokens,

      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error("REGISTER USER ERROR:", error);

    return res.status(500).json({
      message: error.message || "Unable to register user",
      name: error.name || "Error",
    });
  }
}

// ==============================
// USER LOGIN
// ==============================

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "User account is unavailable",
      });
    }

    if (typeof user.comparePassword !== "function") {
      throw new Error("User model comparePassword() method is missing");
    }

    const passwordValid = await user.comparePassword(password);

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    user.lastActiveAt = new Date();

    await user.save();

    const tokens = await createSession({
      id: user._id.toString(),
      type: "user",
    });

    return res.json({
      message: "Login successful",

      accountType: "user",

      ...tokens,

      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error("LOGIN USER ERROR:", error);

    return res.status(500).json({
      message: error.message || "Unable to login",

      name: error.name || "Error",
    });
  }
}

// ==============================
// ADMIN LOGIN
// ==============================

export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        message: "Admin account is unavailable",
      });
    }

    if (typeof admin.comparePassword !== "function") {
      throw new Error("Admin model comparePassword() method is missing");
    }

    const passwordValid = await admin.comparePassword(password);

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    admin.lastLoginAt = new Date();

    await admin.save();

    const tokens = await createSession({
      id: admin._id.toString(),
      type: "admin",
      role: admin.role,
    });

    return res.json({
      message: "Login successful",

      accountType: "admin",

      ...tokens,

      user: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ADMIN ERROR:", error);

    return res.status(500).json({
      message: error.message || "Unable to login",

      name: error.name || "Error",
    });
  }
}

// ==============================
// REFRESH ACCESS TOKEN
// ==============================

export async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required",
      });
    }

    const refreshSecret =
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

    if (!refreshSecret) {
      throw new Error("JWT refresh secret is not configured");
    }

    const decoded = jwt.verify(refreshToken, refreshSecret);

    if (!decoded.id || !decoded.type || !decoded.sessionId) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    const session = await RefreshSession.findOne({
      sessionId: decoded.sessionId,

      tokenHash: hashToken(refreshToken),

      revokedAt: null,
    });

    if (!session || session.expiresAt <= new Date()) {
      return res.status(401).json({
        message: "Refresh session is invalid or expired",
      });
    }

    let account;
    let role = null;

    if (decoded.type === "admin") {
      account = await Admin.findById(decoded.id);

      if (!account || !account.isActive) {
        return res.status(401).json({
          message: "Admin account unavailable",
        });
      }

      role = account.role;
    } else if (decoded.type === "user") {
      account = await User.findById(decoded.id);

      if (!account || account.status !== "ACTIVE") {
        return res.status(401).json({
          message: "User account unavailable",
        });
      }
    } else {
      return res.status(401).json({
        message: "Invalid account type",
      });
    }

    const accessToken = createAccessToken({
      id: account._id.toString(),

      type: decoded.type,

      role,
    });

    return res.json({
      accessToken,
    });
  } catch (error) {
    console.error("REFRESH ACCESS TOKEN ERROR:", error);

    return res.status(401).json({
      message: error.message || "Invalid or expired refresh token",
    });
  }
}

// ==============================
// LOGOUT
// ==============================

export async function logout(req, res) {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message: "Session ID is required",
      });
    }

    await RefreshSession.findOneAndUpdate(
      {
        sessionId,
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
      },
    );

    return res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return res.status(500).json({
      message: error.message || "Unable to logout",

      name: error.name || "Error",
    });
  }
}
