import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listMedicines,
  listTodayDoses,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  markDoseTaken,
  markDoseUntaken,
} from "../controllers/medicine.controller.js";
const r = express.Router();
r.use(protect);
r.get("/", listMedicines);
r.get("/today", listTodayDoses);
r.post("/", createMedicine);
r.patch("/:id", updateMedicine);
r.delete("/:id", deleteMedicine);
r.post("/:id/doses/taken", markDoseTaken);
r.post("/:id/doses/untaken", markDoseUntaken);
export default r;
