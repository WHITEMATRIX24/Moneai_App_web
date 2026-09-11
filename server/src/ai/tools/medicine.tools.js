import Medicine from "../../models/Medicine.js";

/**
 * medicine.tools.js
 *
 * Not part of either requirement doc's tool categories (§18/§9 only
 * list Finance/Todos/Health/Profile) — Medicine is a real app feature
 * that was built independently of the AI architecture spec and never
 * wired in. This closes that gap, deliberately scoped narrower than
 * the other domains:
 *
 *   - Read tools (list_medicines, get_today_doses) surface the user's
 *     OWN logged schedule/adherence data — same shape as health.tools.js.
 *   - The only write tools are mark_dose_taken / mark_dose_untaken —
 *     logging that a dose happened, functionally identical in risk to
 *     complete_todo. Both still require confirmation (same gate every
 *     other write tool goes through).
 *   - There is deliberately NO create/update/delete_medicine tool here.
 *     Adding, editing or removing a medication (name, dosage, schedule)
 *     is a materially different risk than logging adherence to an
 *     existing one — that's a product decision for a human to make
 *     directly in the app, not something this pass hands to the model.
 *     If that's ever revisited, medicine.prompt.js's confirmation
 *     framing would need to be much stricter than the generic write-tool
 *     rules the other domains use.
 *
 * Logic (todayKey/isScheduledForDate) is duplicated from
 * medicine.controller.js rather than imported from it — same pattern
 * every other tools file follows (todo.tools.js, finance.tools.js query
 * models directly, never route through a controller).
 */

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isScheduledForDate(medicine, date, weekday) {
  const frequency = medicine.frequency || "EVERYDAY";
  if (frequency === "ONE_TIME") return medicine.onceDate === date;
  if (frequency === "CUSTOM_DAYS") {
    return Array.isArray(medicine.days) && medicine.days.includes(weekday);
  }
  return true;
}

export const listMedicinesDeclaration = {
  name: "list_medicines",
  description:
    "Get the authenticated user's active medicine list (name, dosage, schedule) — not medical advice, just what's on record.",
  parametersJsonSchema: {
    type: "object",
    properties: {},
  },
};

export const getTodayDosesDeclaration = {
  name: "get_today_doses",
  description:
    "Get the user's scheduled medicine doses for a given date, including which have already been marked taken.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      date: { type: "string", description: "YYYY-MM-DD. Defaults to today." },
    },
  },
};

export const markDoseTakenDeclaration = {
  name: "mark_dose_taken",
  description: "Mark a specific scheduled dose as taken. Requires user confirmation.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      medicineId: { type: "string", description: "The medicine's id, from list_medicines or get_today_doses." },
      time: { type: "string", description: "HH:MM — must match one of the medicine's scheduled times." },
      date: { type: "string", description: "YYYY-MM-DD. Defaults to today." },
    },
    required: ["medicineId", "time"],
  },
};

export const markDoseUntakenDeclaration = {
  name: "mark_dose_untaken",
  description: "Undo a dose previously marked taken. Requires user confirmation.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      medicineId: { type: "string", description: "The medicine's id." },
      time: { type: "string", description: "HH:MM." },
      date: { type: "string", description: "YYYY-MM-DD. Defaults to today." },
    },
    required: ["medicineId", "time"],
  },
};

/**
 * @param {string} userId
 */
export async function executeListMedicines(userId) {
  const medicines = await Medicine.find({ userId, deletedAt: null, active: true })
    .select("personName name dosage times frequency days onceDate -_id")
    .lean();
  return { medicines };
}

/**
 * @param {string} userId
 * @param {{date?: string}} args
 */
export async function executeGetTodayDoses(userId, args = {}) {
  const date = args.date || todayKey();
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();

  const medicines = await Medicine.find({ userId, active: true, deletedAt: null });

  const doses = [];
  for (const medicine of medicines) {
    if (!isScheduledForDate(medicine, date, weekday)) continue;
    for (const time of medicine.times) {
      const taken = medicine.takenLog.some((log) => log.date === date && log.time === time);
      doses.push({
        medicineId: medicine._id.toString(),
        personName: medicine.personName || "Me",
        name: medicine.name,
        dosage: medicine.dosage,
        time,
        taken,
      });
    }
  }

  return { date, doses };
}

/**
 * @param {string} userId
 * @param {{medicineId: string, time: string, date?: string}} args
 */
export async function executeMarkDoseTaken(userId, args = {}) {
  if (!args.medicineId || !args.time) {
    throw new Error("mark_dose_taken requires medicineId and time");
  }
  const date = args.date || todayKey();

  const medicine = await Medicine.findOne({ _id: args.medicineId, userId, deletedAt: null });
  if (!medicine) throw new Error("Medicine not found");

  const alreadyLogged = medicine.takenLog.some((log) => log.date === date && log.time === args.time);
  if (!alreadyLogged) {
    medicine.takenLog.push({ date, time: args.time, takenAt: new Date() });
    await medicine.save();
  }

  return { medicineId: medicine._id.toString(), name: medicine.name, date, time: args.time, taken: true };
}

/**
 * @param {string} userId
 * @param {{medicineId: string, time: string, date?: string}} args
 */
export async function executeMarkDoseUntaken(userId, args = {}) {
  if (!args.medicineId || !args.time) {
    throw new Error("mark_dose_untaken requires medicineId and time");
  }
  const date = args.date || todayKey();

  const medicine = await Medicine.findOne({ _id: args.medicineId, userId, deletedAt: null });
  if (!medicine) throw new Error("Medicine not found");

  medicine.takenLog = medicine.takenLog.filter((log) => !(log.date === date && log.time === args.time));
  await medicine.save();

  return { medicineId: medicine._id.toString(), name: medicine.name, date, time: args.time, taken: false };
}
