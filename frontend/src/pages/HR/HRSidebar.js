import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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
  heatmap: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="8" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="13.5" y="2.5" width="4" height="4.5" rx="1" />
      <rect x="2.5" y="8" width="4.5" height="4.5" rx="1" />
      <rect x="8" y="8" width="4.5" height="4.5" rx="1" />
      <rect x="13.5" y="8" width="4" height="4.5" rx="1" />
    </svg>
  ),
  roi: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2.5 15.5 7 9l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 5h3v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  deactivated: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M7 7l6 6M13 7l-6 6" strokeLinecap="round" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
      <path d="M7.5 17H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3.5" />
      <path d="M13 14l4-4-4-4" />
      <path d="M17 10H7.5" />
    </svg>
  ),
};

// One shared sidebar for every HR page, so the links, colors, and live
// counts (Pending Reviews / Skill Gaps / Meeting Requirement) always stay
// the same everywhere instead of each page keeping its own copy.
function HRSidebar({ active }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState(null); // { pending, gap, ok }

  useEffect(() => {
    api
      .get("/hr/status-counts")
      .then((res) => setCounts(res.data))
      .catch(() => setCounts(null));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const Count = ({ n }) =>
    n != null ? <span className="hr-nav-count">{n}</span> : null;

  return (
    <aside className="hr-sidebar">
      <div>
        <div className="hr-brand">Skill Indicator</div>
        <div className="hr-brand-sub">HR Console</div>
      </div>

      <nav className="hr-nav">
        <a href="/hr" className={`hr-nav-link ${active === "dashboard" ? "active" : ""}`}>
          {ICONS.dashboard}
          Dashboard
        </a>
        <a href="/hr/create-user" className={`hr-nav-link ${active === "create-user" ? "active" : ""}`}>
          {ICONS.createUser}
          Create Account
        </a>
        <a href="/hr/status/pending" className={`hr-nav-link ${active === "pending" ? "active" : ""}`}>
          {ICONS.pending}
          Pending Reviews
          <Count n={counts?.pending} />
        </a>
        <a href="/hr/status/gap" className={`hr-nav-link ${active === "gap" ? "active" : ""}`}>
          {ICONS.gap}
          Skill Gaps
          <Count n={counts?.gap} />
        </a>
        <a href="/hr/status/ok" className={`hr-nav-link ${active === "ok" ? "active" : ""}`}>
          {ICONS.ok}
          Meeting Requirement
          <Count n={counts?.ok} />
        </a>
        <a href="/hr/prediction-status" className={`hr-nav-link ${active === "prediction-status" ? "active" : ""}`}>
          {ICONS.predictionStatus}
          Prediction Status
        </a>
        <a href="/hr/courses" className={`hr-nav-link ${active === "courses" ? "active" : ""}`}>
          {ICONS.courses}
          Manage Courses
        </a>
        
        <a href="/hr/deactivated" className={`hr-nav-link ${active === "deactivated" ? "active" : ""}`}>
          {ICONS.deactivated}
          Deactivated Employees
        </a>
      </nav>

      <div className="hr-sidebar-footer">
        <div className="hr-user-name">{user?.name}</div>
        <div className="hr-user-role">{user?.designation}</div>
        <button onClick={handleLogout} className="hr-logout-btn">
          {ICONS.logout} Log out
        </button>
      </div>
    </aside>
  );
}

export default HRSidebar;