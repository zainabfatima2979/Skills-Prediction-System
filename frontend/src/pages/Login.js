import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      login(user, token);

      if (user.role === "employee") navigate("/employee");
      else if (user.role === "manager") navigate("/manager");
      else if (user.role === "hr") navigate("/hr");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left: animated branding panel */}
      <div className="login-brand-panel">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
        <div className="login-blob login-blob-4" />

        <div className="login-sparkle" style={{ top: "15%", left: "45%", animationDelay: "0s" }} />
        <div className="login-sparkle" style={{ top: "60%", left: "80%", animationDelay: "1s" }} />
        <div className="login-sparkle" style={{ top: "75%", left: "35%", animationDelay: "2s" }} />
        <div className="login-sparkle" style={{ top: "25%", left: "70%", animationDelay: "1.5s" }} />

        <div className="login-brand-logo-mark">
          <div className="login-brand-logo-icon">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" />
              <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.2" />
              <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" />
              <rect x="11" y="11" width="6.5" height="6.5" rx="1.2" />
            </svg>
          </div>
          <span className="login-brand-logo-text">SKILL INDICATOR SYSTEM</span>
        </div>

        <div className="login-illustration">
          <div className="login-card-3d login-card-1">
            <div className="label">React <span className="pct">78%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: "78%" }} /></div>
          </div>
          <div className="login-card-3d login-card-2">
            <div className="label">MongoDB <span className="pct">45%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: "45%" }} /></div>
          </div>
          <div className="login-card-3d login-card-3">
            <div className="label">REST API <span className="pct">62%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: "62%" }} /></div>
          </div>
        </div>

        <div className="login-brand-text">
          <h1 className="login-brand-title">AI-Powered Skill Intelligence</h1>
          <p className="login-brand-subtitle">
            Combining employee profiles and manager reviews to predict skill levels
            and recommend the right courses, automatically.
          </p>

          <div className="login-brand-features">
            <div className="login-feature">
              <span className="login-feature-icon">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Automatic gap analysis per employee
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              ML-based skill level prediction
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Personalized course recommendations
            </div>
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <div className="login-form-logo">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" />
              <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.2" />
              <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" />
              <rect x="11" y="11" width="6.5" height="6.5" rx="1.2" />
            </svg>
          </div>

          <h2 className="login-form-title">Welcome back</h2>
          <p className="login-form-subtitle">Log in to continue to your dashboard</p>

          {error && (
            <div className="login-error">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0 }}>
                <circle cx="10" cy="10" r="7.5" />
                <path d="M10 6.5v4M10 13.2h.01" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-input"
                  placeholder="you@company.com"
                />
                <span className="login-input-icon">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
                    <path d="M3 6l7 5 7-5" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input"
                  placeholder="••••••••"
                />
                <span className="login-input-icon">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="4" y="9" width="12" height="8" rx="1.5" />
                    <path d="M6.5 9V6a3.5 3.5 0 0 1 7 0v3" />
                  </svg>
                </span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-submit-btn">
              {loading && <span className="login-spinner" />}
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="login-footer-note">Accounts are created by your HR department</p>
        </div>
      </div>
    </div>
  );
}

export default Login;