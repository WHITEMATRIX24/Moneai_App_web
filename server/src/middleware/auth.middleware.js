import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import AppConfig from "../models/AppConfig.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.id || !decoded.type) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    // ==============================
    // ADMIN TOKEN
    // ==============================

    if (decoded.type === "admin") {
      const admin = await Admin.findById(
        decoded.id
      ).select("-password");

      if (!admin || !admin.isActive) {
        return res.status(401).json({
          message: "Admin account unavailable",
        });
      }

      req.auth = {
        type: "admin",
        user: admin,
      };

      return next();
    }

    // ==============================
    // USER TOKEN
    // ==============================

    if (decoded.type === "user") {
      const user = await User.findById(
        decoded.id
      ).select("-password");

      if (!user || user.status !== "ACTIVE") {
        return res.status(401).json({
          message: "User account unavailable",
        });
      }

      // Check maintenance mode for user tokens (admins bypass maintenance)
      const configDoc = await AppConfig.findOne({ key: "platform_settings" });
      const platformSettings = configDoc?.value || {};
      if (platformSettings.maintenanceMode) {
        return res.status(503).json({
          message:
            platformSettings.maintenanceMessage ||
            "MONE AI is currently undergoing maintenance. Please try again later.",
          code: "MAINTENANCE_MODE",
          maintenanceMode: true,
        });
      }

      req.auth = {
        type: "user",
        user,
      };

      return next();
    }

    // ==============================
    // INVALID TOKEN TYPE
    // ==============================

    return res.status(401).json({
      message: "Invalid account type",
    });

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}


// ==============================
// ADMIN ROLE AUTHORIZATION
// ==============================

export function allowRoles(...roles) {
  return (req, res, next) => {

    if (req.auth?.type !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    if (!roles.includes(req.auth.user.role)) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    next();
  };
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id || !decoded.type) return next();

    if (decoded.type === "admin") {
      const admin = await Admin.findById(decoded.id).select("-password");
      if (admin && admin.isActive) {
        req.auth = { type: "admin", user: admin };
      }
    } else if (decoded.type === "user") {
      const user = await User.findById(decoded.id).select("-password");
      if (user && user.status === "ACTIVE") {
        req.auth = { type: "user", user };
      }
    }
    next();
  } catch {
    next();
  }
}