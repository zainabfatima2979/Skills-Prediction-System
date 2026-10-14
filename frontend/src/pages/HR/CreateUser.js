import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { avatarColor, initials } from "../../utils/avatar";
import "./Dashboard.css";

const ICONS = {
  dashboard: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.2" />
    </svg>
  ),
  createUser: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="7" r="3" />
      <path d="M2.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 8v4M13.5 10h4" />
    </svg>
  ),
  pending: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6v4l2.6 2.6" />
    </svg>
  ),
  gap: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2.5 18 16H2L10 2.5Z" strokeLinejoin="round" />
      <path d="M10 8v3.2" strokeLinecap="round" />
      <circle cx="10" cy="13.6" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  ok: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M6.8 10.2l2 2 4.2-4.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
      <path d="M7.5 17H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3.5" />
      <path d="M13 14l4-4-4-4" />
      <path d="M17 10H7.5" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <path d="M12.5 4.5 6 10l6.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <path d="M4 10.5l3.5 3.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  predictionStatus: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 16V9M8 16V4M13 16v-6M17 16V7" strokeLinecap="round" />
    </svg>
  ),
  courses: (
    <svg className="hr-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H9v12H4.5A1.5 1.5 0 0 0 3 17.5v-12Z" />
      <path d="M17 5.5A1.5 1.5 0 0 0 15.5 4H11v12h4.5a1.5 1.5 0 0 1 1.5 1.5v-12Z" />
    </svg>
  ),
};

const emptyForm = {
  employeeId: "",
  name: "",
  email: "",
  password: "",
  role: "employee",
  department: "",
  designation: "",
};

function CreateUser() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.post("/hr/create-user", form);
      setMessage({ type: "success", text: res.data.message });
      setForm(emptyForm);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create account" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const colors = avatarColor(form.name || "New Account");

  return (
    <div className="hr-layout">
      <aside className="hr-sidebar">
        <div>
          <div className="hr-brand">Skill Indicator</div>
          <div className="hr-brand-sub">HR Console</div>
        </div>

        <nav className="hr-nav">
          <a href="/hr" className="hr-nav-link">{ICONS.dashboard}Dashboard</a>
          <a href="/hr/create-user" className="hr-nav-link active">{ICONS.createUser}Create Account</a>
          <a href="/hr/status/pending" className="hr-nav-link">{ICONS.pending}Pending Reviews</a>
          <a href="/hr/status/gap" className="hr-nav-link">{ICONS.gap}Skill Gaps</a>
          <a href="/hr/status/ok" className="hr-nav-link">{ICONS.ok}Meeting Requirement</a>
          <a href="/hr/prediction-status" className="hr-nav-link">{ICONS.predictionStatus}Prediction Status</a>
          <a href="/hr/courses" className="hr-nav-link">{ICONS.courses}Manage Courses</a>
        </nav>

        <div className="hr-sidebar-footer">
          <div className="hr-user-name">{user?.name}</div>
          <div className="hr-user-role">{user?.designation}</div>
          <button onClick={handleLogout} className="hr-logout-btn">{ICONS.logout} Log out</button>
        </div>
      </aside>

      <main className="hr-main">
        <a href="/hr" className="hr-back-link">{ICONS.back} Back to Dashboard</a>

        <div className="hr-edit-profile-header">
          <div className="hr-avatar hr-avatar-lg" style={{ background: colors.bg, color: colors.fg }}>
            {form.name ? initials(form.name) : ICONS.createUser}
          </div>
          <div>
            <h1 className="hr-title" style={{ marginBottom: "2px" }}>
              {form.name || "New Account"}
            </h1>
            <p className="hr-subtitle" style={{ margin: 0 }}>
              Add a new employee, manager, or HR user to the system
            </p>
          </div>
        </div>

        <div className="hr-panel hr-form-panel">
          <div className="hr-panel-accent" style={{ background: "var(--color-accent)" }} />

          {message && (
            <div className={`hr-form-message ${message.type}`}>
              {message.type === "success" && ICONS.check} {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="hr-form-row">
              <div className="hr-field">
                <label className="hr-field-label">Employee ID</label>
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. EMP-102"
                  required
                  className="hr-field-input"
                />
              </div>
              <div className="hr-field">
                <label className="hr-field-label">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="hr-field-input"
                />
              </div>
            </div>

            <div className="hr-form-row">
              <div className="hr-field">
                <label className="hr-field-label">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="hr-field-input"
                />
              </div>
              <div className="hr-field">
                <label className="hr-field-label">Temporary Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="hr-field-input"
                />
              </div>
            </div>

            <div className="hr-form-row">
              <div className="hr-field">
                <label className="hr-field-label">Role</label>
                <div className="hr-role-select">
                  {["employee", "manager", "hr"].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setForm({ ...form, role: r })}
                      className={`hr-role-option ${form.role === r ? "active" : ""}`}
                    >
                      {r === "employee" ? "Employee" : r === "manager" ? "Manager" : "HR"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="hr-field">
                <label className="hr-field-label">Department</label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                  className="hr-field-input"
                />
              </div>
            </div>

            <div className="hr-field full" style={{ marginBottom: "20px" }}>
              <label className="hr-field-label">Designation</label>
              <input
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="Must exactly match a designation in Required Skills"
                required
                className="hr-field-input"
              />
            </div>

            <button type="submit" disabled={loading} className="hr-form-btn">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateUser;