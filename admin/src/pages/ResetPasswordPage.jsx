import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./LoginPage.css";
import "./ResetPasswordPage.css";

export default function ResetPasswordPage() {

    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    function handleResetPassword(e){

        e.preventDefault();

        if(password !== confirmPassword){

            alert("Passwords do not match.");

            return;

        }

        alert("Password reset successfully!");

        navigate("/login");

    }

    return(

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

                <div className="copyright">
                    © 2026 MONE AI. All rights reserved.
                </div>

            </div>

            {/* RIGHT PANEL */}

            <div className="login-right">

                <form
                    className="login-form"
                    onSubmit={handleResetPassword}
                >

                    <h2>Reset Password</h2>

                    <p className="subtitle">
                        Create a new password for your account.
                    </p>

                    {/* Password */}

                    <div className="field">

                        <label>New Password</label>

                        <div className="password-wrapper">

                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e)=>setPassword(e.target.value)}
                                required
                            />

                            <button
                                type="button"
                                className="eye-button"
                                onClick={()=>
                                    setShowPassword(!showPassword)
                                }
                            >
                                {showPassword ? "🙈" : "👁"}
                            </button>

                        </div>

                    </div>

                    {/* Confirm Password */}

                    <div className="field">

                        <label>Confirm Password</label>

                        <div className="password-wrapper">

                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e)=>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                            />

                            <button
                                type="button"
                                className="eye-button"
                                onClick={()=>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                {showConfirmPassword ? "🙈" : "👁"}
                            </button>

                        </div>

                    </div>

                    {confirmPassword && (

                        <p
                            className={
                                password===confirmPassword
                                    ? "password-match success"
                                    : "password-match error"
                            }
                        >

                            {password===confirmPassword
                                ? "✔ Passwords match"
                                : "✖ Passwords do not match"}

                        </p>

                    )}

                    <button
                        type="submit"
                        className="login-btn"
                    >
                        Reset Password
                    </button>

                    <p className="signup-text">

                        <Link to="/login">

                            ← Back to Login

                        </Link>

                    </p>

                </form>

            </div>

        </div>

    );

}