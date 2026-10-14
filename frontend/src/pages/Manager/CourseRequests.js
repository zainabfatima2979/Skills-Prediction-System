import { useState, useEffect } from "react";
import api from "../../services/api";
import ManagerSidebar from "./ManagerSidebar";
import { avatarColor, initials, ICONS } from "./icons";
import "./ManagerLayout.css";

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Low rating = needs the training most
const ratingStyle = (r) =>
  r == null
    ? { background: "#F3F4F6", color: "#6B7280" }
    : r <= 2
    ? { background: "#FEE2E2", color: "#B91C1C" }
    : r === 3
    ? { background: "#FEF3C7", color: "#92400E" }
    : { background: "#DCFCE7", color: "#166534" };

const OVERALL_STYLE = {
  "Pending Manager Selection": { background: "#FEF3C7", color: "#92400E" },
  "Partially Selected": { background: "#E0F2FE", color: "#075985" },
  "Employees Selected": { background: "#DCFCE7", color: "#166534" },
};

function CourseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null); // { request, departments: [...] }
  const [selected, setSelected] = useState({}); // { departmentName: [employeeIds] }
  const [messages, setMessages] = useState({}); // { departmentName: {type, text} }
  const [submittingDept, setSubmittingDept] = useState(null);
  const [openError, setOpenError] = useState(null);

  const loadList = async () => {
    const res = await api.get("/manager/course-requests");
    setRequests(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadList();
  }, []);

  const applyDetail = (data) => {
    setDetail(data);
    const map = {};
    data.departments.forEach((d) => {
      map[d.department] = d.selectedEmployeeIds || [];
    });
    setSelected(map);
  };

  const openRequest = async (id) => {
    setOpenError(null);
    setMessages({});
    try {
      const res = await api.get(`/manager/course-requests/${id}/candidates`);
      applyDetail(res.data);
    } catch (err) {
      setOpenError(err.response?.data?.message || "Failed to open request");
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setSelected({});
    setMessages({});
  };

  const toggle = (dept, id) => {
    if (dept.status === "Submitted") return;
    setSelected((prev) => {
      const current = prev[dept.department] || [];
      if (current.includes(id)) return { ...prev, [dept.department]: current.filter((x) => x !== id) };
      if (current.length >= dept.seats) return prev; // cannot pick more than HR asked for
      return { ...prev, [dept.department]: [...current, id] };
    });
  };

  const submit = async (dept) => {
    setSubmittingDept(dept.department);
    setMessages((m) => ({ ...m, [dept.department]: null }));
    try {
      const res = await api.post(`/manager/course-requests/${detail.request._id}/select`, {
        department: dept.department,
        employeeIds: selected[dept.department] || [],
      });
      await loadList();
      const fresh = await api.get(`/manager/course-requests/${detail.request._id}/candidates`);
      applyDetail(fresh.data);
      setMessages((m) => ({ ...m, [dept.department]: { type: "success", text: res.data.message } }));
    } catch (err) {
      setMessages((m) => ({
        ...m,
        [dept.department]: { type: "error", text: err.response?.data?.message || "Failed to submit selection" },
      }));
    } finally {
      setSubmittingDept(null);
    }
  };

  const pendingCount = requests.filter((r) => r.allocations.some((a) => a.status === "Pending")).length;

  const renderRow = (dept, c) => {
    const colors = avatarColor(c.name);
    const current = selected[dept.department] || [];
    const isOn = current.includes(c.employeeId);
    const full = !isOn && current.length >= dept.seats;
    return (
      <tr key={c.employeeId}>
        <td style={{ width: "40px" }}>
          <input
            type="checkbox"
            checked={isOn}
            disabled={dept.status === "Submitted" || full}
            onChange={() => toggle(dept, c.employeeId)}
          />
        </td>
        <td>
          <div className="mgr-employee-cell">
            <div className="mgr-avatar" style={{ background: colors.bg, color: colors.fg }}>
              {initials(c.name)}
            </div>
            <div>
              <div className="mgr-employee-name">{c.name}</div>
              <div className="mgr-employee-id">{c.employeeId}</div>
            </div>
          </div>
        </td>
        <td>{c.designation}</td>
        <td>
          <span className="mgr-skill-chip" style={ratingStyle(c.rating)}>
            {c.rating != null ? `${c.rating} / 5` : "-"}
          </span>
        </td>
      </tr>
    );
  };

  const renderDepartment = (dept) => {
    const submitted = dept.status === "Submitted";
    const current = selected[dept.department] || [];
    const selectedList = dept.candidates.filter((c) => current.includes(c.employeeId));
    const unselectedList = dept.candidates.filter((c) => !current.includes(c.employeeId));
    const msg = messages[dept.department];

    return (
      <div
        key={dept.department}
        style={{ border: "1px solid var(--color-border)", borderRadius: "10px", padding: "18px 20px", marginTop: "18px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px" }}>{dept.department} department</div>
            <div style={{ fontSize: "12.5px", color: "var(--color-text-muted)" }}>
              HR needs {dept.seats} person(s) from this department
            </div>
          </div>
          <span
            className="mgr-skill-chip"
            style={
              submitted
                ? { background: "#DCFCE7", color: "#166534" }
                : dept.ratingsComplete
                ? { background: "#E0F2FE", color: "#075985" }
                : { background: "#FEF3C7", color: "#92400E" }
            }
          >
            {submitted ? "Submitted" : dept.ratingsComplete ? "Ready to select" : `Rate first (${dept.ratedCount}/${dept.totalToRate})`}
          </span>
        </div>

        {/* Step 1: rating gate */}
        {!submitted && !dept.ratingsComplete && (
          <div className="mgr-blocked-state" style={{ alignItems: "stretch", textAlign: "left", marginTop: "14px" }}>
            <div className="mgr-empty-state-title" style={{ marginBottom: "6px" }}>
              Step 1: rate {dept.department} employees on {detail.request.skill}
            </div>
            <div style={{ fontSize: "13px", color: "#991B1B", marginBottom: "12px" }}>
              {dept.ratedCount} of {dept.totalToRate} rated. You can select employees only after everyone in{" "}
              {dept.department} is rated on {detail.request.skill}.
            </div>
            {dept.unrated.length > 0 && (
              <table className="mgr-table" style={{ background: "#fff" }}>
                <tbody>
                  {dept.unrated.map((u) => (
                    <tr key={u.employeeId}>
                      <td>
                        <div className="mgr-employee-name">{u.name}</div>
                        <div className="mgr-employee-id">{u.employeeId}</div>
                      </td>
                      <td>{u.designation}</td>
                      <td>
                        <a href={`/manager?employee=${u.employeeId}`} className="mgr-rate-btn">
                          Rate Now
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {dept.totalToRate === 0 && (
              <div style={{ fontSize: "13px", color: "#991B1B" }}>
                No employee in {dept.department} has a completed profile yet, so nobody can be rated.
              </div>
            )}
          </div>
        )}

        {dept.noProfile.length > 0 && (
          <div
            style={{ marginTop: "12px", background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E", padding: "10px 14px", borderRadius: "6px", fontSize: "13px" }}
          >
            Not shown because their profile is not completed yet:{" "}
            {dept.noProfile.map((e) => `${e.name} (${e.employeeId})`).join(", ")}
          </div>
        )}

        {/* Step 2: selection */}
        {(submitted || dept.ratingsComplete) && (
          <>
            <div className="mgr-selected-employee" style={{ marginTop: "14px" }}>
              <div>
                <div className="mgr-selected-name">
                  {current.length} of {dept.seats} selected
                </div>
                <div className="mgr-selected-meta">
                  {submitted
                    ? "You have already submitted this selection."
                    : `Step 2: pick up to ${dept.seats} person(s). Employees with the lowest rating in ${detail.request.skill} are listed first.`}
                </div>
              </div>
            </div>

            {msg && <div className={`mgr-form-message ${msg.type}`}>{msg.text}</div>}

            {[
              { key: "sel", title: "Selected", list: selectedList, accent: "#166534", empty: "Nobody selected yet. Tick employees below." },
              { key: "unsel", title: "Not selected", list: unselectedList, accent: "#6B7280", empty: "Everyone is selected." },
            ].map((group) => (
              <div key={group.key} style={{ marginTop: "18px" }}>
                <div style={{ fontWeight: 600, fontSize: "14px", color: group.accent, marginBottom: "4px" }}>
                  {group.title} <span className="mgr-count-badge">{group.list.length}</span>
                </div>
                {group.list.length === 0 ? (
                  <p className="mgr-empty">{group.empty}</p>
                ) : (
                  <table className="mgr-table">
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}></th>
                        <th>Employee</th>
                        <th>Designation</th>
                        <th>Your rating in {detail.request.skill}</th>
                      </tr>
                    </thead>
                    <tbody>{group.list.map((c) => renderRow(dept, c))}</tbody>
                  </table>
                )}
              </div>
            ))}

            {!submitted && (
              <div style={{ marginTop: "18px" }}>
                <button
                  className="mgr-submit-btn"
                  disabled={submittingDept === dept.department || current.length === 0}
                  onClick={() => submit(dept)}
                >
                  {submittingDept === dept.department ? "Submitting..." : `Submit ${dept.department} and notify`}
                </button>
                <span style={{ marginLeft: "12px", fontSize: "12.5px", color: "var(--color-text-soft)" }}>
                  The selected employees and HR will be notified. You cannot change this afterwards.
                </span>
              </div>
            )}
          </>
        )}

        {/* Error from the gate (shown even when the selection area is hidden) */}
        {msg && !(submitted || dept.ratingsComplete) && (
          <div className={`mgr-form-message ${msg.type}`}>{msg.text}</div>
        )}
      </div>
    );
  };

  return (
    <div className="mgr-layout">
      <ManagerSidebar active="course-requests" requestCount={pendingCount} />

      <main className="mgr-main">
        <h1 className="mgr-title">Course Requests</h1>
        <p className="mgr-subtitle">
          HR needs people from one or more departments for these courses. For each department, first rate the
          employees on the course skill, then pick who should attend.
        </p>

        {openError && !detail && <div className="mgr-form-message error">{openError}</div>}

        {!detail && (
          <div className="mgr-panel">
            <div className="mgr-panel-accent" style={{ background: "#B45309" }} />
            <div className="mgr-panel-header">
              <h3 className="mgr-panel-title">
                Requests <span className="mgr-count-badge">{requests.length}</span>
              </h3>
            </div>

            {loading ? (
              <p className="mgr-empty">Loading...</p>
            ) : requests.length === 0 ? (
              <p className="mgr-empty">No course requests right now.</p>
            ) : (
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Duration</th>
                    <th>Start date</th>
                    <th>Departments (persons needed)</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="mgr-employee-name">{r.courseName}</div>
                        <div className="mgr-employee-id">{r.skill}</div>
                      </td>
                      <td>{r.duration}</td>
                      <td>{fmt(r.startDate)}</td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {r.allocations.map((a) => (
                            <span
                              key={a.department}
                              className="mgr-dept-chip"
                              title={a.status === "Submitted" ? "Submitted" : a.ratingsComplete ? "Ready to select" : `Rated ${a.ratedCount}/${a.totalToRate}`}
                            >
                              {a.department}: {a.seats} {a.status === "Submitted" ? "✓" : ""}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="mgr-skill-chip" style={OVERALL_STYLE[r.status]}>
                          {r.status === "Pending Manager Selection" ? "Waiting for you" : r.status}
                        </span>
                      </td>
                      <td>
                        <button className="mgr-rate-btn" onClick={() => openRequest(r._id)}>
                          {r.status === "Employees Selected" ? "View" : "Open"}
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
              ← Back to requests
            </button>

            <h3 className="mgr-panel-title" style={{ marginBottom: "4px" }}>{detail.request.courseName}</h3>
            <p className="mgr-subtitle" style={{ margin: "0 0 4px 0" }}>
              Skill: {detail.request.skill} · {detail.request.duration} · starts {fmt(detail.request.startDate)}
            </p>

            {detail.departments.map(renderDepartment)}
          </div>
        )}
      </main>
    </div>
  );
}

export default CourseRequests;