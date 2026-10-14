import { useState, useEffect } from "react";
import api from "../../services/api";
import ManagerSidebar from "./ManagerSidebar";
import { avatarColor, initials } from "./icons";
import "./ManagerLayout.css";

function CourseNeeds() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null); // { course, departments, employees }
  const [department, setDepartment] = useState("");
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  const loadCourses = async () => {
    const res = await api.get("/manager/courses");
    setCourses(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const defaultMessage = (c) =>
    `I recommend the course "${c.courseName}" to improve your ${c.skill} skill. Details will be shared soon.`;

  const loadDetail = async (id, dept = "") => {
    const res = await api.get(`/manager/courses/${id}/needed-by`, {
      params: dept ? { department: dept } : {},
    });
    setDetail(res.data);
    // everyone who has not been messaged yet starts ticked; the manager can untick anyone
    setSelected(res.data.employees.filter((e) => !e.alreadyNotified).map((e) => e.employeeId));
    return res.data;
  };

  const openCourse = async (c) => {
    setResult(null);
    setDepartment("");
    const data = await loadDetail(c._id);
    setMessage(defaultMessage(data.course));
  };

  const closeDetail = () => {
    setDetail(null);
    setSelected([]);
    setResult(null);
  };

  const changeDepartment = async (value) => {
    setDepartment(value);
    await loadDetail(detail.course._id, value);
  };

  const selectable = detail ? detail.employees.filter((e) => !e.alreadyNotified) : [];
  const allTicked = selectable.length > 0 && selectable.every((e) => selected.includes(e.employeeId));

  const toggleAll = () => {
    setSelected(allTicked ? [] : selectable.map((e) => e.employeeId));
  };

  const toggleOne = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await api.post(`/manager/courses/${detail.course._id}/notify`, {
        employeeIds: selected,
        message,
      });
      setResult({ type: "success", text: res.data.message });
      await loadDetail(detail.course._id, department);
      loadCourses();
    } catch (err) {
      setResult({ type: "error", text: err.response?.data?.message || "Failed to send message" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mgr-layout">
      <ManagerSidebar active="course-needs" />

      <main className="mgr-main">
        <h1 className="mgr-title">Who Needs Courses</h1>
        <p className="mgr-subtitle">
          See which employees need each course, then choose who you want to notify about it.
        </p>

        {!detail && (
          <div className="mgr-panel">
            <div className="mgr-panel-accent" style={{ background: "var(--color-accent)" }} />
            <div className="mgr-panel-header">
              <h3 className="mgr-panel-title">
                Courses <span className="mgr-count-badge">{courses.length}</span>
              </h3>
            </div>

            {loading ? (
              <p className="mgr-empty">Loading...</p>
            ) : courses.length === 0 ? (
              <p className="mgr-empty">No courses have been added yet.</p>
            ) : (
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Course</th>
                    <th>Departments</th>
                    <th>Need it</th>
                    <th>Notified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <span className="mgr-skill-chip" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-dark)" }}>
                          {c.skill}
                        </span>
                      </td>
                      <td>{c.courseName}</td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {(c.departments.length > 0 ? c.departments : ["All"]).map((d) => (
                            <span key={d} className="mgr-dept-chip">{d}</span>
                          ))}
                        </div>
                      </td>
                      <td>{c.needCount}</td>
                      <td>{c.notifiedCount}</td>
                      <td>
                        <button className="mgr-rate-btn" onClick={() => openCourse(c)}>
                          Who needs this?
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {detail && (
          <div className="mgr-panel">
            <div className="mgr-panel-accent" style={{ background: "var(--color-accent)" }} />
            <button
              onClick={closeDetail}
              className="mgr-back-link"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              ← Back to courses
            </button>

            <div className="mgr-panel-header">
              <div>
                <h3 className="mgr-panel-title">{detail.course.courseName}</h3>
                <p className="mgr-subtitle" style={{ margin: "2px 0 0 0" }}>
                  Employees who need this course · Skill: {detail.course.skill}
                </p>
              </div>
              <select
                value={department}
                onChange={(e) => changeDepartment(e.target.value)}
                className="mgr-select"
                style={{ width: "auto" }}
              >
                <option value="">All departments</option>
                {detail.departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {result && <div className={`mgr-form-message ${result.type}`} style={{ marginTop: 0, marginBottom: "14px" }}>{result.text}</div>}

            {detail.employees.length === 0 ? (
              <p className="mgr-empty">
                Nobody needs this course right now. Employees appear here when HR runs their prediction and they
                have a gap in {detail.course.skill}.
              </p>
            ) : (
              <>
                <table className="mgr-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>
                        <input
                          type="checkbox"
                          checked={allTicked}
                          disabled={selectable.length === 0}
                          onChange={toggleAll}
                        />
                      </th>
                      <th>Employee</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.employees.map((e) => {
                      const colors = avatarColor(e.name);
                      return (
                        <tr key={e.employeeId}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selected.includes(e.employeeId)}
                              disabled={e.alreadyNotified}
                              onChange={() => toggleOne(e.employeeId)}
                            />
                          </td>
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
                            <span className="mgr-dept-chip">{e.department}</span>
                          </td>
                          <td>
                            <span
                              className="mgr-skill-chip"
                              style={
                                e.alreadyNotified
                                  ? { background: "#DCFCE7", color: "#166534" }
                                  : { background: "#FEF3C7", color: "#92400E" }
                              }
                            >
                              {e.alreadyNotified ? "Sent" : "Not sent"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {selectable.length > 0 && (
                  <div style={{ marginTop: "18px" }}>
                    <label className="mgr-field-label">Message to the selected employees</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="mgr-field-input"
                    />
                    <div style={{ marginTop: "12px" }}>
                      <button
                        className="mgr-submit-btn"
                        disabled={sending || selected.length === 0 || !message.trim()}
                        onClick={send}
                      >
                        {sending ? "Sending..." : `Send to ${selected.length} employee(s)`}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default CourseNeeds;