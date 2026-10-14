import { useState, useEffect } from "react";
import api from "../../services/api";
import ManagerSidebar from "./ManagerSidebar";
import { avatarColor, initials, ICONS } from "./icons";
import "./ManagerLayout.css";

function ReviewHistory() {
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ pending: null, completed: null });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/manager/history").then((res) => {
      setRecords(res.data);
      setLoading(false);
    });
    api.get("/manager/overview").then((res) => {
      setCounts({ pending: res.data.pending.length, completed: res.data.completed.length });
    });
  }, []);

  const filtered = search.trim()
    ? records.filter((r) => {
        const q = search.trim().toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.skill.toLowerCase().includes(q) ||
          r.designation.toLowerCase().includes(q)
        );
      })
    : records;

  const ratingColor = (rating) => {
    if (rating >= 4) return { bg: "#DCFCE7", fg: "#166534" };
    if (rating === 3) return { bg: "#FEF3C7", fg: "#92400E" };
    return { bg: "#FEE2E2", fg: "#B91C1C" };
  };

  return (
    <div className="mgr-layout">
      <ManagerSidebar active="history" pendingCount={counts.pending} completedCount={counts.completed} />

      <main className="mgr-main">
        <h1 className="mgr-title">Review History</h1>
        <p className="mgr-subtitle">Every skill that has been rated, with rating and remarks</p>

        <div className="mgr-panel">
          <div className="mgr-panel-accent" style={{ background: "var(--color-accent)" }} />
          <div className="mgr-panel-header">
            <h3 className="mgr-panel-title">
              Reviewed Skills <span className="mgr-count-badge">{filtered.length}</span>
            </h3>
            <div className="mgr-search-box">
              {ICONS.search}
              <input
                type="text"
                placeholder="Search by name, skill, or designation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mgr-search-input"
              />
            </div>
          </div>

          {loading ? (
            <p className="mgr-empty">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="mgr-empty">No reviews submitted yet.</p>
          ) : (
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Skill</th>
                  <th>Required Level</th>
                  <th>Score</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const empColors = avatarColor(r.name);
                  const rColors = ratingColor(r.rating);
                  return (
                    <tr key={`${r.employeeId}-${r.skill}-${i}`}>
                      <td>
                        <div className="mgr-employee-cell">
                          <div className="mgr-avatar" style={{ background: empColors.bg, color: empColors.fg }}>
                            {initials(r.name)}
                          </div>
                          <div>
                            <div className="mgr-employee-name">{r.name}</div>
                            <div className="mgr-employee-id">{r.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="mgr-skill-chip" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-dark)" }}>
                          {r.skill}
                        </span>
                      </td>
                      <td>{r.requiredLevel}</td>
                      <td>
                        <span
                          className="mgr-rating-badge"
                          style={{ background: rColors.bg, color: rColors.fg }}
                        >
                          {r.rating}/5
                        </span>
                      </td>
                      <td style={{ maxWidth: "280px", color: "var(--color-text-muted)" }}>
                        {r.comment || <span style={{ color: "var(--color-text-soft)" }}>No comment</span>}
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

export default ReviewHistory;