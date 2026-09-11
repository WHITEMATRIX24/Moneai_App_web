import express from "express";
import { protect, optionalAuth } from "../middleware/auth.middleware.js";
import {
  listAvailableWidgets,
  getWidgetLayout,
  saveWidgetLayout,
  createCustomWidget,
  deleteCustomWidget,
} from "../controllers/widget.controller.js";

const router = express.Router();

// GET /api/v1/widgets -> List available system modules/widgets (accessible anytime)
router.get("/", optionalAuth, listAvailableWidgets);

// GET /api/v1/widgets/layout -> User's dashboard layout (falls back to default active layout)
router.get("/layout", optionalAuth, getWidgetLayout);

// Modifying routes require authentication
router.put("/layout", protect, saveWidgetLayout);
router.post("/custom", protect, createCustomWidget);
router.delete("/custom/:id", protect, deleteCustomWidget);

export default router;
