import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import EmployeeSidebar from "./EmployeeSidebar";
import ConfirmDialog from "../../components/ConfirmDialog";
import { ICONS } from "./icons";
import "./EmployeeLayout.css";

const STEPS = ["Personal", "Education", "Skills", "Experience"];

function ProfileForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    yearsExperience: "",
    education: "",
    certifications: "",
    toolsUsed: "",
    pastWorkDescription: "",
    coursesCompleted: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/employee/profile")
      .then((res) => {
        const p = res.data;
        setForm({
          yearsExperience: p.yearsExperience ?? "",
          education: p.education || "",
          certifications: (p.certifications || []).join(", "),
          toolsUsed: (p.toolsUsed || []).join(", "),
          pastWorkDescription: p.pastWorkDescription || "",
          coursesCompleted: (p.coursesCompleted || []).join(", "),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toArray = (str) =>
    str.split(",").map((s) => s.trim()).filter((s) => s.length > 0);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await api.post("/employee/profile", {
        yearsExperience: Number(form.yearsExperience) || 0,
        education: form.education,
        certifications: toArray(form.certifications),
        toolsUsed: toArray(form.toolsUsed),
        pastWorkDescription: form.pastWorkDescription,
        coursesCompleted: toArray(form.coursesCompleted),
      });
      setShowSuccessModal(true);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  const coursesCount = toArray(form.coursesCompleted).length;

  if (loading) {
    return (
      <div className="emp-layout">
        <EmployeeSidebar active="profile" />
        <main className="emp-main">Loading...</main>
      </div>
    );
  }

  return (
    <div className="emp-layout">
      <EmployeeSidebar active="profile" />

      <main className="emp-main">
        <h1 className="emp-title">My Profile</h1>
        <p className="emp-subtitle">Fill in your details step by step, then run your skill prediction</p>

        <div className="emp-panel">
          <div className="emp-panel-accent" />

          {/* Timeline stepper */}
          <div className="emp-stepper">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`emp-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
              >
                <div className="emp-step-line" />
                <div className="emp-step-circle">
                  {i < step ? ICONS.check : i + 1}
                </div>
                <div className="emp-step-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Step 1: Personal Details (read-only, from account) */}
          {step === 0 && (
            <div>
              <h3 className="emp-panel-title">Personal Details</h3>
              <div className="emp-readonly-grid">
                <div className="emp-readonly-item">
                  <div className="emp-readonly-label">Full Name</div>
                  <div className="emp-readonly-value">{user?.name}</div>
                </div>
                <div className="emp-readonly-item">
                  <div className="emp-readonly-label">Employee ID</div>
                  <div className="emp-readonly-value">{user?.employeeId}</div>
                </div>
                <div className="emp-readonly-item">
                  <div className="emp-readonly-label">Department</div>
                  <div className="emp-readonly-value">{user?.department}</div>
                </div>
                <div className="emp-readonly-item">
                  <div className="emp-readonly-label">Designation</div>
                  <div className="emp-readonly-value">{user?.designation}</div>
                </div>
              </div>
              <p className="emp-hint" style={{ marginTop: "14px" }}>
                These details are managed by HR. Contact HR if any of this needs to change.
              </p>
            </div>
          )}

          {/* Step 2: Educational Details */}
          {step === 1 && (
            <div>
              <h3 className="emp-panel-title">Educational Details</h3>
              <div className="emp-field">
                <label className="emp-label">Education</label>
                <input
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="e.g. BSCS"
                  className="emp-input"
                />
              </div>
              <div className="emp-field">
                <label className="emp-label">Certifications</label>
                <input
                  name="certifications"
                  value={form.certifications}
                  onChange={handleChange}
                  placeholder="comma separated, e.g. AWS Cloud Practitioner"
                  className="emp-input"
                />
              </div>
              <div className="emp-field">
                <label className="emp-label">Courses Completed</label>
                <input
                  name="coursesCompleted"
                  value={form.coursesCompleted}
                  onChange={handleChange}
                  placeholder="comma separated, e.g. JavaScript Basics, Excel Fundamentals"
                  className="emp-input"
                />
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 2 && (
            <div>
              <h3 className="emp-panel-title">Skills</h3>
              <div className="emp-field">
                <label className="emp-label">Tools / Software Used</label>
                <input
                  name="toolsUsed"
                  value={form.toolsUsed}
                  onChange={handleChange}
                  placeholder="comma separated, e.g. VS Code, Git, Postman"
                  className="emp-input"
                />
                <p className="emp-hint">List every tool or software you regularly use at work.</p>
              </div>
            </div>
          )}

          {/* Step 4: Experience */}
          {step === 3 && (
            <div>
              <h3 className="emp-panel-title">Experience</h3>
              <div className="emp-field">
                <label className="emp-label">Years of Experience</label>
                <input
                  type="number"
                  step="0.1"
                  name="yearsExperience"
                  value={form.yearsExperience}
                  onChange={handleChange}
                  className="emp-input"
                />
              </div>
              <div className="emp-field">
                <label className="emp-label">Past Work / Projects</label>
                <textarea
                  name="pastWorkDescription"
                  value={form.pastWorkDescription}
                  onChange={handleChange}
                  rows={3}
                  className="emp-textarea"
                  placeholder="Briefly describe what you've worked on"
                />
              </div>
              <div className="emp-summary-box">
                <strong>{coursesCount}</strong> course{coursesCount !== 1 ? "s" : ""} completed
                (from the Educational Details step)
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="emp-step-nav">
            <button
              onClick={goBack}
              disabled={step === 0}
              className="emp-btn emp-btn-secondary"
              style={{ visibility: step === 0 ? "hidden" : "visible" }}
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={goNext} className="emp-btn">Next</button>
            ) : (
              <button onClick={handleSubmit} disabled={saving} className="emp-btn">
                {saving ? "Submitting..." : "Submit Profile"}
              </button>
            )}
          </div>

          {message && <div className={`emp-message ${message.type}`}>{message.text}</div>}
        </div>
      </main>

      <ConfirmDialog
        open={showSuccessModal}
        title="Thanks for submitting your profile!"
        message="Your profile has been saved. Ready to see your predicted skill levels?"
        confirmLabel="Predict My Skills"
        cancelLabel="Maybe Later"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate("/employee/predictions");
        }}
        onCancel={() => setShowSuccessModal(false)}
      />
    </div>
  );
}

export default ProfileForm;