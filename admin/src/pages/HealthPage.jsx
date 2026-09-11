// src/pages/HealthPage.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlarmClock,
  Apple,
  Baby,
  BarChart3,
  BedDouble,
  BellRing,
  Brain,
  BrainCircuit,
  CalendarCheck,
  CalendarHeart,
  ChartNoAxesCombined,
  ClipboardPen,
  Clock3,
  Droplets,
  Dumbbell,
  FileText,
  FlaskConical,
  Flame,
  Footprints,
  Gauge,
  Heart,
  HeartPulse,
  Headphones,
  History,
  Lightbulb,
  LineChart,
  ListChecks,
  Moon,
  MoonStar,
  Percent,
  PersonStanding,
  Pill,
  Plus,
  Ruler,
  Route,
  Salad,
  Scale,
  Search,
  ShieldAlert,
  Smile,
  Sparkles,
  Star,
  Syringe,
  Target,
  TestTube,
  Thermometer,
  Timer,
  TriangleAlert,
  Utensils,
  Volume2,
  Waves,
  Wind,
  Zap,
  RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import "./HealthPage.css";



/* =========================================================
   HEALTH MODULES
========================================================= */

const healthModules = [
  {
    number: "01",
    category: "vitals",
    title: "Vital Signs Monitoring",
    description:
      "Monitor essential health measurements and vital signs.",
    icon: HeartPulse,
    route: "/health/vital-signs",
    features: [
      {
        title: "Heart Rate",
        description: "Monitor heart rate measurements.",
        icon: HeartPulse,
      },
      {
        title: "Blood Oxygen",
        description: "Track SpO₂ levels.",
        icon: Waves,
      },
      {
        title: "Respiratory Rate",
        description: "Monitor breathing rate.",
        icon: Wind,
      },
      {
        title: "Body Temperature",
        description: "Track body temperature.",
        icon: Thermometer,
      },
      {
        title: "Blood Pressure",
        description: "Track blood pressure readings.",
        icon: Gauge,
      },
      {
        title: "Stress Level",
        description: "Monitor stress-related measurements.",
        icon: Brain,
      },
      {
        title: "Hydration",
        description: "Track hydration information.",
        icon: Droplets,
      },
      {
        title: "Irregular Heart Rhythm",
        description: "Monitor irregular rhythm detection.",
        icon: Heart,
      },
    ],
  },

  {
    number: "02",
    category: "vitals",
    title: "Health Metrics & Body Composition",
    description:
      "Track body measurements and important health metrics.",
    icon: Ruler,
    route: "/health/body-composition",
    features: [
      {
        title: "Weight Tracking",
        description: "Track body weight over time.",
        icon: Scale,
      },
      {
        title: "BMI",
        description: "Track body mass index.",
        icon: Ruler,
      },
      {
        title: "Body Fat",
        description: "Monitor body fat measurements.",
        icon: Percent,
      },
      {
        title: "Muscle Mass",
        description: "Track muscle mass measurements.",
        icon: PersonStanding,
      },
      {
        title: "Body Measurements",
        description: "Track important body measurements.",
        icon: Ruler,
      },
      {
        title: "Body Composition Trends",
        description: "Understand body composition changes.",
        icon: LineChart,
      },
    ],
  },

  {
    number: "03",
    category: "wellness",
    title: "Health Monitoring & Alerts",
    description:
      "Monitor health patterns and receive important alerts.",
    icon: ShieldAlert,
    route: "/health/monitoring-alerts",
    features: [
      {
        title: "Health Alerts",
        description:
          "Receive alerts for important health changes.",
        icon: BellRing,
      },
      {
        title: "Abnormal Reading Detection",
        description:
          "Identify unusual health readings.",
        icon: TriangleAlert,
      },
      {
        title: "Health Trends",
        description:
          "Track health measurements over time.",
        icon: LineChart,
      },
      {
        title: "Threshold Monitoring",
        description:
          "Monitor health values against thresholds.",
        icon: Gauge,
      },
      {
        title: "Health Notifications",
        description:
          "Receive important health notifications.",
        icon: BellRing,
      },
    ],
  },

  {
    number: "04",
    category: "fitness",
    title: "Fitness & Activity Tracking",
    description:
      "Track daily movement, activity levels and physical activity.",
    icon: Footprints,
    route: "/health/fitness-activity",
    features: [
      {
        title: "Step Tracking",
        description: "Track daily steps.",
        icon: Footprints,
      },
      {
        title: "Distance Tracking",
        description:
          "Track walking and running distance.",
        icon: Route,
      },
      {
        title: "Calories Burned",
        description:
          "Track calories burned through activity.",
        icon: Flame,
      },
      {
        title: "Active Minutes",
        description:
          "Track active minutes throughout the day.",
        icon: Timer,
      },
      {
        title: "Activity Levels",
        description:
          "Understand daily activity levels.",
        icon: Activity,
      },
      {
        title: "Daily Movement",
        description:
          "Understand daily movement patterns.",
        icon: PersonStanding,
      },
    ],
  },

  {
    number: "05",
    category: "fitness",
    title: "Workout Intelligence",
    description:
      "Analyze workouts, performance and exercise progress.",
    icon: Dumbbell,
    route: "/health/workout-intelligence",
    features: [
      {
        title: "Workout Tracking",
        description:
          "Track completed workouts and exercise sessions.",
        icon: Dumbbell,
      },
      {
        title: "Workout Performance",
        description:
          "Monitor workout performance and progress.",
        icon: BarChart3,
      },
      {
        title: "Workout History",
        description:
          "Review previous workout sessions.",
        icon: CalendarCheck,
      },
      {
        title: "Exercise Intensity",
        description:
          "Monitor exercise intensity.",
        icon: Zap,
      },
      {
        title: "Workout Goals",
        description:
          "Set and monitor workout goals.",
        icon: Target,
      },
      {
        title: "Workout Insights",
        description:
          "Understand workout patterns and trends.",
        icon: ListChecks,
      },
    ],
  },

  {
    number: "06",
    category: "sleep",
    title: "Sleep Intelligence",
    description:
      "Analyze sleep patterns, quality and intelligent sleep insights.",
    icon: MoonStar,
    route: "/health/sleep-intelligence",
    features: [
      {
        title: "Sleep Duration",
        description:
          "Track total sleep duration.",
        icon: Clock3,
      },
      {
        title: "Sleep Quality",
        description:
          "Monitor overall sleep quality.",
        icon: Star,
      },
      {
        title: "Sleep Score",
        description:
          "Evaluate sleep using an overall score.",
        icon: MoonStar,
      },
      {
        title: "REM Sleep Analysis",
        description:
          "Analyze REM sleep patterns.",
        icon: Moon,
      },
      {
        title: "Light Sleep Analysis",
        description:
          "Track light sleep stages.",
        icon: Moon,
      },
      {
        title: "Deep Sleep Analysis",
        description:
          "Analyze deep sleep duration.",
        icon: BedDouble,
      },
      {
        title: "Sleep Efficiency",
        description:
          "Measure sleep efficiency.",
        icon: Activity,
      },
      {
        title: "Snoring Detection",
        description:
          "Detect and monitor snoring patterns.",
        icon: Volume2,
      },
      {
        title: "Sleep Apnea Risk Detection",
        description:
          "Identify potential sleep apnea risk indicators.",
        icon: ShieldAlert,
      },
      {
        title: "Smart Wake Suggestions",
        description:
          "Suggest suitable wake-up times.",
        icon: AlarmClock,
      },
    ],
  },

  {
    number: "07",
    category: "nutrition",
    title: "Nutrition Management",
    description:
      "Track meals, calories, nutrients, water and nutrition goals.",
    icon: Apple,
    route: "/health/nutrition",
    features: [
      {
        title: "Meal Tracking",
        description:
          "Track meals and food intake.",
        icon: Utensils,
      },
      {
        title: "Calorie Tracking",
        description:
          "Track daily calorie intake.",
        icon: Flame,
      },
      {
        title: "Macronutrient Tracking",
        description:
          "Monitor macronutrient intake.",
        icon: ChartNoAxesCombined,
      },
      {
        title: "Protein Tracking",
        description:
          "Track daily protein intake.",
        icon: Dumbbell,
      },
      {
        title: "Water Tracking",
        description:
          "Monitor daily water intake.",
        icon: Droplets,
      },
      {
        title: "Vitamin Tracking",
        description:
          "Track vitamin intake.",
        icon: Salad,
      },
      {
        title: "Nutrition Goals",
        description:
          "Set and monitor nutrition goals.",
        icon: Target,
      },
    ],
  },

  {
    number: "08",
    category: "medical",
    title: "Medication Management",
    description:
      "Manage medications, reminders, doses and refills.",
    icon: Pill,
    route: "/health/medication-management",
    features: [
      {
        title: "Medications",
        description:
          "Manage medication information.",
        icon: Pill,
      },
      {
        title: "Medication Reminders",
        description:
          "Set medication reminders.",
        icon: BellRing,
      },
      {
        title: "Dose Tracking",
        description:
          "Track medication doses.",
        icon: ClipboardPen,
      },
      {
        title: "Refill Tracking",
        description:
          "Track medication refills.",
        icon: Pill,
      },
      {
        title: "Missed Doses",
        description:
          "Track missed doses.",
        icon: TriangleAlert,
      },
      {
        title: "Medication History",
        description:
          "Review medication history.",
        icon: History,
      },
    ],
  },

  {
    number: "09",
    category: "medical",
    title: "Medical Records & Reports",
    description:
      "Store and manage medical history, prescriptions and reports.",
    icon: FileText,
    route: "/health/medical-records",
    features: [
      {
        title: "Medical History",
        description:
          "Store and manage medical history.",
        icon: FileText,
      },
      {
        title: "Prescriptions",
        description:
          "Store prescription information.",
        icon: Pill,
      },
      {
        title: "Medical Reports",
        description:
          "Store medical reports.",
        icon: FileText,
      },
      {
        title: "Vaccinations",
        description:
          "Manage vaccination information.",
        icon: Syringe,
      },
      {
        title: "Doctor Visits",
        description:
          "Manage doctor visit information.",
        icon: CalendarCheck,
      },
    ],
  },

  {
    number: "10",
    category: "medical",
    title: "Laboratory Monitoring",
    description:
      "Monitor glucose, cholesterol, vitamins and kidney function.",
    icon: FlaskConical,
    route: "/health/laboratory-monitoring",
    features: [
      {
        title: "Glucose",
        description:
          "Monitor laboratory glucose results.",
        icon: TestTube,
      },
      {
        title: "Cholesterol",
        description:
          "Track cholesterol results.",
        icon: FlaskConical,
      },
      {
        title: "Vitamin Levels",
        description:
          "Monitor vitamin laboratory results.",
        icon: TestTube,
      },
      {
        title: "Kidney Function",
        description:
          "Track kidney function results.",
        icon: FlaskConical,
      },
      {
        title: "Laboratory History",
        description:
          "Review previous laboratory results.",
        icon: History,
      },
      {
        title: "Lab Trends",
        description:
          "Understand laboratory trends.",
        icon: LineChart,
      },
    ],
  },

  {
    number: "11",
    category: "wellness",
    title: "Women's Health Tracking",
    description:
      "Track cycles, ovulation, fertility and pregnancy information.",
    icon: CalendarHeart,
    route: "/health/womens-health",
    features: [
      {
        title: "Menstrual Cycle Tracking",
        description:
          "Track menstrual cycles.",
        icon: CalendarHeart,
      },
      {
        title: "Cycle Predictions",
        description:
          "Predict upcoming cycles.",
        icon: CalendarCheck,
      },
      {
        title: "Ovulation Tracking",
        description:
          "Track estimated ovulation.",
        icon: CalendarHeart,
      },
      {
        title: "Fertility Tracking",
        description:
          "Track fertility information.",
        icon: Heart,
      },
      {
        title: "Pregnancy Tracking",
        description:
          "Track pregnancy information.",
        icon: Baby,
      },
      {
        title: "Women's Health Insights",
        description:
          "Understand women's health patterns.",
        icon: Sparkles,
      },
    ],
  },

  {
    number: "12",
    category: "wellness",
    title: "Mental Health & Wellness",
    description:
      "Track mood, stress, mindfulness and emotional wellness.",
    icon: BrainCircuit,
    route: "/health/mental-health-wellness",
    features: [
      {
        title: "Mood Tracking",
        description:
          "Track daily mood.",
        icon: Smile,
      },
      {
        title: "Stress Tracking",
        description:
          "Monitor stress levels.",
        icon: Brain,
      },
      {
        title: "Mindfulness",
        description:
          "Track mindfulness activities.",
        icon: BrainCircuit,
      },
      {
        title: "Meditation",
        description:
          "Track meditation sessions.",
        icon: Headphones,
      },
      {
        title: "Emotional Wellness",
        description:
          "Understand emotional wellness patterns.",
        icon: Heart,
      },
      {
        title: "Mental Wellness Insights",
        description:
          "Receive wellness insights.",
        icon: Lightbulb,
      },
    ],
  },

  {
    number: "13",
    category: "goals",
    title: "Health Goals & Personalized Recommendations",
    description:
      "Set health goals, monitor progress and receive recommendations.",
    icon: Target,
    route: "/health/goals-recommendations",
    features: [
      {
        title: "Health Goals",
        description:
          "Set personal health goals.",
        icon: Target,
      },
      {
        title: "Goal Progress",
        description:
          "Monitor progress toward goals.",
        icon: LineChart,
      },
      {
        title: "Personalized Recommendations",
        description:
          "Receive personalized recommendations.",
        icon: Sparkles,
      },
      {
        title: "Health Insights",
        description:
          "Understand health data through insights.",
        icon: Lightbulb,
      },
      {
        title: "Health Trends",
        description:
          "Identify important health trends.",
        icon: LineChart,
      },
      {
        title: "Progress Reports",
        description:
          "Review health progress.",
        icon: BarChart3,
      },
    ],
  },
];


