import "./LoginPage.css";

export default function AuthLayout({ children }) {
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

          <p className="tagline">Manage your platform with confidence.</p>
        </div>

        <div className="copyright">© 2026 MONE AI. All rights reserved.</div>
      </div>

      {/* RIGHT PANEL */}

      <div className="login-right">{children}</div>
    </div>
  );
}
