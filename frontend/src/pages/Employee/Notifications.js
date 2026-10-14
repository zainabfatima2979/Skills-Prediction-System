import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import EmployeeSidebar from "./EmployeeSidebar";
import "./EmployeeLayout.css";

function Notifications() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/employee/notifications")
      .then((res) => setNotices(res.data))
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/employee/notifications/${id}/read`);
      setNotices((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      // leave it unread if the request fails
    }
  };

  const unreadCount = notices.filter((n) => !n.isRead).length;

  return (
    <div className="emp-layout">
      <EmployeeSidebar active="notifications" />

      <main className="emp-main">
        <h1 className="emp-title">Notifications</h1>
        <p className="emp-subtitle">
          {user?.name} &middot; Messages from HR about your courses
        </p>

        <div className="emp-panel">
          <div className="emp-panel-accent" />
          <h3 className="emp-panel-title">
            Course Messages ({notices.length}
            {unreadCount > 0 ? `, ${unreadCount} unread` : ""})
          </h3>

          {loading ? (
            <p className="emp-empty">Loading...</p>
          ) : notices.length === 0 ? (
            <p className="emp-empty">No messages from HR yet.</p>
          ) : (
            notices.map((n) => (
              <div
                key={n._id}
                className="emp-course-card"
                style={n.isRead ? undefined : { borderLeft: "4px solid var(--color-accent)" }}
              >
                <span className="emp-course-skill-tag">Skill: {n.skill}</span>
                <div className="emp-course-name">{n.courseName}</div>
                <div style={{ margin: "8px 0", lineHeight: 1.5 }}>{n.message}</div>
                <div className="emp-course-confidence">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n._id)}
                    className="emp-btn"
                    style={{ marginTop: 10 }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default Notifications;