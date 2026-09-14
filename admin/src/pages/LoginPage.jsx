import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth.service";
import api from "../services/api";
import { FiEye, FiEyeOff, FiAlertTriangle, FiShield } from "react-icons/fi";

import "./LoginPage.css";

export default function LoginPage() {
    const navigate = useNavigate();

    const [accountType, setAccountType] = useState("user");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [maintenance, setMaintenance] = useState({ active: false, message: "" });
    const [registrationAllowed, setRegistrationAllowed] = useState(true);

    useEffect(() => {
        document.body.classList.add("auth-page");
        let mounted = true;

        api.get("/app-config/public")
            .then((res) => {
                if (!mounted) return;
                const s = res?.data?.settings || {};
                if (s.maintenanceMode) {
                    setMaintenance({
                        active: true,
                        message: s.maintenanceMessage || "Platform is currently undergoing scheduled maintenance. User logins are temporarily suspended.",
                    });
                }
                if (s.allowUserRegistration === false) {
                    setRegistrationAllowed(false);
                }
            })
            .catch(() => {});

        return () => {
            document.body.classList.remove("auth-page");
            mounted = false;
        };
    }, []);

    async function submit(e) {
        e.preventDefault();

        if (loading) return;

        if (accountType === "user" && maintenance.active) {
            setError(maintenance.message || "Platform is undergoing maintenance. User logins are temporarily restricted.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await login(
                accountType,
                email,
                password,
                rememberMe
            );

            // Redirect based on account type
            if (accountType === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/dashboard");
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="login-page">

            {/* LEFT PANEL */}

            <div className="login-left">

                <div className="gradient-glow"></div>

                <div className="mesh"></div>

                <div className="floating-circle circle-one"></div>
                <div className="floating-circle circle-two"></div>
                <div className="floating-circle circle-three"></div>

                <div className="left-content">

                    <h1>mone.ai</h1>

                    <p className="tagline">
                        Manage your platform with confidence.
                    </p>

                </div>

            </div>


            {/* RIGHT PANEL */}

            <div className="login-right">

                <form
                    className="login-form"
                    onSubmit={submit}
                >

                    <h2>Log in</h2>

                    <p className="subtitle">
                        Please select your account type and
                        enter your credentials.
                    </p>


                    {/* ACCOUNT TYPE */}

                    <div className="account-type-section">

                        <label className="account-type-label">
                            Account Type
                        </label>


                        <div className="account-type-options">

                            {/* USER */}

                            <button
                                type="button"
                                className={`account-type-card ${
                                    accountType === "user"
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    setAccountType("user")
                                }
                            >

                                <div className="account-type-radio">

                                    <span
                                        className={
                                            accountType === "user"
                                                ? "radio-dot"
                                                : ""
                                        }
                                    ></span>

                                </div>

                                <div className="account-type-content">

                                    <strong>
                                        User
                                    </strong>

                                    <span>
                                        Regular user access
                                    </span>

                                </div>

                            </button>


                            {/* ADMIN */}

                            <button
                                type="button"
                                className={`account-type-card ${
                                    accountType === "admin"
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    setAccountType("admin")
                                }
                            >

                                <div className="account-type-radio">

                                    <span
                                        className={
                                            accountType === "admin"
                                                ? "radio-dot"
                                                : ""
                                        }
                                    ></span>

                                </div>

                                <div className="account-type-content">

                                    <strong>
                                        Admin
                                    </strong>

                                    <span>
                                        Administrator access
                                    </span>

                                </div>

                            </button>

                        </div>

                    </div>

                    {/* MAINTENANCE ALERTS */}
                    {accountType === "user" && maintenance.active && (
                        <div className="auth-alert-banner alert-warning" style={{ marginBottom: "16px" }}>
                            <FiAlertTriangle size={20} />
                            <div>
                                <strong>System Maintenance Active</strong>
                                <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
                                    {maintenance.message || "Platform is currently undergoing maintenance. Regular user logins are temporarily suspended."}
                                </p>
                            </div>
                        </div>
                    )}

                    {accountType === "admin" && maintenance.active && (
                        <div className="auth-alert-banner" style={{ marginBottom: "16px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "#93c5fd" }}>
                            <FiShield size={20} />
                            <div>
                                <strong>Admin Maintenance Bypass</strong>
                                <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
                                    Maintenance mode is active for regular users. Administrators retain full platform access.
                                </p>
                            </div>
                        </div>
                    )}


                    {/* ERROR */}

                    {error && (
                        <div className="error-box">
                            {error}
                        </div>
                    )}


                    {/* EMAIL */}

                    <div className="field">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            placeholder="Enter email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="field">

                        <label htmlFor="password">
                            Password
                        </label>

                        <div className="password-wrapper">

                            <input
                                id="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Enter password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                            <button
                                type="button"
                                className="eye-button"
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >
                                {showPassword ? (
                                    <FiEyeOff />
                                ) : (
                                    <FiEye />
                                )}
                            </button>

                        </div>

                    </div>


                    {/* REMEMBER ME */}

                    <div className="remember-row">

                        <label className="remember">

                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) =>
                                    setRememberMe(
                                        e.target.checked
                                    )
                                }
                            />

                            Remember Me

                        </label>


                        <Link
                            to="/forgot-password"
                            className="forgot"
                        >
                            Forgot Password?
                        </Link>

                    </div>


                    {/* LOGIN */}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading || (accountType === "user" && maintenance.active)}
                    >
                        {loading
                            ? "Signing in..."
                            : accountType === "user" && maintenance.active
                            ? "Log In (Maintenance Active)"
                            : "Log In"}
                    </button>


                    {/* SIGN UP */}

                    <p className="signup-text">
                        Don't have an account?{" "}
                        {!registrationAllowed ? (
                            <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                                Registrations Paused
                            </span>
                        ) : (
                            <Link to="/signup">
                                Sign Up
                            </Link>
                        )}
                    </p>


                    {/* NOTE */}

                    <p className="bottom-note">
                        *Do not share your login credentials
                        with anyone.
                    </p>

                </form>

            </div>

        </div>
    );
}