import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { adminService } from "../../services/admin.service.js";

// =============================================================================
// SUBDIVISION 6: AI ERROR TABLE
// Component: AIErrorTable
// =============================================================================
export default function AIErrorTable({ data: externalData, loading: externalLoading }) {
  const [internalData, setInternalData] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    if (externalData !== undefined) return;

    let mounted = true;

    async function loadErrors() {
      try {
        setInternalLoading(true);
        const result = await adminService.getAIErrors();
        const records =
          result?.data?.errors ?? result?.errors ?? result?.data ?? [];
        if (mounted) setInternalData(Array.isArray(records) ? records : []);
      } catch (error) {
        console.error("Failed to load AI errors:", error);
        if (mounted) setInternalData([]);
      } finally {
        if (mounted) setInternalLoading(false);
      }
    }

    loadErrors();

    return () => {
      mounted = false;
    };
  }, [externalData]);

  const rawRecords = externalData !== undefined ? externalData : internalData;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const usageRecords = Array.isArray(rawRecords) ? rawRecords : [];

  const errors = useMemo(
    () =>
      usageRecords
        .filter((item) => item)
        .sort((a, b) => {
          const aTime = new Date(a?.createdAt || 0).getTime();
          const bTime = new Date(b?.createdAt || 0).getTime();
          return bTime - aTime;
        }),
    [usageRecords]
  );

  function formatTime(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString();
  }

  function formatLatency(value) {
    const latency = Number(value);
    return Number.isFinite(latency) ? `${latency.toLocaleString()}ms` : "—";
  }

  function getSeverity(errorCode) {
    const code = Number(errorCode);

    if (code >= 500) return "danger";
    if (code >= 400) return "warning";
    return "info";
  }

  return (
    <section className="ai-subdivision-card" id="module-error-table">
      <div className="ai-subdivision-header">
        <div className="ai-subdivision-title-group">
          <div className="ai-subdivision-icon-badge">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="ai-subdivision-title">
              Provider & Tool Execution Errors
            </h3>
            <p className="ai-subdivision-subtitle">
              Failed AI usage records returned by the telemetry API
            </p>
          </div>
        </div>
      </div>

      <div className="ai-table-container">
        <table className="ai-table">
          <thead>
            <tr>
              <th>Error ID</th>
              <th>Error Type</th>
              <th>Provider / Tool</th>
              <th>Module</th>
              <th>Code</th>
              <th>Time</th>
              <th>Resolution</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7">Loading AI error telemetry...</td>
              </tr>
            ) : errors.length === 0 ? (
              <tr>
                <td colSpan="7">No failed AI usage records found.</td>
              </tr>
            ) : (
              errors.map((err, index) => {
                const severity = getSeverity(err.errorCode);

                return (
                  <tr key={err._id || `${err.createdAt}-${index}`}>
                    <td>
                      <code className="ai-code-tag">
                        {err._id || `AI-ERR-${index + 1}`}
                      </code>
                    </td>

                    <td>
                      <strong className="ai-err-type">
                        {err.errorCode || "AI request failure"}
                      </strong>
                    </td>

                    <td>
                      <span className="ai-error-provider">
                        {err.provider || err.model || "Unknown model"}
                      </span>
                    </td>

                    <td>
                      <span className="ai-error-module">
                        {err.feature || err.requestType || "Unknown request type"}
                      </span>
                    </td>

                    <td>
                      <span className={`ai-status-pill pill-${severity}`}>
                        {err.errorCode || "Error"}
                      </span>
                    </td>

                    <td>
                      <span className="ai-error-time">
                        {formatTime(err.createdAt)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`ai-res-text ${
                          err.successful === false
                            ? "ai-res-text--danger"
                            : "ai-res-text--warning"
                        }`}
                      >
                        {err.successful === false ? "Failed" : "Flagged"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export { AIErrorTable };
