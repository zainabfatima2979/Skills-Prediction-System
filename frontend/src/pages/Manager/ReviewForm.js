import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import ManagerSidebar from "./ManagerSidebar";
import { avatarColor, initials } from "./icons";
import "./ManagerLayout.css";

const ICONS = {
  pending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 3.2" strokeLinecap="round" />
    </svg>
  ),
  completed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 12.3l2.8 2.8L16.8 8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6" />
      <circle cx="17" cy="9" r="2.4" opacity="0.7" />
      <path d="M20.5 20c0-2.8-1.7-4.9-3.8-5.6" opacity="0.7" />
    </svg>
  ),
  cursor: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
      <path d="M6 3l10 6-4.2 1.4L10 15z" strokeLinejoin="round" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="9" y="7" width="22" height="27" rx="2" />
      <rect x="14" y="4" width="12" height="6" rx="1.5" />
      <path d="M14 18h12M14 23h12M14 28h8" strokeLinecap="round" />
    </svg>
  ),
};

function ReviewForm() {
  const [searchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [ratings, setRatings] = useState({});
  const [overallRemark, setOverallRemark] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ pending: null, completed: null });
  const [departmentFilter, setDepartmentFilter] = useState("ALL"); // "ALL" = every department
  const [progress, setProgress] = useState({}); // employeeId -> { reviewed, total }

  const loadOverview = () =>
    api.get("/manager/overview").then((res) => {
      setCounts({ pending: res.data.pending.length, completed: res.data.completed.length });
      const map = {};
      [...res.data.pending, ...res.data.completed].forEach((e) => {
        map[e.employeeId] = { reviewed: e.reviewed, total: e.total };
      });
      setProgress(map);
    });

  useEffect(() => {
    api.get("/manager/employees").then((res) => setEmployees(res.data));
    loadOverview();
  }, []);

  useEffect(() => {
    const preselect = searchParams.get("employee");
    if (preselect) handleSelectEmployee(preselect);
    // eslint-disable-next-line
  }, [searchParams]);

  const handleSelectEmployee = async (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setMessage(null);
    setOverallRemark("");
    if (!employeeId) {
      setRequiredSkills([]);
      setEmployeeProfile(null);
      return;
    }

    const res = await api.get(`/manager/team/${employeeId}`);
    setRequiredSkills(res.data.requiredSkills);
    setEmployeeProfile(res.data.profile);

    const initialRatings = {};
    res.data.requiredSkills.forEach((skill) => {
      const existing = res.data.reviews.find((r) => r.skill === skill.skill);
      initialRatings[skill.skill] = {
        rating: existing ? existing.rating : 3,
        comment: existing ? existing.comment : "",
      };
    });
    setRatings(initialRatings);

    // bring the rating form into view after picking an employee from the list
    setTimeout(() => {
      document.getElementById("mgr-review-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const updateRating = (skill, field, value) => {
    setRatings((prev) => ({
      ...prev,
      [skill]: { ...prev[skill], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const reviews = Object.entries(ratings).map(([skill, data]) => ({
      skill,
      rating: Number(data.rating),
      comment: data.comment,
    }));

    try {
      const res = await api.post("/manager/review", {
        employeeId: selectedEmployeeId,
        overallRemark,
        reviews,
      });
      setMessage({ type: "success", text: res.data.message });
      loadOverview();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to submit review" });
    } finally {
      setLoading(false);
    }
  };

  const departments = [...new Set(employees.map((e) => e.department))].sort();
  const visibleEmployees = employees.filter(
    (e) => departmentFilter === "ALL" || e.department === departmentFilter
  );

  const selectedEmployee = employees.find((e) => e.employeeId === selectedEmployeeId);
  const reviewedCount = Object.values(ratings).filter((r) => r.comment?.trim()).length;
  const empColors = selectedEmployee ? avatarColor(selectedEmployee.name) : null;

  return (
    <div className="mgr-layout">
      <ManagerSidebar active="rate" pendingCount={counts.pending} completedCount={counts.completed} />

      <main className="mgr-main">
        <h1 className="mgr-title">Rate Employee</h1>
        <p className="mgr-subtitle">Select an employee and rate each of their required skills</p>

        <div className="mgr-stat-grid">
          <div className="mgr-stat-card">
            <div className="mgr-stat-icon" style={{ background: "#EEF2FF", color: "#4338CA" }}>
              {ICONS.people}
            </div>
            <div>
              <div className="mgr-stat-number">{employees.length}</div>
              <div className="mgr-stat-label">Total employees</div>
            </div>
          </div>
          <div className="mgr-stat-card">
            <div className="mgr-stat-icon" style={{ background: "#FFFBEB", color: "#B45309" }}>
              {ICONS.pending}
            </div>
            <div>
              <div className="mgr-stat-number">{counts.pending ?? "-"}</div>
              <div className="mgr-stat-label">Pending review</div>
            </div>
          </div>
          <div className="mgr-stat-card">
            <div className="mgr-stat-icon" style={{ background: "#F0FDF4", color: "#166534" }}>
              {ICONS.completed}
            </div>
            <div>
              <div className="mgr-stat-number">{counts.completed ?? "-"}</div>
              <div className="mgr-stat-label">Fully reviewed</div>
            </div>
          </div>
        </div>

        <div className="mgr-panel">
          <div className="mgr-panel-accent" style={{ background: "var(--color-accent)" }} />

          <label className="mgr-field-label">Department</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="mgr-select"
            style={{ marginBottom: "16px" }}
          >
            <option value="ALL">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {(
            <div style={{ marginBottom: "20px" }}>
              {visibleEmployees.length === 0 ? (
                <p className="mgr-empty">No employees in this department.</p>
              ) : (
                <table className="mgr-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Designation</th>
                      <th>Progress</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEmployees.map((e) => {
                      const colors = avatarColor(e.name);
                      const p = progress[e.employeeId];
                      const pct = p && p.total > 0 ? (p.reviewed / p.total) * 100 : 0;
                      return (
                        <tr
                          key={e.employeeId}
                          style={e.employeeId === selectedEmployeeId ? { background: "#F0FDFA" } : undefined}
                        >
                          <td>
                            <div className="mgr-employee-cell">
                              <div className="mgr-avatar" style={{ background: colors.bg, color: colors.fg }}>
                                {initials(e.name)}
                              </div>
                              <div>
                                <div className="mgr-employee-name">{e.name}</div>
                                <div className="mgr-employee-id">{e.employeeId}</div>
                              </div>
                            </div>
                          </td>
                          <td>{e.designation}</td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                width: 90,
                                height: 8,
                                borderRadius: 4,
                                background: "#E5E7EB",
                                overflow: "hidden",
                                verticalAlign: "middle",
                                marginRight: 8,
                              }}
                            >
                              <span
                                style={{
                                  display: "block",
                                  width: `${pct}%`,
                                  height: "100%",
                                  background: pct === 100 ? "#166534" : "#B45309",
                                }}
                              />
                            </span>
                            {p ? `${p.reviewed}/${p.total} skills` : "-"}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleSelectEmployee(e.employeeId)}
                              className="mgr-rate-btn"
                              style={{ cursor: "pointer", fontFamily: "inherit" }}
                            >
                              Rate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {selectedEmployee && (
            <div className="mgr-selected-employee" id="mgr-review-area">
              <div className="mgr-selected-avatar" style={{ background: empColors.bg, color: empColors.fg }}>
                {initials(selectedEmployee.name)}
              </div>
              <div>
                <div className="mgr-selected-name">{selectedEmployee.name}</div>
                <div className="mgr-selected-meta">
                  {selectedEmployee.employeeId} &middot; {selectedEmployee.designation} &middot; {selectedEmployee.department}
                </div>
              </div>
              {requiredSkills.length > 0 && (
                <div className="mgr-selected-progress">
                  {reviewedCount}/{requiredSkills.length} skills commented
                </div>
              )}
            </div>
          )}

          {!selectedEmployeeId && (
            <div className="mgr-empty-state">
              <div className="mgr-empty-state-icon">{ICONS.clipboard}</div>
              <div className="mgr-empty-state-title">No employee selected</div>
              <div className="mgr-empty-state-text">
                Click "Rate" next to an employee in the list above to start rating their required skills.
              </div>
            </div>
          )}

          {selectedEmployeeId && requiredSkills.length > 0 && !employeeProfile && (
            <div className="mgr-blocked-state">
              <div className="mgr-empty-state-icon" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 3 21.5 20H2.5L12 3Z" strokeLinejoin="round" />
                  <path d="M12 10v4.4" strokeLinecap="round" />
                  <circle cx="12" cy="17.4" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="mgr-empty-state-title">Profile not completed</div>
              <div className="mgr-empty-state-text">
                {selectedEmployee?.name} hasn't filled in their profile yet. You can't rate their
                skills until they do - ask them to complete it from their Employee dashboard first.
              </div>
            </div>
          )}

          {employeeProfile && (
            <div className="mgr-profile-card">
              <h4 className="mgr-profile-title">Employee Profile</h4>
              <div className="mgr-profile-grid">
                <div className="mgr-profile-item">
                  <div className="mgr-profile-label">Experience</div>
                  <div className="mgr-profile-value">{employeeProfile.yearsExperience} years</div>
                </div>
                <div className="mgr-profile-item">
                  <div className="mgr-profile-label">Education</div>
                  <div className="mgr-profile-value">{employeeProfile.education || "-"}</div>
                </div>
                <div className="mgr-profile-item full">
                  <div className="mgr-profile-label">Certifications</div>
                  <div className="mgr-profile-value">
                    {employeeProfile.certifications?.length
                      ? employeeProfile.certifications.join(", ")
                      : "None"}
                  </div>
                </div>
                <div className="mgr-profile-item full">
                  <div className="mgr-profile-label">Tools / Software Used</div>
                  <div className="mgr-profile-value">
                    {employeeProfile.toolsUsed?.length
                      ? employeeProfile.toolsUsed.join(", ")
                      : "None listed"}
                  </div>
                </div>
                <div className="mgr-profile-item full">
                  <div className="mgr-profile-label">Courses Completed</div>
                  <div className="mgr-profile-value">
                    {employeeProfile.coursesCompleted?.length
                      ? employeeProfile.coursesCompleted.join(", ")
                      : "None"}
                  </div>
                </div>
                <div className="mgr-profile-item full">
                  <div className="mgr-profile-label">Past Work / Projects</div>
                  <div className="mgr-profile-value">
                    {employeeProfile.pastWorkDescription || "No description provided"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {requiredSkills.length > 0 && employeeProfile && (
            <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
              {requiredSkills.map((skill) => (
                <div key={skill.skill} className="mgr-skill-card">
                  <div className="mgr-skill-card-header">
                    <span className="mgr-skill-name">{skill.skill}</span>
                    <span className="mgr-required-tag">Required: {skill.requiredLevel}</span>
                  </div>

                  <div className="mgr-field-row">
                    <div>
                      <label className="mgr-field-label">Rating</label>
                      <select
                        value={ratings[skill.skill]?.rating || 3}
                        onChange={(e) => updateRating(skill.skill, "rating", e.target.value)}
                        className="mgr-field-input"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mgr-field-label">Comment</label>
                      <textarea
                        value={ratings[skill.skill]?.comment || ""}
                        onChange={(e) => updateRating(skill.skill, "comment", e.target.value)}
                        rows={2}
                        className="mgr-field-input"
                        placeholder="e.g. Builds screens on his own, good component structure"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <label className="mgr-field-label" style={{ marginTop: "8px" }}>Overall Remark</label>
              <textarea
                value={overallRemark}
                onChange={(e) => setOverallRemark(e.target.value)}
                rows={2}
                className="mgr-field-input"
                placeholder="e.g. Learning fast, put him on database and API training next"
              />

              <button type="submit" disabled={loading} className="mgr-submit-btn" style={{ marginTop: "16px" }}>
                {loading ? "Submitting..." : `Submit Review for ${selectedEmployee?.name || ""}`}
              </button>

              {message && (
                <div className={`mgr-form-message ${message.type}`}>{message.text}</div>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default ReviewForm;