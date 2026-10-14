import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { avatarColor, initials } from "../../utils/avatar";
import ConfirmDialog from "../../components/ConfirmDialog";
import "./Dashboard.css";
import HRSidebar from "./HRSidebar";

const ICONS = {
  dashboard: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.2" />
    </svg>
  ),
  createUser: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="7" r="3" />
      <path d="M2.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 8v4M13.5 10h4" />
    </svg>
  ),
  pending: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6v4l2.6 2.6" />
    </svg>
  ),
  gap: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2.5 18 16H2L10 2.5Z" strokeLinejoin="round" />
      <path d="M10 8v3.2" strokeLinecap="round" />
      <circle cx="10" cy="13.6" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  ok: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M6.8 10.2l2 2 4.2-4.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  predictionStatus: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 16V9M8 16V4M13 16v-6M17 16V7" strokeLinecap="round" />
    </svg>
  ),
  courses: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H9v12H4.5A1.5 1.5 0 0 0 3 17.5v-12Z" />
      <path d="M17 5.5A1.5 1.5 0 0 0 15.5 4H11v12h4.5a1.5 1.5 0 0 1 1.5 1.5v-12Z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
      <path d="M7.5 17H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3.5" />
      <path d="M13 14l4-4-4-4" />
      <path d="M17 10H7.5" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M16 16l-3.2-3.2" strokeLinecap="round" />
    </svg>
  ),
};

