import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const ROLE_LABELS = {
  employee: "Employee",
  manager: "Manager",
  hr: "HR",
};

function EditUser() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "employee",
    department: "",
    designation: "",
  });
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get(`/hr/users/${employeeId}`).then((res) => {
      const u = res.data;
      const loaded = {
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        designation: u.designation,
      };
      setForm(loaded);
      setOriginal(loaded);
      setLoading(false);
    });
  }, [employeeId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put(`/hr/users/${employeeId}`, form);
      setMessage({ type: "success", text: res.data.message });
      setOriginal(form);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update account" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const designationChanged = original && form.designation !== original.designation;
  const colors = avatarColor(form.name);

  return (
    <div className="hr-layout">
      <aside className="hr-sidebar">
        <div>
          <div className="hr-brand">Skill Indicator</div>
          <div className="hr-brand-sub">HR Console</div>
        </div>

        <nav className="hr-nav">
          <a href="/hr" className="hr-nav-link">{ICONS.dashboard}Dashboard</a>
          <a href="/hr/create-user" className="hr-nav-link">{ICONS.createUser}Create Account</a>
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

        {loading ? (
          <p className="hr-empty">Loading...</p>
        ) : (
          <>
            <div className="hr-edit-profile-header">
              <div className="hr-avatar hr-avatar-lg" style={{ background: colors.bg, color: colors.fg }}>
                {initials(form.name)}
              </div>
              <div>
                <h1 className="hr-title" style={{ marginBottom: "2px" }}>{form.name}</h1>
                <p className="hr-subtitle" style={{ margin: 0 }}>
                  {employeeId} &middot; <span className="hr-role-badge">{ROLE_LABELS[form.role]}</span>
                </p>
              </div>
            </div>

            <div className="hr-panel hr-form-panel">
              <div className="hr-panel-accent" style={{ background: "var(--color-accent)" }} />

              {message && (
                <div className={`hr-form-message ${message.type}`}>{message.text}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="hr-form-row">
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
                </div>

                <div className="hr-form-row">
                  <div className="hr-field">
                    <label className="hr-field-label">Role</label>
                    <select name="role" value={form.role} onChange={handleChange} className="hr-field-input">
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                    </select>
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

                <div className="hr-field full" style={{ marginBottom: "6px" }}>
                  <label className="hr-field-label">Designation</label>
                  <input
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    required
                    className="hr-field-input"
                  />
                </div>

                {designationChanged && (
                  <div className="hr-form-warning">
                    Designation changed from <strong>{original.designation}</strong> to{" "}
                    <strong>{form.designation}</strong>. Re-run this employee's prediction afterward
                    so their skill gaps reflect the new required skills.
                  </div>
                )}

                <button type="submit" disabled={saving} className="hr-form-btn">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default EditUser;