import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { avatarColor, initials } from "../../utils/avatar";
import "./Dashboard.css";
import HRSidebar from "./HRSidebar";

function CourseNeeders() {
  const { id } = useParams();

  const [data, setData] = useState(null); // { course, departments, employees }
  const [department, setDepartment] = useState("");
  const [selected, setSelected] = useState([]); // employeeIds
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, text }

  useEffect(() => {
    load(department);
  }, [id, department]);

  const load = async (dept) => {
    try {
      const res = await api.get(`/hr/courses/${id}/needed-by`, {
        params: dept ? { department: dept } : {},
      });
      setData(res.data);
      // by default tick everyone who hasn't been messaged yet
      setSelected(res.data.employees.filter((e) => !e.alreadyNotified).map((e) => e.employeeId));
      // pre-fill the message once; HR can edit it freely afterwards
      setMessage(
        (prev) =>
          prev ||
          `HR is arranging the course "${res.data.course.courseName}" to help you close your ${res.data.course.skill} skill gap. Please be ready to attend. Details will be shared soon.`
      );
    } catch (err) {
      setData(null);
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to load." });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (employeeId) => {
    setSelected((prev) =>
      prev.includes(employeeId) ? prev.filter((x) => x !== employeeId) : [...prev, employeeId]
    );
  };

  const handleSend = async () => {
    setSending(true);
    setFeedback(null);
    try {
      const res = await api.post(`/hr/courses/${id}/notify`, {
        employeeIds: selected,
        message,
      });
      await load(department);
      setFeedback({ type: "success", text: res.data.message });
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to send message." });
    } finally {
      setSending(false);
    }
  };

  const sidebar = (
      <HRSidebar active="courses" />
  );

  if (loading) {
    return (
      <div className="hr-layout">
        {sidebar}
        <main className="hr-main">Loading...</main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="hr-layout">
        {sidebar}
        <main className="hr-main">
          <a href="/hr/courses" className="hr-back-link">&larr; Back to courses</a>
          {feedback && <div className={`hr-form-message ${feedback.type}`}>{feedback.text}</div>}
        </main>
      </div>
    );
  }

  const { course, departments, employees } = data;
  const pending = employees.filter((e) => !e.alreadyNotified);
  const allTicked = pending.length > 0 && pending.every((e) => selected.includes(e.employeeId));

  return (
    <div className="hr-layout">
      {sidebar}

      <main className="hr-main">
        <a href="/hr/courses" className="hr-back-link">&larr; Back to courses</a>

        <div className="hr-header">
          <div>
            <h1 className="hr-title">{course.courseName}</h1>
            <p className="hr-subtitle">Employees who need this course &middot; Skill: {course.skill}</p>
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="hr-select"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {feedback && <div className={`hr-form-message ${feedback.type}`}>{feedback.text}</div>}

        <div className="hr-table-panel" style={{ marginBottom: 24 }}>
          <div className="hr-panel-header">
            <h3 className="hr-panel-title" style={{ margin: 0 }}>
              Employees <span className="hr-count-badge">{employees.length}</span>
            </h3>
          </div>

          {employees.length === 0 ? (
            <p className="hr-empty">
              No employee currently needs this course
              {department ? ` in ${department}` : ""}. Run predictions first if you expected some.
            </p>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allTicked}
                      disabled={pending.length === 0}
                      onChange={() =>
                        setSelected(allTicked ? [] : pending.map((e) => e.employeeId))
                      }
                    />
                  </th>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const colors = avatarColor(e.name);
                  return (
                    <tr key={e.employeeId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(e.employeeId)}
                          disabled={e.alreadyNotified}
                          onChange={() => toggle(e.employeeId)}
                        />
                      </td>
                      <td>
                        <div className="hr-employee-cell">
                          <div
                            className="hr-avatar"
                            style={{ background: colors.bg, color: colors.fg }}
                          >
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
                      <td>
                        {e.alreadyNotified ? (
                          <span className="hr-pill hr-pill-ok">Sent</span>
                        ) : (
                          <span className="hr-pill hr-pill-pending">Not sent</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {pending.length > 0 && (
          <div className="hr-panel">
            <div className="hr-panel-accent" style={{ background: "var(--color-accent)" }} />
            <h3 className="hr-panel-title">Message to employees</h3>
            <div className="hr-field full">
              <textarea
                className="hr-field-input"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <span className="hr-form-hint">
                You can add the date, time or venue here. The same message goes to every selected
                employee.
              </span>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || selected.length === 0 || !message.trim()}
              className="hr-form-btn"
            >
              {sending ? "Sending..." : `Send to ${selected.length} employee(s)`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default CourseNeeders;