function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [seatsByDept, setSeatsByDept] = useState({}); // { departmentName: seats } - only selected departments are keys
  const [requests, setRequests] = useState([]);
  const [newLevel, setNewLevel] = useState("Intermediate");
  const [departments, setDepartments] = useState([]);
  const [addMessage, setAddMessage] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [coursesRes, recsRes, deptRes, reqRes] = await Promise.all([
      api.get("/hr/courses"),
      api.get("/hr/course-recommendations"),
      api.get("/hr/departments"),
      api.get("/hr/course-requests"),
    ]);
    setRequests(reqRes.data);
    setCourses(coursesRes.data);
    setRecommendations(recsRes.data);
    setDepartments(deptRes.data);
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDept = (d) => {
    setSeatsByDept((prev) => {
      const next = { ...prev };
      if (d in next) delete next[d];
      else next[d] = "";
      return next;
    });
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setAddMessage(null);

    const allocations = Object.entries(seatsByDept).map(([department, seats]) => ({
      department,
      seats: Number(seats),
    }));
    if (allocations.length === 0) {
      setAddMessage({ type: "error", text: "Select at least one department" });
      return;
    }
    if (allocations.some((a) => !Number.isInteger(a.seats) || a.seats < 1)) {
      setAddMessage({ type: "error", text: "Enter how many persons are needed from each selected department" });
      return;
    }

    setAdding(true);
    try {
      const res = await api.post("/hr/courses", {
        skill: newSkill,
        courseName: newCourseName,
        requiredLevel: newLevel,
        duration: newDuration,
        startDate: newStartDate,
        allocations,
      });
      setAddMessage({ type: "success", text: res.data.message });
      setNewSkill("");
      setNewCourseName("");
      setNewDuration("");
      setNewStartDate("");
      setSeatsByDept({});
      setNewLevel("Intermediate");
      loadData();
    } catch (err) {
      setAddMessage({ type: "error", text: err.response?.data?.message || "Failed to add course" });
    } finally {
      setAdding(false);
    }
  };

  const confirmDeleteCourse = async () => {
    if (!deleteTarget) return;
    await api.delete(`/hr/courses/${deleteTarget._id}`);
    setDeleteTarget(null);
    loadData();
  };

  const filteredRecs = search.trim()
    ? recommendations.filter((r) => {
        const q = search.trim().toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.designation.toLowerCase().includes(q) ||
          r.recommendedCourse.toLowerCase().includes(q)
        );
      })
    : recommendations;

  return (
    <div className="hr-layout">
      <HRSidebar active="courses" />

      <main className="hr-main">
        <div className="hr-header">
          <div>
            <h1 className="hr-title">Manage Courses</h1>
            <p className="hr-subtitle">Add or remove courses, and see every course currently recommended</p>
          </div>
        </div>

        {/* Course Catalog: add/delete */}
        <div className="hr-panel hr-form-panel" style={{ maxWidth: "none" }}>
          <div className="hr-panel-accent" style={{ background: "var(--color-accent)" }} />
          <h3 className="hr-panel-title">Course Catalog ({courses.length})</h3>

          {addMessage && (
            <div className={`hr-form-message ${addMessage.type}`}>{addMessage.text}</div>
          )}

          <form onSubmit={handleAddCourse}>
            <div className="hr-form-row">
              <div className="hr-field">
                <label className="hr-field-label">Skill</label>
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g. Python"
                  required
                  className="hr-field-input"
                />
              </div>
              <div className="hr-field">
                <label className="hr-field-label">Course Name</label>
                <input
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Python for Data Analysis"
                  required
                  className="hr-field-input"
                />
              </div>
              <div className="hr-field">
                <label className="hr-field-label">Duration</label>
                <input
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="e.g. 2 weeks"
                  required
                  className="hr-field-input"
                />
              </div>
              <div className="hr-field">
                <label className="hr-field-label">Start Date</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  required
                  className="hr-field-input"
                />
              </div>
              <div className="hr-field full">
                <label className="hr-field-label">Departments and persons needed</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {departments.map((d) => {
                    const checked = d in seatsByDept;
                    return (
                      <div key={d} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "180px", fontSize: "14px" }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleDept(d)} />
                          {d}
                        </label>
                        {checked && (
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={seatsByDept[d]}
                            onChange={(e) => setSeatsByDept((prev) => ({ ...prev, [d]: e.target.value }))}
                            placeholder="Persons needed"
                            className="hr-field-input"
                            style={{ width: "150px" }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="hr-form-hint">
                  Tick one or more departments and enter how many persons you need from each. The request goes to
                  that department's manager, who picks the employees. Employees are notified only after the manager
                  selects them.
                </span>
              </div>
              <div className="hr-field">
                <label className="hr-field-label">Required Level</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="hr-field-input"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <span className="hr-form-hint">Level the department is expected to reach.</span>
              </div>
            </div>
            <button type="submit" disabled={adding} className="hr-form-btn">
              {adding ? "Adding..." : "+ Add Course"}
            </button>
          </form>

          {loading ? (
            <p className="hr-empty">Loading...</p>
          ) : courses.length === 0 ? (
            <p className="hr-empty">No courses in the catalog yet.</p>
          ) : (
            <table className="hr-table" style={{ marginTop: "20px" }}>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Course Name</th>
                  <th>Department</th>
                  <th>Used In (Designation - Department)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span className="hr-skill-chip" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-dark)" }}>
                        {c.skill}
                      </span>
                    </td>
                    <td>{c.courseName}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(c.departments && c.departments.length > 0 ? c.departments : [c.department || "All"]).map((d) => (
                          <span key={d} className="hr-dept-chip">{d}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {c.usedIn.length === 0 ? (
                        <span style={{ color: "var(--color-text-soft)", fontSize: "13px" }}>
                          Not currently required by any designation
                        </span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {c.usedIn.map((u, i) => (
                            <span key={i} className="hr-dept-chip">
                              {u.designation} ({u.department})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button onClick={() => setDeleteTarget(c)} className="hr-delete-btn">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Course requests: status per department and the managers' selections */}
        <div className="hr-table-panel" style={{ marginBottom: "24px", position: "relative", overflow: "hidden" }}>
          <div className="hr-panel-accent" style={{ background: "#B45309" }} />
          <h3 className="hr-panel-title">
            Course Requests <span className="hr-count-badge">{requests.length}</span>
          </h3>
          {requests.length === 0 ? (
            <p className="hr-empty">No course requests yet. Add a course above to send one to the managers.</p>
          ) : (
            requests.map((r) => (
              <div key={r._id} style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "14px 16px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <strong>{r.courseName}</strong>{" "}
                    <span className="hr-skill-chip" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-dark)" }}>
                      {r.skill}
                    </span>
                    <div style={{ fontSize: "12.5px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                      {r.duration} · starts {new Date(r.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <span
                    className={`hr-pill ${r.status === "Employees Selected" ? "hr-pill-ok" : "hr-pill-pending"}`}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {r.status}
                  </span>
                </div>
                <table className="hr-subtable" style={{ marginTop: "10px" }}>
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Persons needed</th>
                      <th>Status</th>
                      <th>Selected employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.allocations.map((a) => (
                      <tr key={a.department}>
                        <td>{a.department}</td>
                        <td>{a.seats}</td>
                        <td>
                          <span className={`hr-pill ${a.status === "Submitted" ? "hr-pill-ok" : "hr-pill-pending"}`}>
                            {a.status === "Submitted" ? "Selected" : "Waiting for manager"}
                          </span>
                        </td>
                        <td>
                          {a.selectedEmployees.length === 0
                            ? "-"
                            : a.selectedEmployees.map((e) => `${e.name} (${e.employeeId})`).join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>

        {/* All recommended courses across the org */}
        <div className="hr-table-panel">
          <div className="hr-panel-accent" style={{ background: "var(--color-gap)" }} />
          <div className="hr-panel-header">
            <h3 className="hr-panel-title">
              Recommended Courses <span className="hr-count-badge">{filteredRecs.length}</span>
            </h3>
            <div className="hr-search-box">
              {ICONS.search}
              <input
                type="text"
                placeholder="Search by name, designation, or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="hr-search-input"
              />
            </div>
          </div>

          {filteredRecs.length === 0 ? (
            <p className="hr-empty">No course recommendations generated yet.</p>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Skill Gap</th>
                  <th>Recommended Course</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecs.map((r, i) => {
                  const colors = avatarColor(r.name);
                  return (
                    <tr key={`${r.employeeId}-${r.skillGap}-${i}`}>
                      <td>
                        <div className="hr-employee-cell">
                          <div className="hr-avatar" style={{ background: colors.bg, color: colors.fg }}>
                            {initials(r.name)}
                          </div>
                          <div>
                            <div className="hr-employee-name">{r.name}</div>
                            <div className="hr-employee-id">{r.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td>{r.designation}</td>
                      <td>
                        <span className="hr-dept-chip">{r.department}</span>
                      </td>
                      <td>
                        <span className="hr-skill-chip" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                          {r.skillGap}
                        </span>
                      </td>
                      <td>{r.recommendedCourse}</td>
                      <td>{r.confidence}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this course mapping?"
        message={
          deleteTarget
            ? `This removes "${deleteTarget.courseName}" as the recommended course for "${deleteTarget.skill}". Employees with this gap will get a generic course name until you add a new mapping.`
            : ""
        }
        confirmLabel="Remove"
        danger
        onConfirm={confirmDeleteCourse}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default ManageCourses;