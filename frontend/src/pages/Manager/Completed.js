import { useState, useEffect } from "react";
import api from "../../services/api";
import ManagerSidebar from "./ManagerSidebar";
import { avatarColor, initials, ICONS } from "./icons";
import "./ManagerLayout.css";

function Completed() {
  const [list, setList] = useState([]);
  const [counts, setCounts] = useState({ pending: null, completed: null });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/manager/overview").then((res) => {
      setList(res.data.completed);
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

  return (
    <div className="mgr-layout">
      <ManagerSidebar active="completed" pendingCount={counts.pending} completedCount={counts.completed} />

      <main className="mgr-main">
        <h1 className="mgr-title">Completed Reviews</h1>
        <p className="mgr-subtitle">Employees whose required skills have all been rated</p>

        <div className="mgr-stat-grid">
          <div className="mgr-stat-card">
            <div className="mgr-stat-icon" style={{ background: "#F0FDF4", color: "#166534" }}>
              {ICONS.completed}
            </div>
            <div>
              <div className="mgr-stat-number">{list.length}</div>
              <div className="mgr-stat-label">Fully reviewed</div>
            </div>
          </div>
          <div className="mgr-stat-card">
            <div className="mgr-stat-icon" style={{ background: "#FFFBEB", color: "#B45309" }}>
              {ICONS.pending}
            </div>
            <div>
              <div className="mgr-stat-number">{counts.pending}</div>
              <div className="mgr-stat-label">Still pending</div>
            </div>
          </div>
          <div className="mgr-stat-card">
            <div className="mgr-stat-icon" style={{ background: "#EEF2FF", color: "#4338CA" }}>
              {ICONS.completed}
            </div>
            <div>
              <div className="mgr-stat-number">
                {counts.pending + counts.completed > 0
                  ? Math.round((list.length / (counts.pending + counts.completed)) * 100)
                  : 0}%
              </div>
              <div className="mgr-stat-label">Completion rate</div>
            </div>
          </div>
        </div>

        <div className="mgr-panel">
          <div className="mgr-panel-accent" style={{ background: "#166534" }} />
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
            <p className="mgr-empty">No employees fully reviewed yet.</p>
          ) : (
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Skills Reviewed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const colors = avatarColor(e.name);
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
                        <span className="mgr-rating-badge">{ICONS.completed} {e.reviewed}/{e.total}</span>
                      </td>
                      <td>
                        <a href={`/manager?employee=${e.employeeId}`} className="mgr-rate-btn" style={{ background: "var(--color-text-muted)" }}>
                          Update
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

export default Completed;