/* =========================================================
   SUMMARY DEFINITIONS
========================================================= */

const summaryDefinitions = [
  {
    key: "heartRate",
    title: "Heart Rate",
    unit: "bpm",
    subtitle: "Latest reading",
    icon: HeartPulse,
  },
  {
    key: "sleepScore",
    title: "Sleep Score",
    unit: "/100",
    subtitle: "Last sleep",
    icon: MoonStar,
  },
  {
    key: "steps",
    title: "Steps",
    unit: "steps",
    subtitle: "Latest activity",
    icon: Footprints,
  },
  {
    key: "weight",
    title: "Weight",
    unit: "kg",
    subtitle: "Latest reading",
    icon: Scale,
  },
];


/* =========================================================
   HELPERS
========================================================= */

function getResponseData(response) {
  return response?.data ?? {};
}


function getRecords(response) {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data;
  }

  const possibleKeys = [
    "metrics",
    "sleep",
    "entries",
    "records",
    "readings",
    "data",
    "workouts",
    "activities",
    "medications",
    "results",
    "goals",
  ];

  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}


function getValue(record) {
  if (!record) {
    return null;
  }

  const possibleValues = [
    record.value,
    record.numericValue,
    record.result,
    record.score,
    record.currentValue,
    record.progress,
  ];

  for (const value of possibleValues) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}


