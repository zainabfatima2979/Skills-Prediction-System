import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ICONS } from "./icons";

function ManagerSidebar({ active, pendingCount, completedCount, requestCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="mgr-sidebar">
      <div>
        <div className="mgr-brand">Skill Indicator</div>
        <div className="mgr-brand-sub">Manager Console</div>
      </div>

      <nav className="mgr-nav">
        <a href="/manager" className={`mgr-nav-link ${active === "rate" ? "active" : ""}`}>
          {ICONS.rate} Rate Employee
        </a>
        <a href="/manager/pending" className={`mgr-nav-link ${active === "pending" ? "active" : ""}`}>
          {ICONS.pending} Pending
          {pendingCount != null && <span className="mgr-nav-count">{pendingCount}</span>}
        </a>
        <a href="/manager/completed" className={`mgr-nav-link ${active === "completed" ? "active" : ""}`}>
          {ICONS.completed} Completed
          {completedCount != null && <span className="mgr-nav-count">{completedCount}</span>}
        </a>
        <a href="/manager/course-requests" className={`mgr-nav-link ${active === "course-requests" ? "active" : ""}`}>
          {ICONS.history} Course Requests
          {requestCount != null && requestCount > 0 && <span className="mgr-nav-count">{requestCount}</span>}
        </a>
        <a href="/manager/course-needs" className={`mgr-nav-link ${active === "course-needs" ? "active" : ""}`}>
          {ICONS.completed} Who Needs Courses
        </a>
        <a href="/manager/history" className={`mgr-nav-link ${active === "history" ? "active" : ""}`}>
          {ICONS.history} Review History
        </a>
      </nav>

      <div className="mgr-sidebar-footer">
        <div className="mgr-user-name">{user?.name}</div>
        <div className="mgr-user-role">{user?.designation}</div>
        <button onClick={handleLogout} className="mgr-logout-btn">
          {ICONS.logout} Log out
        </button>
      </div>
    </aside>
  );
}

export default ManagerSidebar;