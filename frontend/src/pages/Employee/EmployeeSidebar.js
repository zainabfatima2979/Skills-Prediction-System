import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ICONS } from "./icons";

function EmployeeSidebar({ active }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="emp-sidebar">
      <div>
        <div className="emp-brand">Skill Indicator</div>
        <div className="emp-brand-sub">Employee Console</div>
      </div>

      <nav className="emp-nav">
        <a href="/employee" className={`emp-nav-link ${active === "profile" ? "active" : ""}`}>
          {ICONS.profile} My Profile
        </a>
        <a href="/employee/predictions" className={`emp-nav-link ${active === "predictions" ? "active" : ""}`}>
          {ICONS.prediction} Skill Prediction
        </a>
        <a href="/employee/courses" className={`emp-nav-link ${active === "courses" ? "active" : ""}`}>
          {ICONS.courses} Recommended Courses
        </a>
        <a href="/employee/history" className={`emp-nav-link ${active === "history" ? "active" : ""}`}>
          {ICONS.history} Skill History
        </a>
        <a href="/employee/notifications" className={`emp-nav-link ${active === "notifications" ? "active" : ""}`}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
            <path d="M5 8a5 5 0 0 1 10 0c0 4 1.5 5 1.5 5h-13S5 12 5 8Z" strokeLinejoin="round" />
            <path d="M8.5 16a1.6 1.6 0 0 0 3 0" strokeLinecap="round" />
          </svg>{" "}
          Notifications
        </a>
      </nav>

      <div className="emp-sidebar-footer">
        <div className="emp-user-name">{user?.name}</div>
        <div className="emp-user-role">{user?.designation}</div>
        <button onClick={handleLogout} className="emp-logout-btn">
          {ICONS.logout} Log out
        </button>
      </div>
    </aside>
  );
}

export default EmployeeSidebar;