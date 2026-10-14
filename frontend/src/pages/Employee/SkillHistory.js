import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import EmployeeSidebar from "./EmployeeSidebar";
import "./EmployeeLayout.css";

const LINE_COLORS = ["#0E7C7B", "#4338CA", "#B45309", "#B91C1C", "#0D9488", "#7C3AED"];

function SkillHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/employee/history")
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  // Reshape flat history rows into recharts format:
  // [{ date: "Sep 20 14:32", React: 62, MongoDB: 45 }, { date: "Sep 27 09:10", React: 70, MongoDB: 50 }]
  // Grouped down to the minute (not just the day) - HR can run predictions more
  // than once on the same day, and each run needs to stay its own point on the
  // trend line instead of collapsing into one.
  const skills = [...new Set(history.map((h) => h.skill))];
  const dateMap = {};
  history.forEach((h) => {
    if (h.predictedScore === null) return; // skip "Review Pending" points with no score
    const d = new Date(h.recordedAt);
    const dateKey = d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey, _sortKey: d.getTime() };
    dateMap[dateKey][h.skill] = h.predictedScore;
  });
  const chartData = Object.values(dateMap).sort((a, b) => a._sortKey - b._sortKey);

  return (
    <div className="emp-layout">
      <EmployeeSidebar active="history" />

      <main className="emp-main">
        <h1 className="emp-title">Skill History</h1>
        <p className="emp-subtitle">
          {user?.name} &middot; How your predicted scores have changed over time
        </p>

        <div className="emp-panel">
          <div className="emp-panel-accent" />
          <h3 className="emp-panel-title">Score Trend</h3>

          {loading ? (
            <p className="emp-empty">Loading...</p>
          ) : chartData.length === 0 ? (
            <p className="emp-empty">
              No history yet. Run your prediction a few times (after profile or review updates)
              to start seeing your trend here.
            </p>
          ) : chartData.length === 1 ? (
            <p className="emp-empty">
              Only one prediction recorded so far. Run it again after your profile or reviews
              change to see a trend line.
            </p>
          ) : (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  {skills.map((skill, i) => (
                    <Line
                      key={skill}
                      type="monotone"
                      dataKey={skill}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="emp-panel">
          <h3 className="emp-panel-title">All Recorded Runs ({history.length})</h3>
          {history.length === 0 ? (
            <p className="emp-empty">No prediction runs recorded yet.</p>
          ) : (
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Skill</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.recordedAt).toLocaleString()}</td>
                    <td>{h.skill}</td>
                    <td>{h.predictedScore ?? "-"}</td>
                    <td>{h.predictedLevel ?? "-"}</td>
                    <td>{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default SkillHistory;