import { useState, useEffect, Fragment } from "react";
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 3.2" strokeLinecap="round" />
    </svg>
  ),
  gap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3 21.5 20H2.5L12 3Z" strokeLinejoin="round" />
      <path d="M12 10v4.4" strokeLinecap="round" />
      <circle cx="12" cy="17.4" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  ok: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 12.3l2.8 2.8L16.8 8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  navPending: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6v4l2.6 2.6" />
    </svg>
  ),
  navGap: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2.5 18 16H2L10 2.5Z" strokeLinejoin="round" />
      <path d="M10 8v3.2" strokeLinecap="round" />
      <circle cx="10" cy="13.6" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  navOk: (
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
  back: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <path d="M12.5 4.5 6 10l6.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
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

const STATUS_MAP = {
  pending: {
    label: "Review Pending",
    value: "Review Pending",
    color: "#B45309",
    bg: "#FFFBEB",
    icon: ICONS.pending,
  },
  gap: {
    label: "Skill Gaps",
    value: "Gap",
    color: "#B91C1C",
    bg: "#FEF2F2",
    icon: ICONS.gap,
  },
  ok: {
    label: "Meeting Requirement",
    value: "OK",
    color: "#166534",
    bg: "#F0FDF4",
    icon: ICONS.ok,
  },
};

function StatusList() {
  const { status } = useParams();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const config = STATUS_MAP[status];

  useEffect(() => {
    if (!config) return;
    setLoading(true);
    api.get(`/hr/predictions?status=${encodeURIComponent(config.value)}`).then((res) => {
      setRecords(res.data);
      setLoading(false);
    });
    // eslint-disable-next-line
  }, [status]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!config) {
    return <div className="hr-main">Unknown status: {status}</div>;
  }

  const filtered = search.trim()
    ? records.filter((r) => {
        const q = search.trim().toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.designation.toLowerCase().includes(q) ||
          r.skill.toLowerCase().includes(q)
        );
      })
    : records;

  // Group flat skill records by employee so each employee appears once,
  // with all their skills in this category nested underneath
  const grouped = [];
  const groupMap = {};
  filtered.forEach((r) => {
    if (!groupMap[r.employeeId]) {
      groupMap[r.employeeId] = {
        employeeId: r.employeeId,
        name: r.name,
        designation: r.designation,
        department: r.department,
        skills: [],
      };
      grouped.push(groupMap[r.employeeId]);
    }
    groupMap[r.employeeId].skills.push(r);
  });

  const toggleExpand = (employeeId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

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
          <a href="/hr/status/pending" className={`hr-nav-link ${status === "pending" ? "active" : ""}`}>
            {ICONS.navPending}Pending Reviews
          </a>
          <a href="/hr/status/gap" className={`hr-nav-link ${status === "gap" ? "active" : ""}`}>
            {ICONS.navGap}Skill Gaps
          </a>
          <a href="/hr/status/ok" className={`hr-nav-link ${status === "ok" ? "active" : ""}`}>
            {ICONS.navOk}Meeting Requirement
          </a>
          <a href="/hr/prediction-status" className="hr-nav-link">
            {ICONS.predictionStatus}Prediction Status
          </a>
          <a href="/hr/courses" className="hr-nav-link">
            {ICONS.courses}Manage Courses
          </a>
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
          <div className="hr-avatar hr-avatar-lg" style={{ background: config.bg, color: config.color }}>
            {config.icon}
          </div>
          <div>
            <h1 className="hr-title" style={{ marginBottom: "2px" }}>{config.label}</h1>
            <p className="hr-subtitle" style={{ margin: 0 }}>
              {records.length} record{records.length !== 1 ? "s" : ""} across the organization
            </p>
          </div>
        </div>

        <div className="hr-table-panel">
          <div className="hr-panel-accent" style={{ background: config.color }} />
          <div className="hr-panel-header">
            <h3 className="hr-panel-title" style={{ margin: 0 }}>
              Employees <span className="hr-count-badge">{grouped.length}</span>
            </h3>
            <div className="hr-search-box">
              {ICONS.search}
              <input
                type="text"
                placeholder="Search by name, designation, or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="hr-search-input"
              />
            </div>
          </div>

          {loading ? (
            <p className="hr-empty">Loading...</p>
          ) : grouped.length === 0 ? (
            <p className="hr-empty">No records in this category.</p>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Skills</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((emp) => {
                  const colors = avatarColor(emp.name);
                  const isOpen = expanded.has(emp.employeeId);
                  return (
                    <Fragment key={emp.employeeId}>
                      <tr>
                        <td>
                          <div className="hr-employee-cell">
                            <div className="hr-avatar" style={{ background: colors.bg, color: colors.fg }}>
                              {initials(emp.name)}
                            </div>
                            <div>
                              <div className="hr-employee-name">{emp.name}</div>
                              <div className="hr-employee-id">{emp.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td>{emp.designation}</td>
                        <td>
                          <span className="hr-dept-chip">{emp.department}</span>
                        </td>
                        <td>
                          <span className="hr-count-badge">{emp.skills.length}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleExpand(emp.employeeId)}
                            className="hr-view-btn"
                            style={{ color: config.color, borderColor: config.color }}
                          >
                            {isOpen ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={5} style={{ padding: 0, background: config.bg }}>
                            <table className="hr-subtable">
                              <thead>
                                <tr>
                                  <th>Skill</th>
                                  <th>Predicted Score</th>
                                  <th>Predicted Level</th>
                                  <th>Required Level</th>
                                </tr>
                              </thead>
                              <tbody>
                                {emp.skills.map((s, i) => (
                                  <tr key={i}>
                                    <td>
                                      <span
                                        className="hr-skill-chip"
                                        style={{ background: "#fff", color: config.color }}
                                      >
                                        {s.skill}
                                      </span>
                                    </td>
                                    <td>{s.predictedScore ?? "-"}</td>
                                    <td>{s.predictedLevel ?? "-"}</td>
                                    <td>{s.requiredLevel}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

export default StatusList;