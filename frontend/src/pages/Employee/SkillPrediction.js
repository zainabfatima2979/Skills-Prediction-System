import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import EmployeeSidebar from "./EmployeeSidebar";
import "./EmployeeLayout.css";

function SkillPrediction() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employee/predictions");
      setPredictions(res.data);
    } catch (err) {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (status) => {
    if (status === "OK") return "emp-status-ok";
    if (status === "Gap") return "emp-status-gap";
    return "emp-status-pending";
  };

  return (
    <div className="emp-layout">
      <EmployeeSidebar active="predictions" />

      <main className="emp-main">
        <h1 className="emp-title">Skill Prediction</h1>
        <p className="emp-subtitle">
          {user?.name} &middot; {user?.designation}
        </p>

        <div className="emp-panel">
          <div className="emp-panel-accent" />
          <h3 className="emp-panel-title">Your Skill Scores</h3>

          {loading ? (
            <p className="emp-empty">Loading...</p>
          ) : predictions.length === 0 ? (
            <p className="emp-empty">
              Your skill scores are not available yet. HR will run the prediction once your
              profile is complete.
            </p>
          ) : (
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Predicted Score</th>
                  <th>Predicted Level</th>
                  <th>Required Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.skill}>
                    <td>{p.skill}</td>
                    <td>{p.predictedScore ?? "-"}</td>
                    <td>{p.predictedLevel ?? "-"}</td>
                    <td>{p.requiredLevel}</td>
                    <td>
                      <span className={`emp-status-badge ${statusClass(p.status)}`}>{p.status}</span>
                    </td>
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

export default SkillPrediction;