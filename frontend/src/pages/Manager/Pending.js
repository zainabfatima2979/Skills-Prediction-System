import { useState, useEffect } from "react";
import api from "../../services/api";
import ManagerSidebar from "./ManagerSidebar";
import { avatarColor, initials, ICONS } from "./icons";
import "./ManagerLayout.css";

function Pending() {
  const [list, setList] = useState([]);
  const [counts, setCounts] = useState({ pending: null, completed: null });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/manager/overview").then((res) => {
      setList(res.data.pending);
      setCounts({ pending: res.data.pending.length, completed: res.data.completed.length });
      setLoading(false);
    });
  }, []);

  const filtered = search.trim()
    ? list.filter((e) => {
        const q = search.trim().toLowerCase();
        return e.name.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q);
      })
    : list;

  const avgProgress = list.length
    ? Math.round((list.reduce((s, e) => s + e.reviewed / e.total, 0) / list.length) * 100)
    : 0;

  return (
    <div className="mgr-layout">
      <ManagerSidebar active="pending" pendingCount={counts.pending} completedCount={counts.completed} />

      <main className="mgr-main">
        <h1 className="mgr-title">Pending Reviews</h1>
        <p className="mgr-subtitle">Employees who still have at least one skill left to rate</p>

        <div className="mgr-stat-grid">
          <div className="mgr-stat-card">
            <div className="mgr-stat-icon" style={{ background: "#FFFBEB", color: "#B45309" }}>
              {ICONS.pending}
            </div>
            <div>
              <div className="mgr-stat-number">{list.length}</div>
              <div className="mgr-stat-label">Employees pending</div>
            </div>
          </div>
          <div className="mgr-stat-card">
            <div className="mgr-stat-icon" style={{ background: "#EEF2FF", color: "#4338CA" }}>
              {ICONS.completed}
            </div>
            <div>
              <div className="mgr-stat-number">{avgProgress}%</div>
              <div className="mgr-stat-label">Average progress</div>
            </div>
          </div>
          <div className="mgr-stat-card">
            <div className="mgr-stat-icon" style={{ background: "#F0FDF4", color: "#166534" }}>
              {ICONS.completed}
            </div>
            <div>
              <div className="mgr-stat-number">{counts.completed}</div>
              <div className="mgr-stat-label">Already completed</div>
            </div>
          </div>
        </div>

        <div className="mgr-panel">
          <div className="mgr-panel-accent" style={{ background: "var(--color-pending, #B45309)" }} />
          <div className="mgr-panel-header">
            <h3 className="mgr-panel-title">
              Employees <span className="mgr-count-badge">{filtered.length}</span>
            </h3>
            <div className="mgr-search-box">
              {ICONS.search}
              <input
                type="text"
                placeholder="Search by name or designation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mgr-search-input"
              />
            </div>
          </div>

          {loading ? (
            <p className="mgr-empty">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="mgr-empty">Nothing pending - every employee is fully reviewed.</p>
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
                {filtered.map((e) => {
                  const colors = avatarColor(e.name);
                  const pct = e.total > 0 ? (e.reviewed / e.total) * 100 : 0;
                  return (
                    <tr key={e.employeeId}>
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
                        <span className="mgr-progress-track">
                          <span
                            className="mgr-progress-fill"
                            style={{ width: `${pct}%`, background: "#B45309" }}
                          />
                        </span>
                        {e.reviewed}/{e.total} skills
                      </td>
                      <td>
                        <a href={`/manager?employee=${e.employeeId}`} className="mgr-rate-btn">
                          Rate Now
                        </a>
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

export default Pending;