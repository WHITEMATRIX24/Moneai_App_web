import { useMemo, useState } from "react";

import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  Check,
  Clock3,
  History,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  TriangleAlert,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import "./MedicationManagementPage.css";



/* =========================================================
   MEDICATION DEFINITIONS
========================================================= */

const medicationFeatures = [
  {
    id: "medications",
    title: "Medications",
    description:
      "Manage your medications and medication information.",
    icon: Pill,
  },
  {
    id: "medication-reminders",
    title: "Medication Reminders",
    description:
      "Set and manage reminders for medications.",
    icon: BellRing,
  },
  {
    id: "dose-tracking",
    title: "Dose Tracking",
    description:
      "Track medication doses and scheduled intake.",
    icon: Check,
  },
  {
    id: "refill-tracking",
    title: "Refill Tracking",
    description:
      "Track medication refills and refill requirements.",
    icon: RefreshCw,
  },
  {
    id: "missed-doses",
    title: "Missed Doses",
    description:
      "Track missed medication doses.",
    icon: TriangleAlert,
  },
  {
    id: "medication-history",
    title: "Medication History",
    description:
      "Review medication history and previous medication activity.",
    icon: History,
  },
];


/* =========================================================
   PAGE
========================================================= */

export default function MedicationManagementPage() {

  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState("overview");

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [selectedFeature, setSelectedFeature] =
    useState(null);

  const [medications, setMedications] =
    useState([]);

  const [medicationName, setMedicationName] =
    useState("");

  const [dosage, setDosage] =
    useState("");

  const [frequency, setFrequency] =
    useState("Once daily");

  const [time, setTime] =
    useState("09:00");

  const [startDate, setStartDate] =
    useState("");

  const [refillDate, setRefillDate] =
    useState("");


  /* =======================================================
     FILTER
  ======================================================= */

  const filteredMedications =
    useMemo(() => {

      const query =
        search.trim().toLowerCase();

      if (!query) {
        return medications;
      }

      return medications.filter(
        (medication) =>
          medication.name
            .toLowerCase()
            .includes(query) ||
          medication.dosage
            .toLowerCase()
            .includes(query) ||
          medication.frequency
            .toLowerCase()
            .includes(query)
      );

    }, [medications, search]);


  /* =======================================================
     OPEN ADD MEDICATION
  ======================================================= */

  const openAddMedication = () => {

    setSelectedFeature(null);

    setMedicationName("");
    setDosage("");
    setFrequency("Once daily");
    setTime("09:00");
    setStartDate("");
    setRefillDate("");

    setShowModal(true);

  };


  /* =======================================================
     OPEN FEATURE
  ======================================================= */

  const handleFeatureClick = (feature) => {

    setSelectedFeature(feature);
    setActiveTab("feature");

  };


  /* =======================================================
     SAVE MEDICATION
  ======================================================= */

  const handleSaveMedication = () => {

    if (!medicationName.trim()) {

      alert(
        "Please enter a medication name."
      );

      return;

    }

    if (!dosage.trim()) {

      alert(
        "Please enter the dosage."
      );

      return;

    }


    const newMedication = {

      id:
        Date.now(),

      name:
        medicationName.trim(),

      dosage:
        dosage.trim(),

      frequency,

      time,

      startDate:
        startDate || "Not specified",

      refillDate:
        refillDate || "Not specified",

      status:
        "Active",

      takenToday:
        false,

    };


    setMedications(
      (previous) => [
        ...previous,
        newMedication,
      ]
    );


    setShowModal(false);

  };


  /* =======================================================
     MARK DOSE
  ======================================================= */

  const handleDoseToggle = (id) => {

    setMedications(
      (previous) =>
        previous.map(
          (medication) =>
            medication.id === id
              ? {
                  ...medication,
                  takenToday:
                    !medication.takenToday,
                }
              : medication
        )
    );

  };


  /* =======================================================
     DELETE
  ======================================================= */

  const handleDeleteMedication = (id) => {

    const confirmed =
      window.confirm(
        "Remove this medication?"
      );

    if (!confirmed) {
      return;
    }

    setMedications(
      (previous) =>
        previous.filter(
          (medication) =>
            medication.id !== id
        )
    );

  };


  /* =======================================================
     FEATURE DATA
  ======================================================= */

  const featureStats = {

    "medications": {
      title: "Medications",
      description:
        "Manage your current medications and medication information.",
      icon: Pill,
    },

    "medication-reminders": {
      title: "Medication Reminders",
      description:
        "Keep track of scheduled medication reminders.",
      icon: BellRing,
    },

    "dose-tracking": {
      title: "Dose Tracking",
      description:
        "Track scheduled and completed medication doses.",
      icon: Check,
    },

    "refill-tracking": {
      title: "Refill Tracking",
      description:
        "Keep track of upcoming medication refills.",
      icon: RefreshCw,
    },

    "missed-doses": {
      title: "Missed Doses",
      description:
        "Review medication doses that were not recorded as taken.",
      icon: TriangleAlert,
    },

    "medication-history": {
      title: "Medication History",
      description:
        "Review your medication activity and history.",
      icon: History,
    },

  };


  /* =======================================================
     RESET FEATURE
  ======================================================= */

  const handleBackOverview = () => {

    setSelectedFeature(null);
    setActiveTab("overview");

  };


  /* =======================================================
     PAGE
  ======================================================= */

  return (

    <div className="health-page health-vitals-page">


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="health-notifications-hero">

        <div className="notifications-hero__content">

          <button
            type="button"
            className="health-back-btn"
            onClick={() =>
              navigate("/health")
            }
          >

            <ArrowLeft size={16} />

            Back to Health

          </button>


          <div className="notifications-eyebrow">

            <Pill size={14} />

            Health · Medication Management

          </div>


          <h1>
            Medication Management
          </h1>


          <p>
            Manage medications, reminders, doses,
            refills and medication history in one place.
          </p>

        </div>


        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={() =>
              setSearch("")
            }
          >

            <RefreshCw size={16} />

            Refresh

          </button>


          <button
            type="button"
            className="create-notification-btn"
            onClick={openAddMedication}
          >

            <Plus size={16} />

            Add Medication

          </button>

        </div>

      </section>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">


        <div className="summary-card">

          <div className="summary-icon">
            <Pill size={20} />
          </div>

          <div>

            <span>
              Medications
            </span>

            <strong>
              {medications.length}
            </strong>

            <small>
              Active medications
            </small>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <BellRing size={20} />
          </div>

          <div>

            <span>
              Reminders
            </span>

            <strong>
              {medications.length}
            </strong>

            <small>
              Scheduled today
            </small>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <Check size={20} />
          </div>

          <div>

            <span>
              Doses Taken
            </span>

            <strong>
              {
                medications.filter(
                  (medication) =>
                    medication.takenToday
                ).length
              }
            </strong>

            <small>
              Recorded today
            </small>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <TriangleAlert size={20} />
          </div>

          <div>

            <span>
              Missed Doses
            </span>

            <strong>
              0
            </strong>

            <small>
              Requires attention
            </small>

          </div>

        </div>

      </div>


      {/* =====================================================
          TABS
      ===================================================== */}

      <div className="health-tabs">

        <button
          type="button"
          className={`notification-tab ${
            activeTab === "overview"
              ? "active"
              : ""
          }`}
          onClick={
            handleBackOverview
          }
        >

          Overview

          <span>
            1
          </span>

        </button>


        {medicationFeatures.map(
          (feature) => (

            <button
              key={feature.id}
              type="button"
              className={`notification-tab ${
                activeTab === feature.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleFeatureClick(
                  feature
                )
              }
            >

              {feature.title}

            </button>

          )
        )}

      </div>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="health-content-grid">


        {/* ===================================================
            MAIN CARD
        =================================================== */}

        <section className="health-main-card">


          {/* =================================================
              FEATURE VIEW
          ================================================= */}

          {activeTab === "feature" &&
          selectedFeature ? (

            <>

              <div className="health-main-header">

                <div>

                  <span className="section-kicker">
                    MEDICATION MANAGEMENT
                  </span>

                  <h2>
                    {selectedFeature.title}
                  </h2>

                  <p>
                    {selectedFeature.description}
                  </p>

                </div>


                <div className="health-history-icon">

                  {(() => {

                    const Icon =
                      selectedFeature.icon;

                    return (
                      <Icon size={21} />
                    );

                  })()}

                </div>

              </div>


              <div className="health-vitals-detail-grid">

                <div className="health-vital-detail-card">

                  <div className="health-vital-detail-card__top">

                    <div className="health-vital-detail-card__icon">

                      {(() => {

                        const Icon =
                          selectedFeature.icon;

                        return (
                          <Icon size={21} />
                        );

                      })()}

                    </div>

                  </div>


                  <div className="health-vital-detail-card__content">

                    <h3>
                      {selectedFeature.title}
                    </h3>

                    <p>
                      {selectedFeature.description}
                    </p>

                  </div>


                  <div className="health-vital-detail-card__reading">

                    <div>

                      <strong>
                        {selectedFeature.id ===
                        "medications"
                          ? medications.length
                          : "--"}
                      </strong>

                    </div>

                    <small>
                      No additional data available
                    </small>

                  </div>


                  <button
                    type="button"
                    className="health-vital-add-btn"
                    onClick={
                      openAddMedication
                    }
                  >

                    <Plus size={15} />

                    Add Medication

                  </button>

                </div>

              </div>


              <button
                type="button"
                className="health-clear-btn"
                onClick={
                  handleBackOverview
                }
                style={{
                  marginTop: "20px",
                }}
              >

                <ArrowLeft size={15} />

                Back to Overview

              </button>

            </>

          ) : (

            <>


              {/* =============================================
                  TOOLBAR
              ============================================= */}

              <div className="health-main-toolbar">

                <div className="health-search">

                  <Search size={17} />

                  <input
                    type="text"
                    value={search}
                    placeholder="Search medications..."
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
                  onClick={() =>
                    setSearch("")
                  }
                >

                  Clear

                </button>

              </div>


              {/* =============================================
                  HEADER
              ============================================= */}

              <div className="health-main-header">

                <div>

                  <span className="section-kicker">
                    MEDICATION MANAGEMENT
                  </span>

                  <h2>
                    Your Medications
                  </h2>

                  <p>
                    Manage your medications and
                    daily medication schedule.
                  </p>

                </div>


                <div className="health-history-icon">

                  <Pill size={21} />

                </div>

              </div>


              {/* =============================================
                  MEDICATION LIST
              ============================================= */}

              {filteredMedications.length === 0 ? (

                <div
                  style={{
                    padding:
                      "50px 20px",
                    textAlign:
                      "center",
                    color:
                      "#8797aa",
                  }}
                >

                  <Pill
                    size={38}
                    style={{
                      marginBottom:
                        "12px",
                      opacity:
                        0.65,
                    }}
                  />


                  <div
                    style={{
                      fontWeight:
                        800,
                      color:
                        "#19334f",
                      fontSize:
                        "16px",
                      marginBottom:
                        "6px",
                    }}
                  >
                    No medications added
                  </div>


                  <div
                    style={{
                      fontSize:
                        "12px",
                      marginBottom:
                        "20px",
                    }}
                  >
                    Add your first medication
                    to start tracking doses and reminders.
                  </div>


                  <button
                    type="button"
                    className="create-notification-btn"
                    onClick={
                      openAddMedication
                    }
                  >

                    <Plus size={16} />

                    Add Medication

                  </button>

                </div>

              ) : (

                <div
                  className="health-vitals-detail-grid"
                >

                  {filteredMedications.map(
                    (medication) => (

                      <div
                        key={
                          medication.id
                        }
                        className="health-vital-detail-card"
                      >

                        <div className="health-vital-detail-card__top">

                          <div className="health-vital-detail-card__icon">

                            <Pill
                              size={21}
                            />

                          </div>


                          <button
                            type="button"
                            className="health-vital-history-btn"
                            title="Remove medication"
                            onClick={() =>
                              handleDeleteMedication(
                                medication.id
                              )
                            }
                          >

                            <X
                              size={15}
                            />

                          </button>

                        </div>


                        <div className="health-vital-detail-card__content">

                          <h3>
                            {medication.name}
                          </h3>

                          <p>
                            {medication.dosage}
                            {" · "}
                            {medication.frequency}
                          </p>

                        </div>


                        <div className="health-vital-detail-card__reading">

                          <div>

                            <strong>
                              {medication.time}
                            </strong>

                          </div>

                          <small>
                            Scheduled time
                          </small>

                        </div>


                        <button
                          type="button"
                          className="health-vital-add-btn"
                          onClick={() =>
                            handleDoseToggle(
                              medication.id
                            )
                          }
                        >

                          <Check size={15} />

                          {medication.takenToday
                            ? "Dose Taken"
                            : "Mark Dose Taken"}

                        </button>

                      </div>

                    )
                  )}

                </div>

              )}

            </>

          )}

        </section>


        {/* ===================================================
            RIGHT OVERVIEW
        =================================================== */}

        <aside className="health-overview-panel">

          <span className="health-panel-kicker">
            OVERVIEW
          </span>


          <h2>
            Medication Overview
          </h2>


          <p>
            Keep your medication schedule organized
            and monitor your medication activity.
          </p>


          <div className="health-overview-circle">

            <div>

              <strong>
                {medications.length}
              </strong>

              <span>
                Medications
              </span>

            </div>

          </div>


          <div className="health-overview-stats">

            <div>

              <span>
                Active
              </span>

              <strong>
                {medications.length}
              </strong>

            </div>


            <div>

              <span>
                Taken
              </span>

              <strong>
                {
                  medications.filter(
                    (medication) =>
                      medication.takenToday
                  ).length
                }
              </strong>

            </div>


            <div>

              <span>
                Reminders
              </span>

              <strong>
                {medications.length}
              </strong>

            </div>


            <div>

              <span>
                Missed
              </span>

              <strong>
                0
              </strong>

            </div>

          </div>


          {/* ===============================================
              QUICK ACTIONS
          =============================================== */}

          <div
            style={{
              marginTop:
                "22px",
              display:
                "flex",
              flexDirection:
                "column",
              gap:
                "9px",
            }}
          >

            <button
              type="button"
              className="health-vital-add-btn"
              onClick={
                openAddMedication
              }
              style={{
                width:
                  "100%",
                justifyContent:
                  "center",
              }}
            >

              <Plus size={15} />

              Add Medication

            </button>


            <button
              type="button"
              className="health-clear-btn"
              onClick={() => {
                setSelectedFeature(
                  medicationFeatures[1]
                );
                setActiveTab(
                  "feature"
                );
              }}
              style={{
                width:
                  "100%",
                justifyContent:
                  "center",
              }}
            >

              <BellRing size={15} />

              Reminders

            </button>

          </div>

        </aside>

      </div>


      {/* =====================================================
          ADD MEDICATION MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="health-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="health-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* ===============================================
                HEADER
            =============================================== */}

            <div className="health-modal__header">

              <div>

                <span>
                  ADD MEDICATION
                </span>

                <h2>
                  New Medication
                </h2>

              </div>


              <button
                type="button"
                className="health-modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            {/* ===============================================
                BODY
            =============================================== */}

            <div className="health-modal__body">


              <label>
                Medication Name
              </label>

              <input
                type="text"
                value={
                  medicationName
                }
                placeholder="Enter medication name"
                onChange={(event) =>
                  setMedicationName(
                    event.target.value
                  )
                }
              />


              <label>
                Dosage
              </label>

              <input
                type="text"
                value={
                  dosage
                }
                placeholder="Example: 500 mg"
                onChange={(event) =>
                  setDosage(
                    event.target.value
                  )
                }
              />


              <label>
                Frequency
              </label>

              <select
                value={
                  frequency
                }
                onChange={(event) =>
                  setFrequency(
                    event.target.value
                  )
                }
              >

                <option>
                  Once daily
                </option>

                <option>
                  Twice daily
                </option>

                <option>
                  Three times daily
                </option>

                <option>
                  Every morning
                </option>

                <option>
                  Every evening
                </option>

                <option>
                  As needed
                </option>

              </select>


              <label>
                Reminder Time
              </label>

              <input
                type="time"
                value={
                  time
                }
                onChange={(event) =>
                  setTime(
                    event.target.value
                  )
                }
              />


              <label>
                Start Date
              </label>

              <input
                type="date"
                value={
                  startDate
                }
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
              />


              <label>
                Refill Date
              </label>

              <input
                type="date"
                value={
                  refillDate
                }
                onChange={(event) =>
                  setRefillDate(
                    event.target.value
                  )
                }
              />

            </div>


            {/* ===============================================
                FOOTER
            =============================================== */}

            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setShowModal(false)
                }
              >

                Cancel

              </button>


              <button
                type="button"
                className="health-modal-save"
                onClick={
                  handleSaveMedication
                }
              >

                <Check size={15} />

                Save Medication

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}