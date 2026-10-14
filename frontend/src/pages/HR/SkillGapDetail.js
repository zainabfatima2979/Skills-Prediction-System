import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { avatarColor, initials } from "../../utils/avatar";
import "./Dashboard.css";

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
  back: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <path d="M12.5 4.5 6 10l6.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function SkillGapDetail() {
  const { skillName } = useParams();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const decodedSkill = decodeURIComponent(skillName);

  useEffect(() => {
    setLoading(true);
    api.get("/hr/predictions?status=Gap").then((res) => {
      setRecords(res.data.filter((r) => r.skill === decodedSkill));
      setLoading(false);
    });
  }, [decodedSkill]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filtered = search.trim()
    ? records.filter((r) => {
        const q = search.trim().toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.designation.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q)
        );
      })
    : records;

  return (
    <div className="hr-layout">
      <aside className="hr-sidebar">
        <div>
          <div className="hr-brand">Skill Indicator</div>
          <div className="hr-brand-sub">HR Console</div>
        </div>

        <nav className="hr-nav">
          <a href="/hr" className="hr-nav-link">{ICONS.dashboard}Dashboard</a>
          <a href="/hr/create-user" className="hr-nav-link">{ICONS.createUser}Create Account</a>
          <a href="/hr/status/pending" className="hr-nav-link">{ICONS.pending}Pending Reviews</a>
          <a href="/hr/status/gap" className="hr-nav-link active">{ICONS.gap}Skill Gaps</a>
          <a href="/hr/status/ok" className="hr-nav-link">{ICONS.ok}Meeting Requirement</a>
          <a href="/hr/prediction-status" className="hr-nav-link">{ICONS.predictionStatus}Prediction Status</a>
          <a href="/hr/courses" className="hr-nav-link">{ICONS.courses}Manage Courses</a>
        </nav>

        <div className="hr-sidebar-footer">
          <div className="hr-user-name">{user?.name}</div>
          <div className="hr-user-role">{user?.designation}</div>
          <button onClick={handleLogout} className="hr-logout-btn">{ICONS.logout} Log out</button>
        </div>
      </aside>

      <main className="hr-main">
        <a href="/hr" className="hr-back-link">{ICONS.back} Back to Dashboard</a>

        <div className="hr-edit-profile-header">
          <div className="hr-avatar hr-avatar-lg" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
            {ICONS.gap}
          </div>
          <div>
            <h1 className="hr-title" style={{ marginBottom: "2px" }}>{decodedSkill}</h1>
            <p className="hr-subtitle" style={{ margin: 0 }}>
              {records.length} employee{records.length !== 1 ? "s" : ""} with a gap in this skill
            </p>
          </div>
        </div>

        <div className="hr-table-panel">
          <div className="hr-panel-accent" style={{ background: "var(--color-gap)" }} />
          <div className="hr-panel-header">
            <h3 className="hr-panel-title">
              Affected Employees <span className="hr-count-badge">{filtered.length}</span>
            </h3>
            <div className="hr-search-box">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="M16 16l-3.2-3.2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, designation, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="hr-search-input"
              />
            </div>
          </div>

          {loading ? (
            <p className="hr-empty">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="hr-empty">No employees currently have a gap in this skill.</p>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Predicted Score</th>
                  <th>Predicted Level</th>
                  <th>Required Level</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const colors = avatarColor(r.name);
                  return (
                    <tr key={r.employeeId}>
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
                      <td>{r.predictedScore ?? "-"}</td>
                      <td>{r.predictedLevel ?? "-"}</td>
                      <td>{r.requiredLevel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default SkillGapDetail;