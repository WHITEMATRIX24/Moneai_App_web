import HealthMetric from "../models/HealthMetric.js";
import HealthDailySummary from "../models/HealthDailySummary.js";


/* =========================================================
   RECORD HEALTH METRIC
========================================================= */

export async function recordHealthMetric({
  userId,
  type,
  value,
  unit,
  recordedAt,
  source,
}) {
  const metric = await HealthMetric.create({
    userId,
    type,
    value,
    unit,
    recordedAt: recordedAt || new Date(),
    source: source || "MANUAL",
  });

  return metric;
}


/* =========================================================
   LIST HEALTH METRICS
========================================================= */

export async function listHealthMetrics({
  userId,
  type,
  from,
  to,
  limit = 100,
}) {
  const query = {
    userId,
  };

  if (type) {
    query.type = type;
  }

  if (from || to) {
    query.recordedAt = {};

    if (from) {
      const startDate = new Date(from);

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      query.recordedAt.$gte = startDate;
    }

    if (to) {
      const endDate = new Date(to);

      endDate.setHours(
        23,
        59,
        59,
        999
      );

      query.recordedAt.$lte = endDate;
    }
  }

  return HealthMetric.find(query)
    .sort({
      recordedAt: -1,
    })
    .limit(Number(limit));
}


/* =========================================================
   DAILY HEALTH SUMMARY
========================================================= */

export async function upsertDailyHealthSummary({
  userId,
  date,
  sleepMinutes,
  steps,
  calories,
  score,
}) {
  return HealthDailySummary.findOneAndUpdate(
    {
      userId,
      date,
    },
    {
      userId,
      date,
      sleepMinutes,
      steps,
      calories,
      score,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}


/* =========================================================
   HEALTH SCORE
========================================================= */

export async function calculateHealthScore({
  sleepMinutes = 0,
  steps = 0,
  calories = 0,
}) {
  let score = 0;

  /*
   * Sleep score
   * Target: 7–9 hours
   */
  if (
    sleepMinutes >= 420 &&
    sleepMinutes <= 540
  ) {
    score += 40;
  } else if (sleepMinutes >= 360) {
    score += 30;
  } else if (sleepMinutes > 0) {
    score += 20;
  }

  /*
   * Steps score
   * Target: 8,000+
   */
  if (steps >= 8000) {
    score += 40;
  } else if (steps >= 5000) {
    score += 30;
  } else if (steps > 0) {
    score += 20;
  }

  /*
   * Calories
   */
  if (calories > 0) {
    score += 20;
  }

  return Math.min(score, 100);
}


/* =========================================================
   HEALTH DASHBOARD
========================================================= */

export async function getHealthDashboard(
  userId
) {
  const latestMetrics =
    await HealthMetric.aggregate([
      {
        $match: {
          userId,
        },
      },

      {
        $sort: {
          recordedAt: -1,
        },
      },

      {
        $group: {
          _id: "$type",

          value: {
            $first: "$value",
          },

          unit: {
            $first: "$unit",
          },

          recordedAt: {
            $first: "$recordedAt",
          },
        },
      },
    ]);

  const dashboard = {
    sleep: null,
    steps: null,
    heartRate: null,
    calories: null,
    weight: null,
    water: null,

    // Vital Signs
    bloodOxygen: null,
    respiratoryRate: null,
    bodyTemperature: null,

    systolicBloodPressure: null,
    diastolicBloodPressure: null,

    stressLevel: null,
    irregularHeartRhythm: null,

    score: 0,
  };


  for (const metric of latestMetrics) {
    switch (metric._id) {

      /* =====================================================
         EXISTING HEALTH METRICS
      ===================================================== */

      case "SLEEP":
        dashboard.sleep = metric;
        break;

      case "STEPS":
        dashboard.steps = metric;
        break;

      case "HEART_RATE":
        dashboard.heartRate = metric;
        break;

      case "CALORIES":
        dashboard.calories = metric;
        break;

      case "WEIGHT":
        dashboard.weight = metric;
        break;

      case "WATER":
        dashboard.water = metric;
        break;


      /* =====================================================
         VITAL SIGNS
      ===================================================== */

      case "BLOOD_OXYGEN":
        dashboard.bloodOxygen = metric;
        break;

      case "RESPIRATORY_RATE":
        dashboard.respiratoryRate = metric;
        break;

      case "BODY_TEMPERATURE":
        dashboard.bodyTemperature = metric;
        break;

      case "SYSTOLIC_BLOOD_PRESSURE":
        dashboard.systolicBloodPressure =
          metric;
        break;

      case "DIASTOLIC_BLOOD_PRESSURE":
        dashboard.diastolicBloodPressure =
          metric;
        break;

      case "STRESS_LEVEL":
        dashboard.stressLevel = metric;
        break;

      case "IRREGULAR_HEART_RHYTHM":
        dashboard.irregularHeartRhythm =
          metric;
        break;

      default:
        break;
    }
  }


  /* =========================================================
     HEALTH SCORE
  ========================================================= */

  dashboard.score =
    await calculateHealthScore({
      sleepMinutes:
        dashboard.sleep?.value || 0,

      steps:
        dashboard.steps?.value || 0,

      calories:
        dashboard.calories?.value || 0,
    });


  return dashboard;
}


/* =========================================================
   VITAL SIGNS
========================================================= */

export async function getVitalSigns(
  userId
) {
  const vitalTypes = [
    "HEART_RATE",
    "BLOOD_OXYGEN",
    "RESPIRATORY_RATE",
    "BODY_TEMPERATURE",
    "SYSTOLIC_BLOOD_PRESSURE",
    "DIASTOLIC_BLOOD_PRESSURE",
    "STRESS_LEVEL",
    "IRREGULAR_HEART_RHYTHM",
  ];


  const metrics =
    await HealthMetric.find({
      userId,

      type: {
        $in: vitalTypes,
      },
    })
      .sort({
        recordedAt: -1,
      })
      .limit(100)
      .select(
        "type value unit source recordedAt"
      )
      .lean();


  return metrics;
}


/* =========================================================
   SLEEP TREND
========================================================= */

export async function getSleepTrend(
  userId,
  days = 7
) {
  const startDate = new Date();

  startDate.setDate(
    startDate.getDate() -
      Number(days)
  );

  startDate.setHours(
    0,
    0,
    0,
    0
  );

  return HealthMetric.find({
    userId,

    type: "SLEEP",

    recordedAt: {
      $gte: startDate,
    },
  })
    .sort({
      recordedAt: 1,
    })
    .select(
      "value unit recordedAt"
    );
}


/* =========================================================
   ACTIVITY TREND
========================================================= */

export async function getActivityTrend(
  userId,
  days = 7
) {
  const startDate = new Date();

  startDate.setDate(
    startDate.getDate() -
      Number(days)
  );

  startDate.setHours(
    0,
    0,
    0,
    0
  );

  return HealthMetric.find({
    userId,

    type: "STEPS",

    recordedAt: {
      $gte: startDate,
    },
  })
    .sort({
      recordedAt: 1,
    })
    .select(
      "value unit recordedAt"
    );
}