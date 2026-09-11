import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./LoginPage.css";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {

    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");

    function handleContinue(e) {

        e.preventDefault();

        const value = identifier.trim();

        if (value === "") {
            alert("Please enter your email or phone number.");
            return;
        }

        // Email Validation
        if (value.includes("@")) {

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(value)) {
                alert("Please enter a valid email address.");
                return;
            }

            navigate("/email-verification");
            return;
        }

        // Phone Validation
        const phoneRegex = /^[0-9]{10}$/;

        if (!phoneRegex.test(value)) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        navigate("/verify-otp");
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
                    onSubmit={handleContinue}
                >

                    <h2>Forgot Password</h2>

                    <p className="subtitle">
                        Enter your registered email address or phone number to recover your account.
                    </p>

                    <div className="field">

                        <label>Email or Phone Number</label>

                        <input
                            type="text"
                            placeholder="Enter your email or phone number"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />

                    </div>

                    <button
                        type="submit"
                        className="login-btn"
                    >
                        Continue
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