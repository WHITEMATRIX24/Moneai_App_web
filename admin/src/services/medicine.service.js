// src/services/medicine.service.js

import api from "./api.js"; // ⚠️ match this to whatever todo.service.js imports at the top

function localDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const medicineService = {
  list: () => api.get("/medicines"),

  listToday: () => api.get("/medicines/today", { params: { date: localDateKey() } }),

  create: (payload) => api.post("/medicines", payload),

  update: (id, payload) => api.patch(`/medicines/${id}`, payload),

  remove: (id) => api.delete(`/medicines/${id}`),

  markTaken: (medicineId, time) =>
    api.post(`/medicines/${medicineId}/doses/taken`, { time, date: localDateKey() }),

  markUntaken: (medicineId, time) =>
    api.post(`/medicines/${medicineId}/doses/untaken`, { time, date: localDateKey() }),
};