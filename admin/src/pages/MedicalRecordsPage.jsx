import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  FileText,
  Plus,
  History,
  Pill,
  Syringe,
  CalendarCheck,
  Upload,
  Search,
  X,
  FileCheck2,
  ClipboardList,
  RefreshCw,
  Trash2,
  Eye,
} from "lucide-react";

import api from "../services/api.js";
import "./MedicalRecordsPage.css";



/* =========================================================
   MEDICAL RECORD TYPES
========================================================= */

const recordTypes = [
  {
    id: "medical-history",
    title: "Medical History",
    description:
      "Store and manage your medical history.",
    icon: FileText,
  },

  {
    id: "prescriptions",
    title: "Prescriptions",
    description:
      "Store and manage prescription information.",
    icon: Pill,
  },

  {
    id: "medical-reports",
    title: "Medical Reports",
    description:
      "Store and manage medical reports.",
    icon: FileCheck2,
  },

  {
    id: "vaccinations",
    title: "Vaccinations",
    description:
      "Store and manage vaccination information.",
    icon: Syringe,
  },

  {
    id: "doctor-visits",
    title: "Doctor Visits",
    description:
      "Store information related to doctor visits.",
    icon: CalendarCheck,
  },
];


/* =========================================================
   HELPERS
========================================================= */

