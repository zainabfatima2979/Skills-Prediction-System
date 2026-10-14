import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { avatarColor, initials } from "../../utils/avatar";
import "./Dashboard.css";
import HRSidebar from "./HRSidebar";

function DeactivatedEmployees() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/hr/employees/deactivated");
      setEmployees(res.data);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to load." });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (employeeId) => {
    setReactivating(employeeId);
    setMessage(null);
    try {
      const res = await api.put(`/hr/users/${employeeId}/reactivate`);
      setMessage({ type: "success", text: res.data.message });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to reactivate." });
    } finally {
      setReactivating(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="hr-layout">
      <HRSidebar active="deactivated" />

      <main className="hr-main">
        <div className="hr-header">
          <div>
            <h1 className="hr-title">Deactivated Employees</h1>
            <p className="hr-subtitle">
              These accounts can no longer log in. Their profile, scores and history are kept.
            </p>
          </div>
        </div>

        {message && <div className={`hr-form-message ${message.type}`}>{message.text}</div>}

        <div className="hr-table-panel">
          <div className="hr-panel-header">
            <h3 className="hr-panel-title" style={{ margin: 0 }}>
              Employees <span className="hr-count-badge">{employees.length}</span>
            </h3>
          </div>

          {loading ? (
            <p className="hr-empty">Loading...</p>
          ) : employees.length === 0 ? (
            <p className="hr-empty">No deactivated employees.</p>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Deactivated On</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const colors = avatarColor(e.name);
                  return (
                    <tr key={e.employeeId}>
                      <td>
                        <div className="hr-employee-cell">
                          <div className="hr-avatar" style={{ background: colors.bg, color: colors.fg }}>
                            {initials(e.name)}
                          </div>
                          <div>
                            <div className="hr-employee-name">{e.name}</div>
                            <div className="hr-employee-id">{e.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td>{e.designation}</td>
                      <td><span className="hr-dept-chip">{e.department}</span></td>
                      <td>{new Date(e.updatedAt).toLocaleDateString()}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => navigate(`/hr/employee/${e.employeeId}`)}
                          className="hr-view-btn"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleReactivate(e.employeeId)}
                          disabled={reactivating === e.employeeId}
                          className="hr-edit-btn"
                          style={{ marginLeft: 6 }}
                        >
                          {reactivating === e.employeeId ? "..." : "Reactivate"}
                        </button>
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

export default DeactivatedEmployees;