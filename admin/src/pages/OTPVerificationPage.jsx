import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./LoginPage.css";
import "./OTPVerificationPage.css";

export default function OTPVerificationPage() {

    const navigate = useNavigate();

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    function handleChange(value, index) {

        if (!/^[0-9]?$/.test(value)) return;

        const newOtp = [...otp];

        newOtp[index] = value;

        setOtp(newOtp);

        if (value && index < otp.length - 1) {

            const nextInput = document.getElementById(`otp-${index + 1}`);

            if (nextInput) {
                nextInput.focus();
            }

        }

    }

    function handleVerify(e) {

        e.preventDefault();

        if (otp.join("").length !== 6) {

            alert("Please enter the complete OTP.");

            return;

        }

        navigate("/reset-password");

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

                <div className="copyright">
                    © 2026 MONE AI. All rights reserved.
                </div>

            </div>

            {/* RIGHT PANEL */}

            <div className="login-right">

                <form
                    className="login-form"
                    onSubmit={handleVerify}
                >

                    <h2>Verify OTP</h2>

                    <p className="subtitle">
                        We've sent a verification code to your registered phone number.
                    </p>

                    <div className="otp-container">

                        {otp.map((digit, index) => (

                            <input
                                key={index}
                                id={`otp-${index}`}
                                className="otp-input"
                                type="text"
                                maxLength="1"
                                value={digit}

                                onChange={(e) =>
                                    handleChange(e.target.value, index)
                                }

                                onKeyDown={(e) => {

                                    if (
                                        e.key === "Backspace" &&
                                        !otp[index] &&
                                        index > 0
                                    ) {

                                        const previousInput =
                                            document.getElementById(`otp-${index - 1}`);

                                        if (previousInput) {
                                            previousInput.focus();
                                        }

                                    }

                                }}

                            />

                        ))}

                    </div>

                    <button
                        type="submit"
                        className="login-btn"
                    >
                        Verify OTP
                    </button>

                    <p className="resend-text">

                        Didn't receive the OTP?

                        <button
                            type="button"
                            className="resend-btn"
                            onClick={() => alert("OTP Sent Again")}
                        >
                            Resend OTP
                        </button>

                    </p>

                    <p className="signup-text">

                        <Link to="/forgot-password">

                            ← Back

                        </Link>

                    </p>

                </form>

            </div>

        </div>

    );

}