function getNumber(record) {
  const value = getValue(record);

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function getDate(record) {
  return (
    record?.recordedAt ||
    record?.createdAt ||
    record?.recordDate ||
    record?.date ||
    record?.updatedAt ||
    null
  );
}


function getTime(record) {
  const date = getDate(record);

  if (!date) {
    return 0;
  }

  const time = new Date(date).getTime();

  return Number.isFinite(time)
    ? time
    : 0;
}


/*
 * Supports all module naming conventions.
 *
 * IMPORTANT FOR SLEEP:
 * SleepIntelligence records use:
 *
 * feature: "SLEEP_SCORE"
 *
 * not featureType.
 */
function getFeatureType(record) {
  return String(
    record?.featureType ||
    record?.feature ||
    record?.type ||
    record?.goalType ||
    ""
  ).toUpperCase();
}


function latestRecord(records, matcher) {
  const matching = records
    .filter(matcher)
    .sort(
      (a, b) =>
        getTime(b) - getTime(a)
    );

  return matching[0] || null;
}


function findMetric(records, types) {
  const allowed = new Set(
    types.map((type) =>
      String(type).toUpperCase()
    )
  );

  return latestRecord(
    records,
    (record) =>
      allowed.has(
        String(
          record?.type ||
          record?.featureType ||
          record?.feature ||
          ""
        ).toUpperCase()
      )
  );
}


function formatValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "--";
  }

  const number = Number(value);

  if (Number.isFinite(number)) {
    if (Number.isInteger(number)) {
      return String(number);
    }

    return number
      .toFixed(1)
      .replace(/\.0$/, "");
  }

  return String(value);
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({ item, value }) {
  const Icon = item.icon;

  return (
    <div className="summary-card">
      <div className="summary-icon">
        <Icon size={20} />
      </div>

      <div>
        <span>
          {item.title}
        </span>

        <strong>
          {formatValue(value)}

          {item.unit && (
            <small className="health-summary-unit">
              {item.unit}
            </small>
          )}
        </strong>

        <small>
          {item.subtitle}
        </small>
      </div>
    </div>
  );
}


