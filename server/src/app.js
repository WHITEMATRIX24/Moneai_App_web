import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import financeRoutes from "./routes/finance.routes.js";
import financeAccountRoutes from "./routes/financeAccount.routes.js";
import healthRoutes from "./routes/health.routes.js";
import todoRoutes from "./routes/todo.routes.js";
import medicineRoutes from "./routes/medicine.routes.js";
import widgetRoutes from "./routes/widget.routes.js";
import aiRoutes from "./routes/ai.routes.js";

import userNotificationRoutes from "./routes/userNotification.routes.js";
import adminNotificationRoutes from "./routes/notification.routes.js";

import subscriptionRoutes from "./routes/subscription.routes.js";
import appConfigRoutes from "./routes/appConfig.routes.js";
import { SUBMODULES, createSubmoduleRouter } from "./routes/healthSubmodules.routes.js";

import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === process.env.CLIENT_URL
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(morgan("dev"));

app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    service: "mone-ai-api",
    timestamp: new Date().toISOString(),
  }),
);

// ==============================
// AUTH
// ==============================

app.use("/api/v1/auth", authRoutes);

// ==============================
// ADMIN
// ==============================

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/admin/notifications", adminNotificationRoutes);

// ==============================
// USER MODULES
// ==============================

app.use("/api/v1/finance", financeRoutes);
app.use("/api/v1/finance-accounts", financeAccountRoutes);

app.use("/api/v1/health", healthRoutes);

app.use("/api/v1/todos", todoRoutes);

app.use("/api/v1/medicines", medicineRoutes);

app.use("/api/v1/widgets", widgetRoutes);

app.use("/api/v1/ai", aiRoutes);

app.use("/api/v1/notifications", userNotificationRoutes);

app.use("/api/v1/subscriptions", subscriptionRoutes);

app.use("/api/v1/app-config", appConfigRoutes);

// ==============================
// HEALTH SUBMODULES
// ==============================

SUBMODULES.forEach((sub) => {
  app.use(`/api/v1/${sub}`, createSubmoduleRouter(sub));
});

// ==============================
// ERROR HANDLING
// ==============================

app.use(notFound);
app.use(errorHandler);

export default app;
