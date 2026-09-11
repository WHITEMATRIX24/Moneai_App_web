import express from "express";
import { protect, optionalAuth } from "../middleware/auth.middleware.js";
import {
  listSubmoduleHandler,
  createSubmoduleHandler,
  deleteSubmoduleRecord,
} from "../controllers/healthSubmodules.controller.js";

const SUBMODULES = [
  "sleep-intelligence",
  "fitness-activity",
  "workout-intelligence",
  "nutrition-management",
  "medication-management",
  "medical-records",
  "laboratory-monitoring",
  "womens-health",
  "mental-health-wellness",
  "health-goals",
  "health-score",
  "body-composition",
];

export function createSubmoduleRouter(moduleName) {
  const router = express.Router();

  router.get("/", optionalAuth, listSubmoduleHandler(moduleName));
  router.post("/", protect, createSubmoduleHandler(moduleName));
  router.delete("/:id", protect, deleteSubmoduleRecord);

  return router;
}

export { SUBMODULES };
