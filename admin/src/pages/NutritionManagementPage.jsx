import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

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

import api from "../services/api.js";
import "./NutritionManagementPage.css";


const medicationFeatures = [
  {
    id: "medications",
    title: "Medications",
    description:
      "Manage your active medicines and prescriptions.",
    icon: Pill,
  },

  {
    id: "medication-reminders",
    title: "Medication Reminders",
    description:
      "View medication schedules and reminder times.",
    icon: BellRing,
  },

  {
    id: "dose-tracking",
    title: "Dose Tracking",
    description:
      "Track whether today's medication doses are taken.",
    icon: Check,
  },

  {
    id: "refill-tracking",
    title: "Refill Tracking",
    description:
      "Track upcoming medication refill dates.",
    icon: CalendarDays,
  },

  {
    id: "missed-doses",
    title: "Missed Doses",
    description:
      "See medications whose scheduled dose time has passed.",
    icon: TriangleAlert,
  },

  {
    id: "medication-history",
    title: "Medication History",
    description:
      "Review your previous dose activity.",
    icon: History,
  },
];

const getLocalDayKey = (date = new Date()) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) {
    return "Not specified";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

const formatHistoryDate = (date) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
};

const MedicationManagementPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState("overview");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [
    selectedFeature,
    setSelectedFeature,
  ] = useState(null);

  const [
    medications,
    setMedications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    medicationName,
    setMedicationName,
  ] = useState("");

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

  const todayKey = getLocalDayKey();

  const showMessage = (
    message,
    type = "success"
  ) => {
    if (type === "success") {
      setSuccess(message);
      setError("");
    } else {
      setError(message);
      setSuccess("");
    }

    window.setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3000);
  };

  const loadMedications = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        "/medication-management"
      );

      setMedications(
        response.data?.medications || []
      );
    } catch (err) {
      console.error(
        "Load medications error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load medications"
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  const isDoseTakenToday = (
    medication
  ) => {
    return (
      medication?.doseHistory?.some(
        (dose) =>
          dose.dayKey === todayKey &&
          dose.taken === true
      ) || false
    );
  };

  const medicationHasStarted = (
    medication
  ) => {
    if (!medication.startDate) {
      return true;
    }

    const start = new Date(
      medication.startDate
    );

    const now = new Date();

    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    return start <= now;
  };

  const isMedicationMissed = (
    medication
  ) => {
    if (
      medication.status !== "Active"
    ) {
      return false;
    }

    if (
      medication.frequency ===
      "As needed"
    ) {
      return false;
    }

    if (
      !medicationHasStarted(
        medication
      )
    ) {
      return false;
    }

    if (
      isDoseTakenToday(medication)
    ) {
      return false;
    }

    if (!medication.time) {
      return false;
    }

    const now = new Date();

    const [hours, minutes] =
      medication.time
        .split(":")
        .map(Number);

    const scheduledTime =
      new Date();

    scheduledTime.setHours(
      hours || 0,
      minutes || 0,
      0,
      0
    );

    return now > scheduledTime;
  };

  const filteredMedications =
    useMemo(() => {
      const searchTerm = search
        .trim()
        .toLowerCase();

      if (!searchTerm) {
        return medications;
      }

      return medications.filter(
        (medication) => {
          const searchable = [
            medication.name,
            medication.dosage,
            medication.frequency,
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            searchTerm
          );
        }
      );
    }, [medications, search]);

  const activeMedications =
    useMemo(() => {
      return medications.filter(
        (medication) =>
          medication.status === "Active"
      );
    }, [medications]);

  const reminders =
    useMemo(() => {
      return activeMedications
        .filter(
          (medication) =>
            medication.reminderEnabled !==
            false
        )
        .sort((a, b) =>
          (a.time || "").localeCompare(
            b.time || ""
          )
        );
    }, [activeMedications]);

  const dosesTakenToday =
    useMemo(() => {
      return activeMedications.filter(
        (medication) =>
          isDoseTakenToday(
            medication
          )
      );
    }, [
      activeMedications,
      todayKey,
    ]);

  const missedMedications =
    useMemo(() => {
      return activeMedications.filter(
        (medication) =>
          isMedicationMissed(
            medication
          )
      );
    }, [
      activeMedications,
      medications,
      todayKey,
    ]);

  const refillMedications =
    useMemo(() => {
      return activeMedications
        .filter(
          (medication) =>
            medication.refillDate
        )
        .sort(
          (a, b) =>
            new Date(a.refillDate) -
            new Date(b.refillDate)
        );
    }, [activeMedications]);

  const medicationHistory =
    useMemo(() => {
      const history = [];

      medications.forEach(
        (medication) => {
          (
            medication.doseHistory ||
            []
          ).forEach((dose) => {
            history.push({
              ...dose,

              medicationId:
                medication._id,

              medicationName:
                medication.name,

              dosage:
                medication.dosage,

              frequency:
                medication.frequency,

              time:
                medication.time,
            });
          });
        }
      );

      return history.sort(
        (a, b) =>
          new Date(
            b.recordedAt
          ).getTime() -
          new Date(
            a.recordedAt
          ).getTime()
      );
    }, [medications]);

  const resetForm = () => {
    setMedicationName("");
    setDosage("");

    setFrequency(
      "Once daily"
    );

    setTime("09:00");

    setStartDate("");

    setRefillDate("");
  };

  const openAddMedication = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    resetForm();
  };

  const handleFeatureClick = (
    feature
  ) => {
    setSelectedFeature(feature);

    setActiveTab(feature.id);
  };

  const handleSaveMedication =
    async (event) => {
      event.preventDefault();

      if (
        !medicationName.trim()
      ) {
        showMessage(
          "Please enter medication name",
          "error"
        );

        return;
      }

      if (!dosage.trim()) {
        showMessage(
          "Please enter dosage",
          "error"
        );

        return;
      }

      try {
        setSaving(true);

        setError("");

        const payload = {
          name:
            medicationName.trim(),

          dosage:
            dosage.trim(),

          frequency,

          time,

          startDate:
            startDate || null,

          refillDate:
            refillDate || null,

          reminderEnabled: true,
        };

        const response =
          await api.post(
            "/medication-management",
            payload
          );

        const savedMedication =
          response.data
            ?.medication;

        if (savedMedication) {
          setMedications(
            (previous) => [
              savedMedication,
              ...previous,
            ]
          );
        } else {
          await loadMedications(
            false
          );
        }

        closeModal();

        showMessage(
          "Medication saved successfully"
        );
      } catch (err) {
        console.error(
          "Save medication error:",
          err
        );

        showMessage(
          err.response?.data
            ?.message ||
            "Failed to save medication",
          "error"
        );
      } finally {
        setSaving(false);
      }
    };

  const handleDoseToggle =
    async (medication) => {
      try {
        const currentlyTaken =
          isDoseTakenToday(
            medication
          );

        const response =
          await api.patch(
            `/medication-management/${medication._id}/dose`,
            {
              dayKey: todayKey,
              taken:
                !currentlyTaken,
            }
          );

        const updatedMedication =
          response.data
            ?.medication;

        if (updatedMedication) {
          setMedications(
            (previous) =>
              previous.map(
                (item) =>
                  item._id ===
                  medication._id
                    ? updatedMedication
                    : item
              )
          );
        }

        showMessage(
          !currentlyTaken
            ? "Dose marked as taken"
            : "Dose marked as not taken"
        );
      } catch (err) {
        console.error(
          "Dose update error:",
          err
        );

        showMessage(
          err.response?.data
            ?.message ||
            "Failed to update dose",
          "error"
        );
      }
    };

  const handleDeleteMedication =
    async (medication) => {
      const shouldDelete =
        window.confirm(
          `Delete ${medication.name}?`
        );

      if (!shouldDelete) {
        return;
      }

      try {
        await api.delete(
          `/medication-management/${medication._id}`
        );

        setMedications(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !==
                medication._id
            )
        );

        showMessage(
          "Medication deleted successfully"
        );
      } catch (err) {
        console.error(
          "Delete medication error:",
          err
        );

        showMessage(
          err.response?.data
            ?.message ||
            "Failed to delete medication",
          "error"
        );
      }
    };

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        await loadMedications(
          false
        );

        showMessage(
          "Medication data refreshed"
        );
      } finally {
        setRefreshing(false);
      }
    };

  const getRefillStatus = (
    refillDateValue
  ) => {
    if (!refillDateValue) {
      return {
        label:
          "No refill date",
        days: null,
      };
    }

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const refill = new Date(
      refillDateValue
    );

    refill.setHours(
      0,
      0,
      0,
      0
    );

    const difference =
      Math.ceil(
        (refill.getTime() -
          today.getTime()) /
          (1000 *
            60 *
            60 *
            24)
      );

    if (difference < 0) {
      return {
        label:
          "Refill overdue",
        days: difference,
      };
    }

    if (difference === 0) {
      return {
        label:
          "Refill today",
        days: 0,
      };
    }

    if (difference === 1) {
      return {
        label:
          "Refill tomorrow",
        days: 1,
      };
    }

    return {
      label: `${difference} days remaining`,
      days: difference,
    };
  };

  const renderMedicationCard = (
    medication,
    options = {}
  ) => {
    const {
      showDoseButton = true,
      showDeleteButton = true,
    } = options;

    const taken =
      isDoseTakenToday(
        medication
      );

    return (
      <div
        className="health-vital-card"
        key={medication._id}
      >
        <div
          className="health-vital-card-top"
        >
          <div
            className="health-vital-icon"
          >
            <Pill size={20} />
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <h3>
              {medication.name}
            </h3>

            <p>
              {medication.dosage} •{" "}
              {
                medication.frequency
              }
            </p>
          </div>

          {showDeleteButton && (
            <button
              type="button"
              className="health-icon-btn"
              onClick={() =>
                handleDeleteMedication(
                  medication
                )
              }
              title="Delete medication"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <div
          style={{
            marginTop: "14px",
            display: "grid",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            <Clock3 size={15} />

            <span>
              Reminder:{" "}
              {medication.time ||
                "Not specified"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            <CalendarDays
              size={15}
            />

            <span>
              Started:{" "}
              {formatDate(
                medication.startDate
              )}
            </span>
          </div>

          {medication.refillDate && (
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "8px",
                fontSize:
                  "13px",
              }}
            >
              <RefreshCw
                size={15}
              />

              <span>
                Refill:{" "}
                {formatDate(
                  medication.refillDate
                )}
              </span>
            </div>
          )}
        </div>

        {showDoseButton && (
          <button
            type="button"
            className={
              taken
                ? "health-primary-btn"
                : "health-secondary-btn"
            }
            style={{
              width: "100%",
              marginTop: "15px",
            }}
            onClick={() =>
              handleDoseToggle(
                medication
              )
            }
          >
            {taken ? (
              <>
                <Check
                  size={16}
                />

                Dose Taken
              </>
            ) : (
              <>
                <Pill
                  size={16}
                />

                Mark Dose Taken
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  const renderFeatureContent =
    () => {
      if (!selectedFeature) {
        return null;
      }

      const Icon =
        selectedFeature.icon;

      if (
        selectedFeature.id ===
        "medications"
      ) {
        return (
          <>
            {filteredMedications.length ===
            0 ? (
              <div
                className="health-empty-state"
              >
                <Pill size={34} />

                <h3>
                  No medications
                </h3>

                <p>
                  Add a medication
                  to start tracking
                  it.
                </p>

                <button
                  type="button"
                  className="health-primary-btn"
                  onClick={
                    openAddMedication
                  }
                >
                  <Plus
                    size={16}
                  />

                  Add Medication
                </button>
              </div>
            ) : (
              <div
                className="health-vitals-grid"
              >
                {filteredMedications.map(
                  (
                    medication
                  ) =>
                    renderMedicationCard(
                      medication
                    )
                )}
              </div>
            )}
          </>
        );
      }

      if (
        selectedFeature.id ===
        "medication-reminders"
      ) {
        return reminders.length ===
          0 ? (
          <div
            className="health-empty-state"
          >
            <BellRing
              size={34}
            />

            <h3>
              No reminders
            </h3>

            <p>
              Add medications to
              create your schedule.
            </p>
          </div>
        ) : (
          <div
            className="health-vitals-grid"
          >
            {reminders.map(
              (medication) => (
                <div
                  key={
                    medication._id
                  }
                  className="health-vital-card"
                >
                  <div
                    className="health-vital-card-top"
                  >
                    <div
                      className="health-vital-icon"
                    >
                      <BellRing
                        size={20}
                      />
                    </div>

                    <div>
                      <h3>
                        {
                          medication.name
                        }
                      </h3>

                      <p>
                        {
                          medication.dosage
                        }
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop:
                        "18px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize:
                          "24px",
                      }}
                    >
                      {
                        medication.time
                      }
                    </strong>

                    <p
                      style={{
                        marginTop:
                          "6px",
                      }}
                    >
                      {
                        medication.frequency
                      }
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        );
      }

      if (
        selectedFeature.id ===
        "dose-tracking"
      ) {
        return activeMedications
          .length === 0 ? (
          <div
            className="health-empty-state"
          >
            <Check size={34} />

            <h3>
              No doses to track
            </h3>

            <p>
              Add a medication
              first.
            </p>
          </div>
        ) : (
          <div
            className="health-vitals-grid"
          >
            {activeMedications.map(
              (medication) =>
                renderMedicationCard(
                  medication,
                  {
                    showDeleteButton:
                      false,
                  }
                )
            )}
          </div>
        );
      }

      if (
        selectedFeature.id ===
        "refill-tracking"
      ) {
        return refillMedications
          .length === 0 ? (
          <div
            className="health-empty-state"
          >
            <RefreshCw
              size={34}
            />

            <h3>
              No refill dates
            </h3>

            <p>
              Add refill dates
              while saving your
              medications.
            </p>
          </div>
        ) : (
          <div
            className="health-vitals-grid"
          >
            {refillMedications.map(
              (medication) => {
                const refillStatus =
                  getRefillStatus(
                    medication.refillDate
                  );

                return (
                  <div
                    className="health-vital-card"
                    key={
                      medication._id
                    }
                  >
                    <div
                      className="health-vital-card-top"
                    >
                      <div
                        className="health-vital-icon"
                      >
                        <RefreshCw
                          size={20}
                        />
                      </div>

                      <div>
                        <h3>
                          {
                            medication.name
                          }
                        </h3>

                        <p>
                          {
                            medication.dosage
                          }
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop:
                          "18px",
                      }}
                    >
                      <strong>
                        {formatDate(
                          medication.refillDate
                        )}
                      </strong>

                      <p
                        style={{
                          marginTop:
                            "6px",
                        }}
                      >
                        {
                          refillStatus.label
                        }
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        );
      }

      if (
        selectedFeature.id ===
        "missed-doses"
      ) {
        return missedMedications
          .length === 0 ? (
          <div
            className="health-empty-state"
          >
            <Check size={34} />

            <h3>
              No missed doses
            </h3>

            <p>
              No overdue medication
              doses were found for
              today.
            </p>
          </div>
        ) : (
          <div
            className="health-vitals-grid"
          >
            {missedMedications.map(
              (medication) => (
                <div
                  className="health-vital-card"
                  key={
                    medication._id
                  }
                >
                  <div
                    className="health-vital-card-top"
                  >
                    <div
                      className="health-vital-icon"
                    >
                      <ShieldAlert
                        size={20}
                      />
                    </div>

                    <div>
                      <h3>
                        {
                          medication.name
                        }
                      </h3>

                      <p>
                        {
                          medication.dosage
                        }
                      </p>
                    </div>
                  </div>

                  <p
                    style={{
                      marginTop:
                        "14px",
                    }}
                  >
                    Scheduled at{" "}
                    <strong>
                      {
                        medication.time
                      }
                    </strong>
                  </p>

                  <button
                    type="button"
                    className="health-primary-btn"
                    style={{
                      width: "100%",
                      marginTop:
                        "15px",
                    }}
                    onClick={() =>
                      handleDoseToggle(
                        medication
                      )
                    }
                  >
                    <Check
                      size={16}
                    />

                    Mark Dose Taken
                  </button>
                </div>
              )
            )}
          </div>
        );
      }

      if (
        selectedFeature.id ===
        "medication-history"
      ) {
        return medicationHistory
          .length === 0 ? (
          <div
            className="health-empty-state"
          >
            <History
              size={34}
            />

            <h3>
              No medication history
            </h3>

            <p>
              Dose activity will
              appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {medicationHistory.map(
              (item) => (
                <div
                  key={
                    item._id ||
                    `${item.medicationId}-${item.dayKey}`
                  }
                  className="health-vital-card"
                >
                  <div
                    className="health-vital-card-top"
                  >
                    <div
                      className="health-vital-icon"
                    >
                      <History
                        size={20}
                      />
                    </div>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <h3>
                        {
                          item.medicationName
                        }
                      </h3>

                      <p>
                        {
                          item.dosage
                        }{" "}
                        •{" "}
                        {
                          item.frequency
                        }
                      </p>
                    </div>

                    <strong>
                      {item.taken
                        ? "Taken"
                        : "Not taken"}
                    </strong>
                  </div>

                  <p
                    style={{
                      marginTop:
                        "10px",
                    }}
                  >
                    {
                      item.dayKey
                    }{" "}
                    •{" "}
                    {formatHistoryDate(
                      item.recordedAt
                    )}
                  </p>
                </div>
              )
            )}
          </div>
        );
      }

      return (
        <div
          className="health-empty-state"
        >
          <Icon size={34} />

          <h3>
            {
              selectedFeature.title
            }
          </h3>
        </div>
      );
    };

  return (
    <div className="health-page">
      <div
        className="health-page-header"
      >
        <div>
          <button
            type="button"
            className="health-back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft
              size={18}
            />

            Back
          </button>

          <h1>
            Medication Management
          </h1>

          <p>
            Manage medications,
            reminders, doses,
            refills and medication
            history.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="health-secondary-btn"
            onClick={
              handleRefresh
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            className="health-primary-btn"
            onClick={
              openAddMedication
            }
          >
            <Plus size={16} />

            Add Medication
          </button>
        </div>
      </div>

      {success && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            border:
              "1px solid rgba(34,197,94,.25)",
            borderRadius: "10px",
          }}
        >
          {success}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            border:
              "1px solid rgba(239,68,68,.25)",
            borderRadius: "10px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "22px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className={
            activeTab ===
            "overview"
              ? "health-primary-btn"
              : "health-secondary-btn"
          }
          onClick={() => {
            setActiveTab(
              "overview"
            );

            setSelectedFeature(
              null
            );
          }}
        >
          Overview
        </button>

        {selectedFeature && (
          <button
            type="button"
            className="health-primary-btn"
          >
            {
              selectedFeature.title
            }
          </button>
        )}
      </div>

      {activeTab ===
        "overview" && (
        <>
          <div
            className="health-summary-grid"
          >
            <div
              className="health-summary-card"
            >
              <div>
                <span>
                  Active Medications
                </span>

                <strong>
                  {
                    activeMedications.length
                  }
                </strong>
              </div>

              <Pill size={22} />
            </div>

            <div
              className="health-summary-card"
            >
              <div>
                <span>
                  Reminders
                </span>

                <strong>
                  {
                    reminders.length
                  }
                </strong>
              </div>

              <BellRing
                size={22}
              />
            </div>

            <div
              className="health-summary-card"
            >
              <div>
                <span>
                  Doses Taken Today
                </span>

                <strong>
                  {
                    dosesTakenToday.length
                  }
                </strong>
              </div>

              <Check size={22} />
            </div>

            <div
              className="health-summary-card"
            >
              <div>
                <span>
                  Missed Doses
                </span>

                <strong>
                  {
                    missedMedications.length
                  }
                </strong>
              </div>

              <TriangleAlert
                size={22}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
            }}
          >
            <div
              className="health-section-header"
            >
              <div>
                <h2>
                  Medication Tools
                </h2>

                <p>
                  Choose a feature
                  to manage your
                  medication
                  information.
                </p>
              </div>
            </div>

            <div
              className="health-vitals-grid"
            >
              {medicationFeatures.map(
                (feature) => {
                  const Icon =
                    feature.icon;

                  let count = null;

                  if (
                    feature.id ===
                    "medications"
                  ) {
                    count =
                      activeMedications.length;
                  }

                  if (
                    feature.id ===
                    "medication-reminders"
                  ) {
                    count =
                      reminders.length;
                  }

                  if (
                    feature.id ===
                    "dose-tracking"
                  ) {
                    count =
                      dosesTakenToday.length;
                  }

                  if (
                    feature.id ===
                    "refill-tracking"
                  ) {
                    count =
                      refillMedications.length;
                  }

                  if (
                    feature.id ===
                    "missed-doses"
                  ) {
                    count =
                      missedMedications.length;
                  }

                  if (
                    feature.id ===
                    "medication-history"
                  ) {
                    count =
                      medicationHistory.length;
                  }

                  return (
                    <button
                      type="button"
                      key={
                        feature.id
                      }
                      className="health-vital-card"
                      style={{
                        textAlign:
                          "left",
                        cursor:
                          "pointer",
                      }}
                      onClick={() =>
                        handleFeatureClick(
                          feature
                        )
                      }
                    >
                      <div
                        className="health-vital-card-top"
                      >
                        <div
                          className="health-vital-icon"
                        >
                          <Icon
                            size={20}
                          />
                        </div>

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <h3>
                            {
                              feature.title
                            }
                          </h3>

                          <p>
                            {
                              feature.description
                            }
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "15px",
                          fontWeight:
                            700,
                          fontSize:
                            "20px",
                        }}
                      >
                        {count}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: "28px",
            }}
          >
            <div
              className="health-section-header"
            >
              <div>
                <h2>
                  Your Medications
                </h2>

                <p>
                  Search and manage
                  your saved
                  medications.
                </p>
              </div>
            </div>

            <div
              style={{
                position:
                  "relative",
                marginBottom:
                  "18px",
              }}
            >
              <Search
                size={18}
                style={{
                  position:
                    "absolute",
                  left: "14px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  opacity: 0.6,
                }}
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search medications..."
                className="health-form-input"
                style={{
                  width: "100%",
                  paddingLeft:
                    "42px",
                }}
              />
            </div>

            {loading ? (
              <div
                className="health-empty-state"
              >
                <RefreshCw
                  size={30}
                />

                <h3>
                  Loading
                  medications...
                </h3>
              </div>
            ) : filteredMedications.length ===
              0 ? (
              <div
                className="health-empty-state"
              >
                <Pill size={36} />

                <h3>
                  No medications
                  found
                </h3>

                <p>
                  Add your first
                  medication to
                  start tracking
                  doses and
                  reminders.
                </p>

                <button
                  type="button"
                  className="health-primary-btn"
                  onClick={
                    openAddMedication
                  }
                >
                  <Plus
                    size={16}
                  />

                  Add Medication
                </button>
              </div>
            ) : (
              <div
                className="health-vitals-grid"
              >
                {filteredMedications.map(
                  (
                    medication
                  ) =>
                    renderMedicationCard(
                      medication
                    )
                )}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab !==
        "overview" &&
        selectedFeature && (
          <div>
            <div
              className="health-section-header"
            >
              <div>
                <h2>
                  {
                    selectedFeature.title
                  }
                </h2>

                <p>
                  {
                    selectedFeature.description
                  }
                </p>
              </div>

              {selectedFeature.id ===
                "medications" && (
                <button
                  type="button"
                  className="health-primary-btn"
                  onClick={
                    openAddMedication
                  }
                >
                  <Plus
                    size={16}
                  />

                  Add Medication
                </button>
              )}
            </div>

            {renderFeatureContent()}
          </div>
        )}

      {showModal && (
        <div
          className="health-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="health-modal"
          >
            <div
              className="health-modal-header"
            >
              <div>
                <h2>
                  Add Medication
                </h2>

                <p>
                  Enter your
                  medication
                  details.
                </p>
              </div>

              <button
                type="button"
                className="health-icon-btn"
                onClick={
                  closeModal
                }
                disabled={saving}
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                handleSaveMedication
              }
            >
              <div
                className="health-form-group"
              >
                <label>
                  Medication Name
                </label>

                <input
                  type="text"
                  value={
                    medicationName
                  }
                  onChange={(
                    event
                  ) =>
                    setMedicationName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Example: Paracetamol"
                  className="health-form-input"
                  autoFocus
                />
              </div>

              <div
                className="health-form-group"
              >
                <label>
                  Dosage
                </label>

                <input
                  type="text"
                  value={dosage}
                  onChange={(
                    event
                  ) =>
                    setDosage(
                      event.target
                        .value
                    )
                  }
                  placeholder="Example: 500 mg"
                  className="health-form-input"
                />
              </div>

              <div
                className="health-form-group"
              >
                <label>
                  Frequency
                </label>

                <select
                  value={
                    frequency
                  }
                  onChange={(
                    event
                  ) =>
                    setFrequency(
                      event.target
                        .value
                    )
                  }
                  className="health-form-input"
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
              </div>

              <div
                className="health-form-group"
              >
                <label>
                  Reminder Time
                </label>

                <input
                  type="time"
                  value={time}
                  onChange={(
                    event
                  ) =>
                    setTime(
                      event.target
                        .value
                    )
                  }
                  className="health-form-input"
                />
              </div>

              <div
                className="health-form-group"
              >
                <label>
                  Start Date
                </label>

                <input
                  type="date"
                  value={
                    startDate
                  }
                  onChange={(
                    event
                  ) =>
                    setStartDate(
                      event.target
                        .value
                    )
                  }
                  className="health-form-input"
                />
              </div>

              <div
                className="health-form-group"
              >
                <label>
                  Refill Date
                </label>

                <input
                  type="date"
                  value={
                    refillDate
                  }
                  onChange={(
                    event
                  ) =>
                    setRefillDate(
                      event.target
                        .value
                    )
                  }
                  className="health-form-input"
                />
              </div>

              <div
                className="health-modal-actions"
              >
                <button
                  type="button"
                  className="health-secondary-btn"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="health-primary-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={16}
                      />

                      Save Medication
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationManagementPage;