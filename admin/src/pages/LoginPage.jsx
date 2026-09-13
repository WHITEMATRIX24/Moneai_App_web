import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth.service";
import { FiEye, FiEyeOff } from "react-icons/fi";

import "./LoginPage.css";

export default function LoginPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add("auth-page");
        return () => {
            document.body.classList.remove("auth-page");
        };
    }, []);

    const [accountType, setAccountType] = useState("user");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    async function submit(e) {
        e.preventDefault();

        if (loading) return;

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
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Log In"}
                    </button>


                    {/* SIGN UP */}

                    <p className="signup-text">

                        Don't have an account?{" "}

                        <Link to="/signup">
                            Sign Up
                        </Link>

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