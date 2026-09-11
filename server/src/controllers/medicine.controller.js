import Medicine from "../models/Medicine.js";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isScheduledForDate(medicine, date, weekday) {
  const frequency = medicine.frequency || "EVERYDAY";

  if (frequency === "ONE_TIME") {
    return medicine.onceDate === date;
  }

  if (frequency === "CUSTOM_DAYS") {
    return Array.isArray(medicine.days) && medicine.days.includes(weekday);
  }

  return true;
}

// ==============================
// LIST MEDICINES
// ==============================

export async function listMedicines(req, res, next) {
  try {
    const medicines = await Medicine.find({
      userId: req.auth.user._id,
      deletedAt: null,
    }).sort({ createdAt: -1 });

    res.json({ medicines });
  } catch (error) {
    next(error);
  }
}

// ==============================
// LIST TODAY'S DOSES
// ==============================

export async function listTodayDoses(req, res, next) {
  try {
    const date = req.query.date || todayKey();

    const [y, m, d] = date.split("-").map(Number);
    const weekday = new Date(y, m - 1, d).getDay();

    const medicines = await Medicine.find({
      userId: req.auth.user._id,
      active: true,
      deletedAt: null,
    });

    const doses = [];

    for (const medicine of medicines) {
      if (!isScheduledForDate(medicine, date, weekday)) continue;

      for (const time of medicine.times) {
        const taken = medicine.takenLog.some(
          (log) => log.date === date && log.time === time,
        );

        doses.push({
          medicineId: medicine._id,
          personName: medicine.personName || "Me",
          name: medicine.name,
          dosage: medicine.dosage,
          time,
          taken,
        });
      }
    }

    res.json({ doses, date });
  } catch (error) {
    next(error);
  }
}

// ==============================
// CREATE
// ==============================

export async function createMedicine(req, res, next) {
  try {
    const { personName, name, dosage, notes, times, frequency, days, onceDate } =
      req.body;

    if (!name || !Array.isArray(times) || !times.length) {
      return res.status(400).json({
        message: "Name and at least one time are required",
      });
    }

    const cleanFrequency = ["EVERYDAY", "CUSTOM_DAYS", "ONE_TIME"].includes(frequency)
      ? frequency
      : "EVERYDAY";

    const cleanDays = Array.isArray(days)
      ? days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];

    if (cleanFrequency === "CUSTOM_DAYS" && !cleanDays.length) {
      return res.status(400).json({
        message: "Select at least one day for a custom-day medicine",
      });
    }

    if (cleanFrequency === "ONE_TIME" && !onceDate) {
      return res.status(400).json({
        message: "A date is required for a one-time medicine",
      });
    }

    const medicine = await Medicine.create({
      userId: req.auth.user._id,
      personName: (personName || "Me").trim() || "Me",
      name,
      dosage: dosage || "",
      notes: notes || "",
      times,
      frequency: cleanFrequency,
      days: cleanFrequency === "CUSTOM_DAYS" ? cleanDays : [],
      onceDate: cleanFrequency === "ONE_TIME" ? onceDate : null,
    });

    res.status(201).json({ medicine });
  } catch (error) {
    next(error);
  }
}

// ==============================
// UPDATE
// ==============================

export async function updateMedicine(req, res, next) {
  try {
    const { personName, name, dosage, notes, times, active, frequency, days, onceDate } =
      req.body;

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.auth.user._id,
      deletedAt: null,
    });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    if (personName !== undefined) {
      medicine.personName = (personName || "Me").trim() || "Me";
    }
    if (name !== undefined) medicine.name = name;
    if (dosage !== undefined) medicine.dosage = dosage;
    if (notes !== undefined) medicine.notes = notes;
    if (Array.isArray(times) && times.length) medicine.times = times;
    if (active !== undefined) medicine.active = active;

    if (frequency !== undefined) {
      const cleanFrequency = ["EVERYDAY", "CUSTOM_DAYS", "ONE_TIME"].includes(frequency)
        ? frequency
        : "EVERYDAY";

      const cleanDays = Array.isArray(days)
        ? days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        : [];

      if (cleanFrequency === "CUSTOM_DAYS" && !cleanDays.length) {
        return res.status(400).json({
          message: "Select at least one day for a custom-day medicine",
        });
      }

      if (cleanFrequency === "ONE_TIME" && !onceDate) {
        return res.status(400).json({
          message: "A date is required for a one-time medicine",
        });
      }

      medicine.frequency = cleanFrequency;
      medicine.days = cleanFrequency === "CUSTOM_DAYS" ? cleanDays : [];
      medicine.onceDate = cleanFrequency === "ONE_TIME" ? onceDate : null;
    }

    await medicine.save();

    res.json({ medicine });
  } catch (error) {
    next(error);
  }
}

// ==============================
// DELETE
// ==============================

export async function deleteMedicine(req, res, next) {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.auth.user._id,
      deletedAt: null,
    });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    medicine.deletedAt = new Date();
    await medicine.save();

    res.json({ message: "Medicine deleted" });
  } catch (error) {
    next(error);
  }
}

// ==============================
// MARK DOSE TAKEN
// ==============================

export async function markDoseTaken(req, res, next) {
  try {
    const { time, date } = req.body;

    if (!time) {
      return res.status(400).json({ message: "Time is required" });
    }

    const doseDate = date || todayKey();

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.auth.user._id,
      deletedAt: null,
    });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const alreadyLogged = medicine.takenLog.some(
      (log) => log.date === doseDate && log.time === time,
    );

    if (!alreadyLogged) {
      medicine.takenLog.push({ date: doseDate, time, takenAt: new Date() });
      await medicine.save();
    }

    res.json({ medicine });
  } catch (error) {
    next(error);
  }
}

// ==============================
// MARK DOSE UNTAKEN
// ==============================

export async function markDoseUntaken(req, res, next) {
  try {
    const { time, date } = req.body;

    if (!time) {
      return res.status(400).json({ message: "Time is required" });
    }

    const doseDate = date || todayKey();

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.auth.user._id,
      deletedAt: null,
    });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    medicine.takenLog = medicine.takenLog.filter(
      (log) => !(log.date === doseDate && log.time === time),
    );

    await medicine.save();

    res.json({ medicine });
  } catch (error) {
    next(error);
  }
}