const formatDate = (date) => {
  if (!date) {
    return "Not specified";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
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


/* =========================================================
   RECORD CARD
========================================================= */

function RecordCard({
  record,
  count,
  onAdd,
  onHistory,
}) {
  const Icon = record.icon;

  return (
    <div className="health-vital-detail-card">

      <div className="health-vital-detail-card__top">

        <div className="health-vital-detail-card__icon">
          <Icon size={21} />
        </div>

        <button
          type="button"
          className="health-vital-history-btn"
          onClick={onHistory}
          title="View history"
        >
          <History size={15} />
        </button>

      </div>

      <div className="health-vital-detail-card__content">

        <h3>
          {record.title}
        </h3>

        <p>
          {record.description}
        </p>

      </div>

      <div className="health-vital-detail-card__reading">

        <div>
          <strong>
            {count}
          </strong>
        </div>

        <small>
          {count === 1
            ? "Record"
            : "Records"}
        </small>

      </div>

      <button
        type="button"
        className="health-vital-add-btn"
        onClick={onAdd}
      >
        <Plus size={15} />

        Add Record
      </button>

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function MedicalRecordsPage() {

  const navigate =
    useNavigate();

  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState(null);

  const [
    historyType,
    setHistoryType,
  ] = useState(null);

  const [
    records,
    setRecords,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    recordDate,
    setRecordDate,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    document,
    setDocument,
  ] = useState(null);


  /* =======================================================
     MESSAGES
  ======================================================= */

  const showMessage = (
    message,
    type = "success"
  ) => {
    if (
      type === "success"
    ) {
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


  /* =======================================================
     LOAD RECORDS
  ======================================================= */

  const loadRecords =
    async (
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const response =
          await api.get(
            "/medical-records"
          );

        setRecords(
          response.data?.records ||
            []
        );
      } catch (err) {
        console.error(
          "Load medical records error:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Failed to load medical records"
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    };


  useEffect(() => {
    loadRecords();
  }, []);


  /* =======================================================
     RECORD COUNTS
  ======================================================= */

  const getRecordCount =
    (recordType) => {
      return records.filter(
        (record) =>
          record.recordType ===
          recordType
      ).length;
    };


  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRecords =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return records;
      }

      return records.filter(
        (record) => {

          const searchable = [
            record.title,
            record.notes,
            record.recordType,
            record.document
              ?.originalName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );

    }, [
      records,
      search,
    ]);


  /* =======================================================
     SELECT RECORD
  ======================================================= */

  const handleAddRecord =
    (record) => {

      setSelectedRecord(
        record
      );

      setTitle("");

      setRecordDate(
        new Date()
          .toISOString()
          .slice(0, 10)
      );

      setNotes("");

      setDocument(null);
    };


  /* =======================================================
     HISTORY
  ======================================================= */

  const handleHistory =
    (record) => {
      setHistoryType(record);
    };


  const closeHistory = () => {
    setHistoryType(null);
  };


  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async () => {

      if (!title.trim()) {
        showMessage(
          "Please enter a title",
          "error"
        );

        return;
      }

      if (!recordDate) {
        showMessage(
          "Please select a date",
          "error"
        );

        return;
      }

      try {

        setSaving(true);

        setError("");

        const formData =
          new FormData();

        formData.append(
          "recordType",
          selectedRecord.id
        );

        formData.append(
          "title",
          title.trim()
        );

        formData.append(
          "recordDate",
          recordDate
        );

        formData.append(
          "notes",
          notes.trim()
        );

        if (document) {
          formData.append(
            "document",
            document
          );
        }

        const response =
          await api.post(
            "/medical-records",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        const savedRecord =
          response.data?.record;

        if (savedRecord) {

          setRecords(
            (previous) => [
              savedRecord,
              ...previous,
            ]
          );

        } else {
          await loadRecords(
            false
          );
        }

        setSelectedRecord(
          null
        );

        setTitle("");

        setNotes("");

        setDocument(null);

        showMessage(
          "Medical record saved successfully"
        );

      } catch (err) {

        console.error(
          "Save medical record error:",
          err
        );

        showMessage(
          err.response?.data
            ?.message ||
            "Failed to save medical record",
          "error"
        );

      } finally {
        setSaving(false);
      }
    };


  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    async (record) => {

      const confirmed =
        window.confirm(
          `Delete "${record.title}"?`
        );

      if (!confirmed) {
        return;
      }

      try {

        await api.delete(
          `/medical-records/${record._id}`
        );

        setRecords(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !==
                record._id
            )
        );

        showMessage(
          "Medical record deleted successfully"
        );

      } catch (err) {

        console.error(
          "Delete medical record error:",
          err
        );

        showMessage(
          err.response?.data
            ?.message ||
            "Failed to delete medical record",
          "error"
        );
      }
    };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async () => {

      try {

        setRefreshing(true);

        await loadRecords(
          false
        );

        showMessage(
          "Medical records refreshed"
        );

      } finally {
        setRefreshing(false);
      }
    };


  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const handleDownload =
    async (record) => {

      try {

        const response =
          await api.get(
            `/medical-records/${record._id}/document`,
            {
              responseType:
                "blob",
            }
          );

        const blob =
          new Blob([
            response.data,
          ]);

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href = url;

        link.download =
          record.document
            ?.originalName ||
          "medical-document";

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          url
        );

      } catch (err) {

        console.error(
          "Download document error:",
          err
        );

        showMessage(
          "Unable to download document",
          "error"
        );
      }
    };


  /* =======================================================
     HISTORY RECORDS
  ======================================================= */

  const historyRecords =
    historyType
      ? records.filter(
          (record) =>
            record.recordType ===
            historyType.id
        )
      : [];


  /* =======================================================
     RENDER
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

            <FileText size={14} />

            Health · Medical Records

          </div>


          <h1>
            Medical Records & Reports
          </h1>


          <p>
            Store, organize and manage
            your medical history, reports,
            prescriptions and visits in
            one place.
          </p>

        </div>


        <div className="notifications-hero__actions">

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
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
            className="create-notification-btn"
            onClick={() =>
              handleAddRecord(
                recordTypes[0]
              )
            }
          >
            <Plus size={16} />

            Add Record
          </button>

        </div>

      </section>


      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {success && (
        <div
          style={{
            marginBottom:
              "16px",
            padding:
              "12px 14px",
            border:
              "1px solid rgba(34,197,94,.25)",
            borderRadius:
              "10px",
          }}
        >
          {success}
        </div>
      )}


      {error && (
        <div
          style={{
            marginBottom:
              "16px",
            padding:
              "12px 14px",
            border:
              "1px solid rgba(239,68,68,.25)",
            borderRadius:
              "10px",
          }}
        >
          {error}
        </div>
      )}


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="health-summary-notification-grid">

        <div className="summary-card">

          <div className="summary-icon">
            <FileText size={20} />
          </div>

          <div>

            <span>
              Medical History
            </span>

            <strong>
              {getRecordCount(
                "medical-history"
              )}
            </strong>

            <small>
              Records
            </small>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <Pill size={20} />
          </div>

          <div>

            <span>
              Prescriptions
            </span>

            <strong>
              {getRecordCount(
                "prescriptions"
              )}
            </strong>

            <small>
              Records
            </small>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <FileCheck2 size={20} />
          </div>

          <div>

            <span>
              Medical Reports
            </span>

            <strong>
              {getRecordCount(
                "medical-reports"
              )}
            </strong>

            <small>
              Documents
            </small>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <CalendarCheck size={20} />
          </div>

          <div>

            <span>
              Doctor Visits
            </span>

            <strong>
              {getRecordCount(
                "doctor-visits"
              )}
            </strong>

            <small>
              Visits
            </small>

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="health-main-card">

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <div className="health-main-toolbar">

          <div className="health-search">

            <Search size={17} />

            <input
              type="text"
              value={search}
              placeholder="Search medical records..."
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


          {search && (

            <button
              type="button"
              className="health-clear-btn"
              onClick={() =>
                setSearch("")
              }
            >
              <X size={14} />

              Clear
            </button>

          )}

        </div>


        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="health-main-header">

          <div>

            <span className="section-kicker">
              MEDICAL RECORD MANAGEMENT
            </span>

            <h2>
              Your Medical Records
            </h2>

            <p>
              Manage your medical history,
              reports, prescriptions,
              vaccinations and doctor visits.
            </p>

          </div>


          <div className="health-history-icon">

            <ClipboardList size={21} />

          </div>

        </div>


        {/* ===================================================
            RECORD GRID
        =================================================== */}

        {loading ? (

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
            <RefreshCw
              size={30}
              style={{
                marginBottom:
                  "10px",
              }}
            />

            <div
              style={{
                fontWeight: 800,
                color:
                  "#19334f",
              }}
            >
              Loading medical records...
            </div>
          </div>

        ) : (

          <div className="health-vitals-detail-grid">

            {recordTypes.map(
              (record) => (

                <RecordCard
                  key={
                    record.id
                  }

                  record={
                    record
                  }

                  count={
                    getRecordCount(
                      record.id
                    )
                  }

                  onAdd={() =>
                    handleAddRecord(
                      record
                    )
                  }

                  onHistory={() =>
                    handleHistory(
                      record
                    )
                  }
                />

              )
            )}

          </div>

        )}


        {/* ===================================================
            SEARCH RESULTS
        =================================================== */}

        {search && (

          <div
            style={{
              marginTop:
                "30px",
            }}
          >

            <div
              className="health-main-header"
            >

              <div>

                <span className="section-kicker">
                  SEARCH RESULTS
                </span>

                <h2>
                  Matching Records
                </h2>

              </div>

            </div>


            {filteredRecords.length ===
            0 ? (

              <div
                style={{
                  padding:
                    "35px 20px",
                  textAlign:
                    "center",
                  color:
                    "#8797aa",
                }}
              >
                No matching records found.
              </div>

            ) : (

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "12px",
                }}
              >

                {filteredRecords.map(
                  (record) => {

                    const type =
                      recordTypes.find(
                        (item) =>
                          item.id ===
                          record.recordType
                      );

                    const Icon =
                      type?.icon ||
                      FileText;

                    return (

                      <div
                        key={
                          record._id
                        }
                        className="health-vital-detail-card"
                      >

                        <div
                          className="health-vital-detail-card__top"
                        >

                          <div
                            className="health-vital-detail-card__icon"
                          >
                            <Icon
                              size={20}
                            />
                          </div>

                        </div>


                        <div
                          className="health-vital-detail-card__content"
                        >

                          <h3>
                            {
                              record.title
                            }
                          </h3>

                          <p>
                            {
                              type?.title
                            }{" "}
                            •{" "}
                            {formatDate(
                              record.recordDate
                            )}
                          </p>

                        </div>


                        <div
                          style={{
                            marginTop:
                              "10px",
                            color:
                              "#64748b",
                            fontSize:
                              "13px",
                          }}
                        >
                          {
                            record.notes ||
                            "No notes added."
                          }
                        </div>


                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                            marginTop:
                              "15px",
                          }}
                        >

                          {record.document
                            ?.filename && (

                            <button
                              type="button"
                              className="health-vital-add-btn"
                              onClick={() =>
                                handleDownload(
                                  record
                                )
                              }
                            >
                              <Eye
                                size={15}
                              />

                              View Document
                            </button>

                          )}


                          <button
                            type="button"
                            className="health-clear-btn"
                            onClick={() =>
                              handleDelete(
                                record
                              )
                            }
                          >
                            <Trash2
                              size={14}
                            />

                            Delete
                          </button>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </div>

        )}

      </section>


      {/* =====================================================
          ADD RECORD MODAL
      ===================================================== */}

      {selectedRecord && (

        <div
          className="health-modal-overlay"
          onClick={() => {
            if (!saving) {
              setSelectedRecord(
                null
              );
            }
          }}
        >

          <div
            className="health-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ===============================================
                MODAL HEADER
            =============================================== */}

            <div className="health-modal__header">

              <div>

                <span>
                  ADD MEDICAL RECORD
                </span>

                <h2>
                  {
                    selectedRecord.title
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedRecord(
                    null
                  )
                }
                className="health-modal-close"
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* ===============================================
                MODAL BODY
            =============================================== */}

            <div className="health-modal__body">

              <label>
                Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(
                  event
                ) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder={`Enter ${selectedRecord.title.toLowerCase()} title`}
              />


              <label>
                Date
              </label>

              <input
                type="date"
                value={
                  recordDate
                }
                onChange={(
                  event
                ) =>
                  setRecordDate(
                    event.target.value
                  )
                }
              />


              <label>
                Notes
              </label>

              <textarea
                rows="4"
                value={notes}
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Add notes or additional information..."
                style={{
                  width:
                    "100%",
                  resize:
                    "vertical",
                  padding:
                    "11px 12px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #d9e1ea",
                  fontFamily:
                    "inherit",
                  fontSize:
                    "13px",
                  outline:
                    "none",
                  boxSizing:
                    "border-box",
                }}
              />


              <label>
                Document
              </label>

              <div
                style={{
                  border:
                    "1px dashed #cbd6e2",
                  borderRadius:
                    "12px",
                  padding:
                    "20px",
                  textAlign:
                    "center",
                  background:
                    "#f8fafc",
                }}
              >

                <Upload
                  size={23}
                  style={{
                    marginBottom:
                      "7px",
                  }}
                />

                <div
                  style={{
                    fontWeight:
                      700,
                    fontSize:
                      "13px",
                    color:
                      "#19334f",
                    marginBottom:
                      "4px",
                  }}
                >
                  Upload medical document
                </div>

                <small>
                  PDF, JPG, PNG or WEBP · Max 10 MB
                </small>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(
                    event
                  ) => {

                    const file =
                      event.target
                        .files?.[0];

                    setDocument(
                      file ||
                        null
                    );
                  }}
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "12px",
                    fontSize:
                      "12px",
                  }}
                />

                {document && (

                  <div
                    style={{
                      marginTop:
                        "10px",
                      fontSize:
                        "12px",
                      fontWeight:
                        700,
                      color:
                        "#19334f",
                    }}
                  >
                    Selected:{" "}
                    {
                      document.name
                    }
                  </div>

                )}

              </div>

            </div>


            {/* ===============================================
                FOOTER
            =============================================== */}

            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={() =>
                  setSelectedRecord(
                    null
                  )
                }
                disabled={saving}
              >
                Cancel
              </button>


              <button
                type="button"
                className="health-modal-save"
                onClick={
                  handleSave
                }
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={15}
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Plus
                      size={15}
                    />

                    Save Record
                  </>
                )}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          HISTORY MODAL
      ===================================================== */}

      {historyType && (

        <div
          className="health-modal-overlay"
          onClick={
            closeHistory
          }
        >

          <div
            className="health-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="health-modal__header">

              <div>

                <span>
                  RECORD HISTORY
                </span>

                <h2>
                  {
                    historyType.title
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeHistory
                }
                className="health-modal-close"
              >
                ×
              </button>

            </div>


            <div
              className="health-modal__body"
              style={{
                maxHeight:
                  "55vh",
                overflowY:
                  "auto",
              }}
            >

              {historyRecords.length ===
              0 ? (

                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "30px 10px",
                    color:
                      "#8797aa",
                  }}
                >
                  <History
                    size={30}
                    style={{
                      marginBottom:
                        "8px",
                    }}
                  />

                  <div>
                    No records yet.
                  </div>
                </div>

              ) : (

                <div
                  style={{
                    display:
                      "grid",
                    gap:
                      "12px",
                  }}
                >

                  {historyRecords.map(
                    (record) => (

                      <div
                        key={
                          record._id
                        }
                        style={{
                          border:
                            "1px solid #e2e8f0",
                          borderRadius:
                            "12px",
                          padding:
                            "14px",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap:
                              "12px",
                          }}
                        >

                          <div>

                            <strong>
                              {
                                record.title
                              }
                            </strong>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#8797aa",
                                marginTop:
                                  "5px",
                              }}
                            >
                              {
                                formatDate(
                                  record.recordDate
                                )
                              }
                            </div>

                          </div>


                          <button
                            type="button"
                            className="health-icon-btn"
                            onClick={() =>
                              handleDelete(
                                record
                              )
                            }
                            title="Delete record"
                          >
                            <Trash2
                              size={15}
                            />
                          </button>

                        </div>


                        {record.notes && (

                          <p
                            style={{
                              marginTop:
                                "10px",
                              fontSize:
                                "13px",
                            }}
                          >
                            {
                              record.notes
                            }
                          </p>

                        )}


                        {record.document
                          ?.originalName && (

                          <button
                            type="button"
                            className="health-clear-btn"
                            style={{
                              marginTop:
                                "8px",
                            }}
                            onClick={() =>
                              handleDownload(
                                record
                              )
                            }
                          >
                            <Eye
                              size={14}
                            />

                            {
                              record.document
                                .originalName
                            }
                          </button>

                        )}

                      </div>

                    )
                  )}

                </div>

              )}

            </div>


            <div className="health-modal__footer">

              <button
                type="button"
                className="health-modal-cancel"
                onClick={
                  closeHistory
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}