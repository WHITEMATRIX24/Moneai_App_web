import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listAIUsage,
  listAIErrors,
  recordAIUsage,
  getAIKPIs,
  getAIUsageTrends,
} from "../controllers/ai.controller.js";

const r = express.Router();

r.use(protect);

// Analytics aggregated endpoints
r.get("/kpis", getAIKPIs);
r.get("/usage-trends", getAIUsageTrends);

// Raw telemetry entries
r.get("/usage", listAIUsage);
r.get("/errors", listAIErrors);
r.post("/usage", recordAIUsage);

export default r;
