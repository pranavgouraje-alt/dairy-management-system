import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    isAuthenticated,
  } = useAuth();

  const [formData, setFormData] =
    useState({
      username: "",
      password: "",
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [isAuthenticated, navigate]);

  function handleChange(event) {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !formData.username.trim() ||
      !formData.password
    ) {
      setError(
        "Please enter username and password"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await login(
        formData.username.trim(),
        formData.password
      );

      const destination =
        location.state?.from ||
        "/dashboard";

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      setError(
        error.message ||
          "Unable to sign in"
      );
    } finally {
      setLoading(false);
    }
  }

  function fillAdminCredentials() {
    setFormData({
      username: "admin",
      password: "Admin@123",
    });

    setError("");
  }

  function fillOperatorCredentials() {
    setFormData({
      username: "operator",
      password: "Operator@123",
    });

    setError("");
  }

  return (
    <div className="auth-page">
      <div className="auth-background-decoration auth-decoration-one">
      </div>

      <div className="auth-background-decoration auth-decoration-two">
      </div>

      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-logo">
            🥛
          </div>

          <span className="auth-eyebrow">
            Smart Dairy Operations
          </span>

          <h1>
            Dairy Management System
          </h1>

          <p>
            Securely manage milk
            collection, members, billing,
            reports, rates, feed and
            advances from one integrated
            workspace.
          </p>

          <div className="auth-feature-grid">
            <div>
              <span>📊</span>
              <strong>
                Live Dashboard
              </strong>
              <small>
                Real-time collection data
              </small>
            </div>

            <div>
              <span>🧾</span>
              <strong>
                Smart Billing
              </strong>
              <small>
                Automated 10-day bills
              </small>
            </div>

            <div>
              <span>🔐</span>
              <strong>
                Secure Access
              </strong>
              <small>
                Role-based permissions
              </small>
            </div>

            <div>
              <span>📈</span>
              <strong>
                Analytics
              </strong>
              <small>
                Business insights
              </small>
            </div>
          </div>
        </div>
      </section>

      <main className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-mobile-logo">
              🥛
            </span>

            <span className="auth-form-eyebrow">
              Welcome back
            </span>

            <h2>Sign in to continue</h2>

            <p>
              Enter your dairy system
              username and password.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span>

              <p>{error}</p>
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="auth-field">
              <label htmlFor="username">
                Username or email
              </label>

              <div className="auth-input-wrapper">
                <span>👤</span>

                <input
                  id="username"
                  type="text"
                  name="username"
                  autoComplete="username"
                  placeholder="Enter username"
                  value={
                    formData.username
                  }
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="auth-input-wrapper">
                <span>🔒</span>

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={
                    formData.password
                  }
                  onChange={handleChange}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-button-spinner">
                  </span>

                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-demo-section">
            <div className="auth-divider">
              <span>
                Development accounts
              </span>
            </div>

            <div className="auth-demo-buttons">
              <button
                type="button"
                onClick={
                  fillAdminCredentials
                }
              >
                <span>🛡️</span>

                <div>
                  <strong>
                    Admin Login
                  </strong>
                  <small>
                    Full access
                  </small>
                </div>
              </button>

              <button
                type="button"
                onClick={
                  fillOperatorCredentials
                }
              >
                <span>👨‍💼</span>

                <div>
                  <strong>
                    Operator Login
                  </strong>
                  <small>
                    Daily operations
                  </small>
                </div>
              </button>
            </div>
          </div>

          <p className="auth-footer-text">
            © 2026 Dairy Management
            System
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;