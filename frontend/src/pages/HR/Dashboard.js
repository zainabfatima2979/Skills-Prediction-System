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
  logout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
      <path d="M7.5 17H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3.5" />
      <path d="M13 14l4-4-4-4" />
      <path d="M17 10H7.5" />
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
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="3" width="10" height="18" rx="1" />
      <rect x="14" y="9" width="6" height="12" rx="1" />
      <path d="M7 7h1M10 7h1M7 11h1M10 11h1M7 15h1M10 15h1" strokeLinecap="round" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3 21.5 20H2.5L12 3Z" strokeLinejoin="round" />
      <path d="M12 10v4.4" strokeLinecap="round" />
      <circle cx="12" cy="17.4" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 3.2" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M16 16l-3.2-3.2" strokeLinecap="round" />
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
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // { employeeId, name }
  const [deleteError, setDeleteError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showAllGaps, setShowAllGaps] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [dashboardRes, employeesRes] = await Promise.all([
        api.get("/hr/dashboard"),
        api.get("/hr/employees"),
      ]);
      setStats(dashboardRes.data);
      setEmployees(employeesRes.data);
    } catch (err) {
      setLoadError(
        err.response?.data?.error || err.response?.data?.message || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeactivate = (employeeId, name) => {
    setDeleteError(null);
    setDeleteTarget({ employeeId, name });
  };

  const confirmDeactivate = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/hr/users/${deleteTarget.employeeId}`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to deactivate user");
    }
  };

  if (loading || !stats) {
    return (
      <div className="hr-layout">
        <div className="hr-main">
          {loadError ? (
            <div className="hr-form-message error">Failed to load dashboard: {loadError}</div>
          ) : (
            "Loading dashboard..."
          )}
        </div>
      </div>
    );
  }

  const departments = [...new Set(employees.map((e) => e.department))];
  let filteredEmployees = departmentFilter
    ? employees.filter((e) => e.department === departmentFilter)
    : employees;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filteredEmployees = filteredEmployees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q)
    );
  }

  const totalGaps = employees.reduce((sum, e) => sum + e.gapCount, 0);
  const maxGapCount = Math.max(...stats.topGaps.map((g) => g.count), 1);
  const maxLevelCount = Math.max(...stats.levelDistribution.map((l) => l.count), 1);

  const levelColors = {
    Beginner: "#9AD1CE",
    Intermediate: "#3FA39F",
    Advanced: "#0E7C7B",
  };

  return (
    <div className="hr-layout">
      <HRSidebar active="dashboard" />

      <main className="hr-main">
        <div className="hr-header">
          <div>
            <h1 className="hr-title">Dashboard</h1>
            <p className="hr-subtitle">Organization-wide skill overview</p>
          </div>
          <div className="hr-header-actions">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="hr-select"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <a href="/hr/create-user" className="hr-create-btn">+ Create Account</a>
          </div>
        </div>

        <div className="hr-stat-grid">
          <div className="hr-stat-card">
            <div className="hr-stat-icon" style={{ background: "#E6F5F4", color: "#0B6362" }}>
              {ICONS.people}
            </div>
            <div>
              <div className="hr-stat-number">{stats.totalEmployees}</div>
              <div className="hr-stat-label">Total employees</div>
            </div>
          </div>
          <div className="hr-stat-card">
            <div className="hr-stat-icon" style={{ background: "#EEF2FF", color: "#4338CA" }}>
              {ICONS.building}
            </div>
            <div>
              <div className="hr-stat-number">{departments.length}</div>
              <div className="hr-stat-label">Departments</div>
            </div>
          </div>
          <div className="hr-stat-card">
            <div className="hr-stat-icon" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
              {ICONS.alert}
            </div>
            <div>
              <div className="hr-stat-number">{totalGaps}</div>
              <div className="hr-stat-label">Total skill gaps</div>
            </div>
          </div>
          <div className="hr-stat-card">
            <div className="hr-stat-icon" style={{ background: "#FFFBEB", color: "#B45309" }}>
              {ICONS.clock}
            </div>
            <div>
              <div className="hr-stat-number">{stats.pendingReviewEmployees.length}</div>
              <div className="hr-stat-label">Pending reviews</div>
            </div>
          </div>
        </div>

        <div className="hr-panel-row">
          <div className="hr-panel">
            <div className="hr-panel-accent" style={{ background: "var(--color-gap)" }} />
            <h3 className="hr-panel-title">
              {showAllGaps ? "All skill gaps" : "Top skill gaps"}
            </h3>
            <p className="hr-hint-text">Click a skill to see everyone affected</p>
            {stats.topGaps.length === 0 ? (
              <p className="hr-empty">No skill gaps recorded yet.</p>
            ) : (
              (showAllGaps ? stats.topGaps : stats.topGaps.slice(0, 5)).map((g) => (
                <div
                  key={g.skill}
                  className="hr-bar-row hr-bar-row-clickable"
                  onClick={() => navigate(`/hr/skill-gap/${encodeURIComponent(g.skill)}`)}
                >
                  <span className="hr-bar-label">{g.skill}</span>
                  <div className="hr-bar-track">
                    <div
                      className="hr-bar-fill"
                      style={{
                        width: `${(g.count / maxGapCount) * 100}%`,
                        backgroundColor: "var(--color-gap)",
                      }}
                    />
                  </div>
                  <span className="hr-bar-value">{g.count}</span>
                </div>
              ))
            )}
            {stats.topGaps.length > 5 && (
              <button
                onClick={() => setShowAllGaps(!showAllGaps)}
                className="hr-view-btn"
                style={{ marginTop: 8 }}
              >
                {showAllGaps ? "Show top 5 only" : `Show all ${stats.topGaps.length} skills`}
              </button>
            )}
          </div>

          <div className="hr-panel">
            <div className="hr-panel-accent" style={{ background: "var(--color-accent)" }} />
            <h3 className="hr-panel-title">Skill level distribution</h3>
            {stats.levelDistribution.length === 0 ? (
              <p className="hr-empty">No predictions recorded yet.</p>
            ) : (
              stats.levelDistribution.map((l) => (
                <div key={l.level} className="hr-bar-row">
                  <span className="hr-bar-label">{l.level}</span>
                  <div className="hr-bar-track">
                    <div
                      className="hr-bar-fill"
                      style={{
                        width: `${(l.count / maxLevelCount) * 100}%`,
                        backgroundColor: levelColors[l.level] || "var(--color-accent)",
                      }}
                    />
                  </div>
                  <span className="hr-bar-value">{l.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="hr-table-panel">
          {deleteError && (
            <div className="hr-form-message error" style={{ marginBottom: "16px" }}>
              {deleteError}
            </div>
          )}
          <div className="hr-panel-header">
            <h3 className="hr-panel-title" style={{ margin: 0 }}>
              Employees <span className="hr-count-badge">{filteredEmployees.length}</span>
            </h3>
            <div className="hr-search-box">
              {ICONS.search}
              <input
                type="text"
                placeholder="Search by name, ID, or designation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="hr-search-input"
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <p className="hr-empty">No employees found.</p>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>OK</th>
                  <th>Gap</th>
                  <th>Pending</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((e) => {
                  const colors = avatarColor(e.name);
                  return (
                    <tr key={e.employeeId}>
                      <td>
                        <div className="hr-employee-cell">
                          <div
                            className="hr-avatar"
                            style={{ background: colors.bg, color: colors.fg }}
                          >
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
                      <td>
                        <span className="hr-pill hr-pill-ok">{e.okCount}</span>
                      </td>
                      <td>
                        <span className="hr-pill hr-pill-gap">{e.gapCount}</span>
                      </td>
                      <td>
                        <span className="hr-pill hr-pill-pending">{e.pendingCount}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/hr/employee/${e.employeeId}`)}
                          className="hr-edit-btn"
                        >
                          Predict
                        </button>
                        <button
                          onClick={() => navigate(`/hr/edit-user/${e.employeeId}`)}
                          className="hr-edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(e.employeeId, e.name)}
                          className="hr-delete-btn"
                        >
                          Deactivate
                        </button>
                      </td>
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
        title="Deactivate this account?"
        message={
          deleteTarget
            ? `${deleteTarget.name} (${deleteTarget.employeeId}) will no longer be able to log in. Their profile, reviews, predictions and history stay saved, and you can view them under Deactivated Employees or reactivate the account any time.`
            : ""
        }
        confirmLabel="Deactivate"
        danger
        onConfirm={confirmDeactivate}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Dashboard;