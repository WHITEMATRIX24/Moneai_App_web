import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./LoginPage.css";
import "./SignupPage.css";

import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";

import { registerUser } from "../services/auth.service";

export default function SignupPage() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    async function handleSignup(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }

        try {
            await registerUser({
                name: fullName,
                email,
                password,
                phone,
            });

            toast.success("Account created successfully!");

            navigate("/login");
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Unable to create account.";

            toast.error(message);
        }
    }

    return (
        <div className="signup-page login-page">

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

                <div className="signup-container">

                    <form
                        className="login-form"
                        onSubmit={handleSignup}
                    >

                        <h2>Sign Up</h2>

                        <p className="subtitle">
                            Create your mone.ai account.
                        </p>


                        {/* Full Name */}

                        <div className="field">

                            <label>Full Name</label>

                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) =>
                                    setFullName(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* Email */}

                        <div className="field">

                            <label>Email</label>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* Phone Number */}

                        <div className="field">

                            <label>Phone Number</label>

                            <input
                                type="tel"
                                placeholder="Enter phone number"
                                value={phone}
                                onChange={(e) =>
                                    setPhone(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* Password */}

                        <div className="field">

                            <label>Password</label>

                            <div className="password-wrapper">

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Create password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="eye-button"
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


                        {/* Confirm Password */}

                        <div className="field">

                            <label>Confirm Password</label>

                            <div className="password-wrapper">

                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="eye-button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <FiEyeOff />
                                    ) : (
                                        <FiEye />
                                    )}
                                </button>

                            </div>

                        </div>


                        {/* Password Match Message */}

                        {confirmPassword && (
                            <p
                                className={
                                    password === confirmPassword
                                        ? "password-match success"
                                        : "password-match error"
                                }
                            >
                                {password === confirmPassword
                                    ? "✔ Passwords match"
                                    : "✖ Passwords do not match"}
                            </p>
                        )}


                        {/* Create Account */}

                        <button
                            type="submit"
                            className="login-btn"
                        >
                            Create Account
                        </button>


                        {/* Divider */}

                        <div className="divider">

                            <span>OR</span>

                        </div>


                        {/* Google Sign Up */}

                        <button
                            type="button"
                            className="google-btn"
                            onClick={() =>
                                alert("Google Sign Up Demo")
                            }
                        >
                            🌐

                            Continue with Google

                        </button>


                        {/* Login Link */}

                        <p className="signup-text">

                            Already have an account?{" "}

                            <Link to="/login">
                                Log In
                            </Link>

                        </p>

                    </form>

                </div>

            </div>

        </div>
    );
}