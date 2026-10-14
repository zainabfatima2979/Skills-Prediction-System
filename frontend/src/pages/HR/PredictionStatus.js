import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  courses: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H9v12H4.5A1.5 1.5 0 0 0 3 17.5v-12Z" />
      <path d="M17 5.5A1.5 1.5 0 0 0 15.5 4H11v12h4.5a1.5 1.5 0 0 1 1.5 1.5v-12Z" />
    </svg>
  ),
};

function PredictionStatus() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("notPredicted"); // "notPredicted" | "predicted"
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/hr/prediction-status").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading || !data) {
    return (
      <div className="hr-layout">
        <div className="hr-main">Loading...</div>
      </div>
    );
  }

  const list = tab === "predicted" ? data.predicted : data.notPredicted;
  const filtered = search.trim()
    ? list.filter(
        (e) =>
          e.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          e.designation.toLowerCase().includes(search.trim().toLowerCase())
      )
    : list;

  const predictedPct = data.totalEmployees
    ? Math.round((data.predicted.length / data.totalEmployees) * 100)
    : 0;

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
          <a href="/hr/status/gap" className="hr-nav-link">{ICONS.gap}Skill Gaps</a>
          <a href="/hr/status/ok" className="hr-nav-link">{ICONS.ok}Meeting Requirement</a>
          <a href="/hr/prediction-status" className="hr-nav-link active">{ICONS.predictionStatus}Prediction Status</a>
          <a href="/hr/courses" className="hr-nav-link">{ICONS.courses}Manage Courses</a>
        </nav>

        <div className="hr-sidebar-footer">
          <div className="hr-user-name">{user?.name}</div>
          <div className="hr-user-role">{user?.designation}</div>
          <button onClick={handleLogout} className="hr-logout-btn">{ICONS.logout} Log out</button>
        </div>
      </aside>

      <main className="hr-main">
        <div className="hr-header">
          <div>
            <h1 className="hr-title">Prediction Status</h1>
            <p className="hr-subtitle">Who has run their AI skill prediction, and who hasn't</p>
          </div>
        </div>

        <div className="hr-stat-grid">
          <div className="hr-stat-card">
            <div className="hr-stat-icon" style={{ background: "#E6F5F4", color: "#0B6362" }}>
              {ICONS.predictionStatus}
            </div>
            <div>
              <div className="hr-stat-number">{data.predicted.length}</div>
              <div className="hr-stat-label">Predicted ({predictedPct}%)</div>
            </div>
          </div>
          <div className="hr-stat-card">
            <div className="hr-stat-icon" style={{ background: "#FEF3C7", color: "#B45309" }}>
              {ICONS.pending}
            </div>
            <div>
              <div className="hr-stat-number">{data.notPredicted.length}</div>
              <div className="hr-stat-label">Never predicted</div>
            </div>
          </div>
          <div className="hr-stat-card">
            <div className="hr-stat-icon" style={{ background: "#EEF2FF", color: "#4338CA" }}>
              {ICONS.dashboard}
            </div>
            <div>
              <div className="hr-stat-number">{data.totalEmployees}</div>
              <div className="hr-stat-label">Total employees</div>
            </div>
          </div>
        </div>

        <div className="hr-table-panel">
          <div className="hr-panel-accent" style={{ background: tab === "predicted" ? "var(--color-ok)" : "var(--color-pending)" }} />
          <div className="hr-panel-header">
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setTab("notPredicted")}
                className="hr-role-option"
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  background: tab === "notPredicted" ? "var(--color-pending, #B45309)" : "#fff",
                  color: tab === "notPredicted" ? "#fff" : "var(--color-text-muted)",
                  padding: "7px 16px",
                }}
              >
                Never Predicted ({data.notPredicted.length})
              </button>
              <button
                onClick={() => setTab("predicted")}
                className="hr-role-option"
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  background: tab === "predicted" ? "var(--color-ok, #166534)" : "#fff",
                  color: tab === "predicted" ? "#fff" : "var(--color-text-muted)",
                  padding: "7px 16px",
                }}
              >
                Predicted ({data.predicted.length})
              </button>
            </div>
            <div className="hr-search-box">
              {ICONS.search}
              <input
                type="text"
                placeholder="Search by name or designation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="hr-search-input"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="hr-empty">
              {tab === "notPredicted"
                ? "Everyone has run their prediction at least once."
                : "No one has run a prediction yet."}
            </p>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const colors = avatarColor(e.name);
                  return (
                    <tr key={e.employeeId}>
                      <td>
                        <div className="hr-employee-cell">
                          <div className="hr-avatar" style={{ background: colors.bg, color: colors.fg }}>
                            {initials(e.name)}
                          </div>
                          <div>
                            <div className="hr-employee-name">{e.name}</div>
                            <div className="hr-employee-id">{e.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td>{e.designation}</td>
                      <td>
                        <span className="hr-dept-chip">{e.department}</span>
                      </td>
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

export default PredictionStatus;