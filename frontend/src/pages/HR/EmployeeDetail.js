import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { avatarColor, initials } from "../../utils/avatar";
import "./Dashboard.css";
import HRSidebar from "./HRSidebar";

// Profile fields can be arrays of strings or of objects - show them safely as text
const asText = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    return value
      .map((v) => (typeof v === "object" ? v.name || v.title || JSON.stringify(v) : String(v)))
      .join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const pillClass = (status) => {
  if (status === "OK") return "hr-pill hr-pill-ok";
  if (status === "Gap") return "hr-pill hr-pill-gap";
  return "hr-pill hr-pill-pending";
};

function EmployeeDetail() {
  const { employeeId } = useParams();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  useEffect(() => {
    loadDetail();
  }, [employeeId]);

  const loadDetail = async () => {
    try {
      const res = await api.get(`/hr/employee-detail/${employeeId}`);
      setDetail(res.data);
    } catch (err) {
      setDetail(null);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to load employee." });
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    setMessage(null);
    try {
      const res = await api.post(`/hr/predict/${employeeId}`);
      await loadDetail();
      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Prediction failed." });
    } finally {
      setPredicting(false);
    }
  };

  const sidebar = (
    <HRSidebar active={null} />
  );

  if (loading) {
    return (
      <div className="hr-layout">
        {sidebar}
        <main className="hr-main">Loading employee...</main>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="hr-layout">
        {sidebar}
        <main className="hr-main">
          <a href="/hr" className="hr-back-link">&larr; Back to dashboard</a>
          {message && <div className={`hr-form-message ${message.type}`}>{message.text}</div>}
        </main>
      </div>
    );
  }

  const { user, profile, predictions, recommendations } = detail;
  const colors = avatarColor(user.name);
  const hasPredictions = predictions.length > 0;

  const profileFields = profile
    ? [
        ["Years of experience", asText(profile.yearsExperience)],
        ["Education", asText(profile.education)],
        ["Certifications", asText(profile.certifications)],
        ["Tools used", asText(profile.toolsUsed)],
        ["Courses completed", asText(profile.coursesCompleted)],
      ]
    : [];

  return (
    <div className="hr-layout">
      {sidebar}

      <main className="hr-main">
        <a href="/hr" className="hr-back-link">&larr; Back to dashboard</a>

        <div className="hr-header">
          <div className="hr-employee-cell" style={{ gap: 16 }}>
            <div
              className="hr-avatar hr-avatar-lg"
              style={{ background: colors.bg, color: colors.fg }}
            >
              {initials(user.name)}
            </div>
            <div>
              <h1 className="hr-title">{user.name}</h1>
              <p className="hr-subtitle">
                {user.employeeId} &middot; {user.designation} &middot; {user.department}
              </p>
            </div>
          </div>
          <button onClick={handlePredict} disabled={predicting} className="hr-form-btn">
            {predicting ? "Calculating..." : hasPredictions ? "Re-run Prediction" : "Run Prediction"}
          </button>
        </div>

        {message && <div className={`hr-form-message ${message.type}`}>{message.text}</div>}

        {/* Profile */}
        <div className="hr-panel" style={{ marginBottom: 24 }}>
          <div className="hr-panel-accent" style={{ background: "var(--color-accent)" }} />
          <h3 className="hr-panel-title">Employee Profile</h3>

          <div className="hr-form-row">
            <div className="hr-field">
              <span className="hr-field-label">Email</span>
              <div>{user.email || "-"}</div>
            </div>
            <div className="hr-field">
              <span className="hr-field-label">Role</span>
              <div><span className="hr-role-badge">{user.role}</span></div>
            </div>
          </div>

          {!profile ? (
            <div className="hr-form-warning">
              This employee has not filled in their profile yet, so a prediction cannot be run.
            </div>
          ) : (
            <>
              <div className="hr-form-row">
                {profileFields.map(([label, value]) => (
                  <div className="hr-field" key={label}>
                    <span className="hr-field-label">{label}</span>
                    <div>{value}</div>
                  </div>
                ))}
              </div>
              <div className="hr-field full">
                <span className="hr-field-label">Past work description</span>
                <div style={{ lineHeight: 1.5 }}>{asText(profile.pastWorkDescription)}</div>
              </div>
            </>
          )}
        </div>

        {/* Scores */}
        <div className="hr-panel" style={{ marginBottom: 24 }}>
          <div className="hr-panel-accent" style={{ background: "var(--color-accent)" }} />
          <h3 className="hr-panel-title">Skill Scores</h3>
          {!hasPredictions ? (
            <p className="hr-empty">
              No prediction yet. Click "Run Prediction" to calculate this employee's skill scores.
            </p>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Predicted Score</th>
                  <th>Predicted Level</th>
                  <th>Required Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.skill}>
                    <td>{p.skill}</td>
                    <td>{p.predictedScore ?? "-"}</td>
                    <td>{p.predictedLevel ?? "-"}</td>
                    <td>{p.requiredLevel}</td>
                    <td><span className={pillClass(p.status)}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recommended courses */}
        <div className="hr-panel">
          <div className="hr-panel-accent" style={{ background: "var(--color-gap)" }} />
          <h3 className="hr-panel-title">Recommended Courses ({recommendations.length})</h3>
          {recommendations.length === 0 ? (
            <p className="hr-empty">
              {hasPredictions
                ? "No course recommendations - no skill gaps found."
                : "Run the prediction to see recommended courses."}
            </p>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Skill Gap</th>
                  <th>Recommended Course</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((r) => (
                  <tr key={r.skillGap}>
                    <td>{r.skillGap}</td>
                    <td>{r.recommendedCourse}</td>
                    <td>{r.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default EmployeeDetail;