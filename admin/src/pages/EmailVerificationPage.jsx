import { Link } from "react-router-dom";

import "./LoginPage.css";
import "./EmailVerificationPage.css";

export default function EmailVerificationPage() {
    return (
        <div className="email-verification-page login-page">

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

                <div className="login-form">

                    <h2>Check Your Email</h2>

                    <p className="subtitle">
                        We've sent a password reset link to your registered
                        email address.
                    </p>

                    <div className="email-icon">
                        📧
                    </div>

                    <button
                        type="button"
                        className="login-btn"
                        onClick={() => alert("Verification email sent again.")}
                    >
                        Resend Email
                    </button>

                    <p className="signup-text">

                        <Link to="/login">

                            ← Back to Login

                        </Link>

                    </p>

                </div>

            </div>

        </div>
    );
}