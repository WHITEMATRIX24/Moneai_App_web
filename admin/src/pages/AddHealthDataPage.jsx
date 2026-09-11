// src/pages/health/AddHealthDataPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Activity,
  HeartPulse,
  Scale,
  Footprints,
  MoonStar,
  Droplets,
  Dumbbell,
  Apple,
  Save,
} from "lucide-react";
import "./AddHealthDataPage.css";



/* =========================================================
   DATA TYPES
========================================================= */

const healthDataTypes = [
  {
    id: "heart-rate",
    title: "Heart Rate",
    description: "Add your latest heart rate reading.",
    unit: "bpm",
    icon: HeartPulse,
  },
  {
    id: "weight",
    title: "Weight",
    description: "Add your latest body weight.",
    unit: "kg",
    icon: Scale,
  },
  {
    id: "steps",
    title: "Steps",
    description: "Add today's step count.",
    unit: "steps",
    icon: Footprints,
  },
  {
    id: "sleep",
    title: "Sleep",
    description: "Add your sleep duration or score.",
    unit: "hours",
    icon: MoonStar,
  },
  {
    id: "water",
    title: "Water Intake",
    description: "Add your water intake.",
    unit: "ml",
    icon: Droplets,
  },
  {
    id: "workout",
    title: "Workout",
    description: "Add a workout or exercise session.",
    unit: "minutes",
    icon: Dumbbell,
  },
  {
    id: "nutrition",
    title: "Nutrition",
    description: "Add nutrition or calorie information.",
    unit: "kcal",
    icon: Apple,
  },
  {
    id: "activity",
    title: "Activity",
    description: "Add general physical activity.",
    unit: "minutes",
    icon: Activity,
  },
];


/* =========================================================
   PAGE
========================================================= */

export default function AddHealthDataPage() {

  const navigate = useNavigate();

  const [selectedType, setSelectedType] =
    useState(healthDataTypes[0]);

  const [value, setValue] =
    useState("");

  const [date, setDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 16)
    );


  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = () => {

    if (!value.trim()) {
      alert("Please enter a value.");
      return;
    }

    /*
      Frontend-only for now.

      Backend/database connection can be added later.
    */

    console.log("Health data:", {
      type: selectedType.id,
      value,
      date,
    });

    alert("Health data saved successfully.");

    setValue("");
  };


  return (
    <div className="health-page health-add-data-page">


      {/* ===================================================
          HERO
      =================================================== */}

      <section className="health-notifications-hero">

        <div className="notifications-hero__content">

          <button
            type="button"
            className="health-back-btn"
            onClick={() => navigate("/health")}
          >
            <ArrowLeft size={16} />
            Back to Health
          </button>

          <div className="notifications-eyebrow">

            <HeartPulse size={14} />

            Health · Add Data

          </div>

          <h1>
            Add Health Data
          </h1>

          <p>
            Add your health information and measurements
            manually.
          </p>

        </div>

      </section>


      {/* ===================================================
          MAIN CARD
      =================================================== */}

      <section className="health-main-card">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              HEALTH DATA
            </span>

            <h2>
              Add a Health Reading
            </h2>

            <p>
              Select the type of health information you
              want to record.
            </p>

          </div>

          <div className="health-history-icon">
            <Activity size={21} />
          </div>

        </div>


        {/* =================================================
            DATA TYPE GRID
        ================================================= */}

        <div
          className="health-modules-grid"
          style={{
            marginBottom: "28px",
          }}
        >

          {healthDataTypes.map((type) => {

            const Icon = type.icon;

            const active =
              selectedType.id === type.id;

            return (
              <button
                key={type.id}
                type="button"
                className="health-module-card"
                onClick={() =>
                  setSelectedType(type)
                }
                style={{
                  textAlign: "left",
                  border:
                    active
                      ? "2px solid #19334f"
                      : undefined,
                }}
              >

                <div className="health-module-card__top">

                  <div className="health-module-card__icon">
                    <Icon size={20} />
                  </div>

                </div>

                <div className="health-module-card__content">

                  <h3>
                    {type.title}
                  </h3>

                  <p>
                    {type.description}
                  </p>

                </div>

                <div className="health-module-card__footer">

                  <span>
                    Unit: {type.unit}
                  </span>

                  {active && (
                    <span>
                      Selected
                    </span>
                  )}

                </div>

              </button>
            );
          })}

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <div className="health-modal__body">

          <label htmlFor="health-data-value">
            {selectedType.title}
          </label>

          <input
            id="health-data-value"
            type="number"
            value={value}
            onChange={(event) =>
              setValue(event.target.value)
            }
            placeholder={`Enter value in ${selectedType.unit}`}
          />

          <small>
            Unit: {selectedType.unit}
          </small>


          <label htmlFor="health-data-date">
            Date & Time
          </label>

          <input
            id="health-data-date"
            type="datetime-local"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
          />

        </div>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="health-modal__footer">

          <button
            type="button"
            className="health-modal-cancel"
            onClick={() =>
              navigate("/health")
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="health-modal-save"
            onClick={handleSave}
          >

            <Save size={15} />

            Save Health Data

          </button>

        </div>

      </section>

    </div>
  );
}