/* =========================================================
   HEALTH MODULE CARD
========================================================= */

function HealthModuleCard({
  module,
  onClick,
}) {
  const Icon = module.icon;

  return (
    <button
      type="button"
      className="health-module-card"
      onClick={onClick}
    >
      <div className="health-module-card__top">
        <div className="health-module-card__icon">
          <Icon size={20} />
        </div>

        <span className="health-module-card__number">
          {module.number}
        </span>
      </div>

      <div className="health-module-card__content">
        <h3>
          {module.title}
        </h3>

        <p>
          {module.description}
        </p>
      </div>

      <div className="health-module-card__footer">
        <span>
          {module.features.length} features
        </span>

        <span className="health-module-card__arrow">
          →
        </span>
      </div>
    </button>
  );
}


/* =========================================================
   HEALTH OVERVIEW
========================================================= */

function HealthOverviewPanel({
  summary,
  wellnessValue,
  healthScore,
}) {
  return (
    <aside className="health-overview-panel">

      <span className="health-panel-kicker">
        OVERVIEW
      </span>

      <h2>
        Health Overview
      </h2>

      <p>
        Your latest health information from the
        connected health modules.
      </p>


      <div className="health-overview-circle">
        <div>

          <strong>
            {healthScore !== null
              ? formatValue(healthScore)
              : "--"}
          </strong>

          <span>
            Health Score
          </span>

        </div>
      </div>


      <div className="health-overview-stats">

        <div>
          <span>
            Vitals
          </span>

          <strong>
            {summary.heartRate !== null
              ? `${formatValue(summary.heartRate)} bpm`
              : "--"}
          </strong>
        </div>


        <div>
          <span>
            Activity
          </span>

          <strong>
            {summary.steps !== null
              ? `${formatValue(summary.steps)}`
              : "--"}
          </strong>
        </div>


        <div>
          <span>
            Sleep
          </span>

          <strong>
            {summary.sleepScore !== null
              ? `${formatValue(summary.sleepScore)}/100`
              : "--"}
          </strong>
        </div>


        <div>
          <span>
            Wellness
          </span>

          <strong>
            {wellnessValue !== null
              ? formatValue(wellnessValue)
              : "--"}
          </strong>
        </div>

      </div>

    </aside>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function HealthPage() {

  const navigate = useNavigate();


  const [activeTab, setActiveTab] =
    useState("all");


  const [search, setSearch] =
    useState("");


  const [loading, setLoading] =
    useState(true);


  const [refreshing, setRefreshing] =
    useState(false);


  const [pageError, setPageError] =
    useState("");


  const [healthMetrics, setHealthMetrics] =
    useState([]);


  const [sleepData, setSleepData] =
    useState([]);


  const [fitnessData, setFitnessData] =
    useState([]);


  const [workoutData, setWorkoutData] =
    useState([]);


  const [nutritionData, setNutritionData] =
    useState([]);


  const [medicationData, setMedicationData] =
    useState([]);


  const [medicalRecords, setMedicalRecords] =
    useState([]);


  const [laboratoryData, setLaboratoryData] =
    useState([]);


  const [womensHealthData, setWomensHealthData] =
    useState([]);


  const [mentalHealthData, setMentalHealthData] =
    useState([]);


  const [goalsData, setGoalsData] =
    useState([]);


  /*
   * IMPORTANT:
   * Health Score is now loaded from the database.
   *
   * It is NOT calculated in this component.
   */
  const [healthScore, setHealthScore] =
    useState(null);


  /* =======================================================
     LOAD HEALTH DATA
  ======================================================= */

  const loadHealthData = useCallback(
    async (showRefresh = false) => {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");


      const requests = [

        {
          name: "health",
          request: api.get(
            "/health/metrics"
          ),
        },

        {
          name: "sleep",
          request: api.get(
            "/sleep-intelligence"
          ),
        },

        {
          name: "fitness",
          request: api.get(
            "/fitness-activity"
          ),
        },

        {
          name: "workout",
          request: api.get(
            "/workout-intelligence"
          ),
        },

        {
          name: "nutrition",
          request: api.get(
            "/nutrition-management"
          ),
        },

        {
          name: "medication",
          request: api.get(
            "/medication-management"
          ),
        },

        {
          name: "medical",
          request: api.get(
            "/medical-records"
          ),
        },

        {
          name: "laboratory",
          request: api.get(
            "/laboratory-monitoring"
          ),
        },

        {
          name: "womens",
          request: api.get(
            "/womens-health"
          ),
        },

        {
          name: "mental",
          request: api.get(
            "/mental-health-wellness"
          ),
        },

        {
          name: "goals",
          request: api.get(
            "/health-goals"
          ),
        },

      ];


      const results =
        await Promise.allSettled(
          requests.map(
            (item) => item.request
          )
        );


      let successfulRequests = 0;


      results.forEach(
        (result, index) => {

          if (
            result.status !==
            "fulfilled"
          ) {
            return;
          }


          successfulRequests += 1;


          const records =
            getRecords(
              result.value
            );


          switch (
            requests[index].name
          ) {

            case "health":
              setHealthMetrics(
                records
              );
              break;


            case "sleep":
              setSleepData(
                records
              );
              break;


            case "fitness":
              setFitnessData(
                records
              );
              break;


            case "workout":
              setWorkoutData(
                records
              );
              break;


            case "nutrition":
              setNutritionData(
                records
              );
              break;


            case "medication":
              setMedicationData(
                records
              );
              break;


            case "medical":
              setMedicalRecords(
                records
              );
              break;


            case "laboratory":
              setLaboratoryData(
                records
              );
              break;


            case "womens":
              setWomensHealthData(
                records
              );
              break;


            case "mental":
              setMentalHealthData(
                records
              );
              break;


            case "goals":
              setGoalsData(
                records
              );
              break;


            default:
              break;
          }

        }
      );


      if (
        successfulRequests === 0
      ) {
        setPageError(
          "Unable to load health data."
        );
      }


      setLoading(false);
      setRefreshing(false);

    },
    []
  );


  /* =======================================================
     LOAD HEALTH SCORE FROM DATABASE
  ======================================================= */

  const loadHealthScore =
    useCallback(
      async () => {

        try {

          const response =
            await api.get(
              "/health-score"
            );


          const data =
            response?.data ?? {};


          const score =
            data?.score ??
            data?.healthScore ??
            null;


          if (
            score === null ||
            score === undefined ||
            score === ""
          ) {
            setHealthScore(null);
            return;
          }


          const numericScore =
            Number(score);


          if (
            Number.isFinite(
              numericScore
            )
          ) {
            setHealthScore(
              numericScore
            );
          } else {
            setHealthScore(null);
          }

        } catch (error) {

          console.error(
            "Failed to load health score:",
            error
          );

          setHealthScore(null);
        }

      },
      []
    );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadHealthData();
    loadHealthScore();
  }, [
    loadHealthData,
    loadHealthScore,
  ]);


  /* =======================================================
     WELLNESS VALUE
  ======================================================= */

  const wellnessValue =
    useMemo(() => {

      const mentalRecord =
        latestRecord(
          mentalHealthData,
          (record) =>
            [
              "MOOD_TRACKING",
              "STRESS_TRACKING",
              "EMOTIONAL_WELLNESS",
              "MENTAL_WELLNESS_INSIGHTS",
            ].includes(
              getFeatureType(record)
            )
        );


      if (mentalRecord) {
        return getValue(
          mentalRecord
        );
      }


      const goalRecord =
        latestRecord(
          goalsData,
          () => true
        );


      if (goalRecord) {
        return getNumber(
          goalRecord
        );
      }


      return null;

    }, [
      mentalHealthData,
      goalsData,
    ]);


  /* =======================================================
     SUMMARY VALUES
  ======================================================= */

  const summary =
    useMemo(() => {

      const heartRateRecord =
        findMetric(
          healthMetrics,
          ["HEART_RATE"]
        );


      const stepsRecord =
        findMetric(
          [
            ...healthMetrics,
            ...fitnessData,
          ],
          [
            "STEPS",
            "STEP_TRACKING",
            "DAILY_STEPS",
          ]
        );


      const weightRecord =
        findMetric(
          healthMetrics,
          ["WEIGHT"]
        );


      /*
       * Sleep Score comes from SleepIntelligence.
       */
      const sleepScoreRecord =
        latestRecord(
          sleepData,
          (record) =>
            [
              "SLEEP_SCORE",
              "SLEEP-SCORE",
              "SLEEP_SCORE_TRACKING",
            ].includes(
              getFeatureType(record)
            )
        );


      return {

        heartRate:
          getNumber(
            heartRateRecord
          ),

        steps:
          getNumber(
            stepsRecord
          ),

        weight:
          getNumber(
            weightRecord
          ),

        sleepScore:
          getNumber(
            sleepScoreRecord
          ),

      };

    }, [
      healthMetrics,
      fitnessData,
      sleepData,
    ]);


  /* =======================================================
     TABS
  ======================================================= */

  const tabs = [

    {
      value: "all",
      label: "All",
      count:
        healthModules.length,
    },

    {
      value: "vitals",
      label: "Vitals",
      count:
        healthModules.filter(
          (module) =>
            module.category ===
            "vitals"
        ).length,
    },

    {
      value: "fitness",
      label: "Fitness",
      count:
        healthModules.filter(
          (module) =>
            module.category ===
            "fitness"
        ).length,
    },

    {
      value: "nutrition",
      label: "Nutrition",
      count:
        healthModules.filter(
          (module) =>
            module.category ===
            "nutrition"
        ).length,
    },

    {
      value: "sleep",
      label: "Sleep",
      count:
        healthModules.filter(
          (module) =>
            module.category ===
            "sleep"
        ).length,
    },

    {
      value: "wellness",
      label: "Wellness",
      count:
        healthModules.filter(
          (module) =>
            module.category ===
            "wellness"
        ).length,
    },

  ];


  /* =======================================================
     FILTERED MODULES
  ======================================================= */

  const filteredModules =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return healthModules.filter(
        (module) => {

          const matchesTab =
            activeTab === "all" ||
            module.category ===
            activeTab;


          const matchesSearch =
            !query ||
            module.title
              .toLowerCase()
              .includes(query) ||
            module.description
              .toLowerCase()
              .includes(query) ||
            module.features.some(
              (feature) =>
                feature.title
                  .toLowerCase()
                  .includes(query) ||
                feature.description
                  .toLowerCase()
                  .includes(query)
            );


          return (
            matchesTab &&
            matchesSearch
          );

        }
      );

    }, [
      activeTab,
      search,
    ]);


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const handleClear = () => {
    setSearch("");
    setActiveTab("all");
  };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {

    loadHealthData(true);
    loadHealthScore();

  };


  /* =======================================================
     ADD HEALTH DATA
  ======================================================= */

  const handleAddHealthData = () => {

    navigate(
      "/health/vital-signs"
    );

  };


  /* =======================================================
     MODULE CLICK
  ======================================================= */

  const handleModuleClick =
    (module) => {

      if (module.route) {

        navigate(
          module.route
        );

      }

    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="health-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="health-notifications-hero">

        <div className="notifications-hero__content">

          <div className="notifications-eyebrow">

            <HeartPulse size={14} />

            Health Overview

          </div>


          <h1>
            Health
          </h1>


          <p>
            Track, understand and manage your health
            and wellness from one place.
          </p>

        </div>


        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "health-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>


          <button
            type="button"
            className="create-notification-btn"
            onClick={handleAddHealthData}
          >

            <Plus size={16} />

            Add Health Data

          </button>

        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {pageError && (

        <div
          className="health-error-message"
          style={{
            marginBottom: "18px",
            padding: "12px 15px",
            borderRadius: "10px",
            background: "#fff1f1",
            border:
              "1px solid #ffd2d2",
            color: "#b42318",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >

          {pageError}

        </div>

      )}


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">

        {summaryDefinitions.map(
          (item) => (

            <SummaryCard
              key={item.key}
              item={item}
              value={
                summary[
                  item.key
                ]
              }
            />

          )
        )}

      </div>


      {/* =====================================================
          TABS
      ===================================================== */}

      <div className="health-tabs">

        {tabs.map(
          (tab) => (

            <button
              key={tab.value}
              type="button"
              className={`notification-tab ${
                activeTab ===
                tab.value
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab(
                  tab.value
                )
              }
            >

              {tab.label}

              <span>
                {tab.count}
              </span>

            </button>

          )
        )}

      </div>


      {/* =====================================================
          CONTENT GRID
      ===================================================== */}

      <div className="health-content-grid">

        {/* ===================================================
            MAIN CARD
        =================================================== */}

        <section className="health-main-card">

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="health-main-toolbar">

            <div className="health-search">

              <Search size={17} />

              <input
                type="text"
                value={search}
                placeholder="Search health features..."
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>


            <button
              type="button"
              className="health-clear-btn"
              onClick={handleClear}
            >

              Clear Filters

            </button>

          </div>


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="health-main-header">

            <div>

              <span className="section-kicker">
                HEALTH MANAGEMENT
              </span>


              <h2>
                Your Health
              </h2>


              <p>
                Explore and manage different areas
                of your health and wellness.
              </p>

            </div>


            <div className="health-history-icon">

              <HeartPulse size={21} />

            </div>

          </div>


          {/* =================================================
              MODULES
          ================================================= */}

          <div className="health-modules-grid">

            {filteredModules.length === 0 ? (

              <div
                className="health-empty-state"
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >

                <Activity size={30} />

                <div>
                  No health modules found
                </div>

                <small>
                  Try changing your search
                  or filter.
                </small>

              </div>

            ) : (

              filteredModules.map(
                (module) => (

                  <HealthModuleCard
                    key={
                      module.number
                    }
                    module={
                      module
                    }
                    onClick={() =>
                      handleModuleClick(
                        module
                      )
                    }
                  />

                )
              )

            )}

          </div>

        </section>


        {/* ===================================================
            OVERVIEW
        =================================================== */}

        <HealthOverviewPanel
          summary={summary}
          wellnessValue={
            wellnessValue
          }
          healthScore={
            healthScore
          }
        />

      </div>

    </div>

  );
}