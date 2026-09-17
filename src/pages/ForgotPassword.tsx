import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      const generatedEmail = `+255${phone.replace(/\D/g, "")}@autex.com`;
      await sendPasswordResetEmail(auth, generatedEmail);
      setSuccess(true);
      setPhone("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("user-not-found") || msg.includes("invalid-credential")) {
        setError(t.errInvalidCred);
      } else if (msg.includes("network-request-failed")) {
        setError(t.errNetwork);
      } else if (msg.includes("too-many-requests")) {
        setError(t.errTooMany);
      } else {
        setError(t.errDefault);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "16px", position: "relative", background: "var(--bg)", overflow: "hidden" }}>
      {/* Glowing orb background */}
      <div className="breathe" style={{ position: "absolute", width: 400, height: 400, background: "radial-gradient(circle, rgba(250, 204, 21, 0.12) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0 }}></div>
      
      <div className="card animate-enter" style={{ maxWidth: 440, width: "100%", zIndex: 1, border: "1px solid rgba(250, 204, 21, 0.3)", boxShadow: "0 0 50px rgba(250, 204, 21, 0.1)", background: "linear-gradient(180deg, rgba(17, 27, 51, 0.85), rgba(5, 8, 22, 0.95))", backdropFilter: "blur(16px)" }}>
        <div className="card-body" style={{ padding: "24px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="breathe" style={{ width: 56, height: 56, margin: "0 auto 12px", borderRadius: 16, background: "linear-gradient(135deg, #1a1400, #050816)", boxShadow: "0 0 0 1px rgba(250,204,21,0.3), 0 12px 40px rgba(250, 204, 21, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="30" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="crown-fp" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fef9c3" />
                    <stop offset="45%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#92400e" />
                  </linearGradient>
                </defs>
                <polygon points="4,36 13,12 24,26 35,12 44,36" fill="url(#crown-fp)" />
                <circle cx="4" cy="12" r="4" fill="#facc15" />
                <circle cx="24" cy="5" r="4" fill="#fef08a" />
                <circle cx="44" cy="12" r="4" fill="#facc15" />
                <rect x="2" y="34" width="44" height="5" rx="2.5" fill="url(#crown-fp)" />
              </svg>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span className="brand-text-mfalme" style={{ fontSize: 22 }}>AUTEX AI</span>
            </div>
            <h1 style={{ margin: 0, background: "linear-gradient(to right, #fef08a, #facc15)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: 20, letterSpacing: "-0.02em" }}>{t.resetPassword}</h1>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>{t.enterEmailReset}</p>
          </div>

          {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}
          
          {success && (
            <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", marginBottom: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h3 style={{ margin: "0 0 8px", color: "#10b981", fontSize: 16 }}>{t.checkInbox}</h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
                {t.resetSent("AUTEX AI")}
              </p>
            </div>
          )}
          
          <form className="grid" style={{ gap: 16 }} onSubmit={submit}>
            <div className="field">
              <label htmlFor="phone" style={{ color: "#fef08a", opacity: 0.9 }}>{t.phoneNumber}</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 16, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 6, pointerEvents: "none" }}>
                  <img src="https://flagcdn.com/w20/tz.png" alt="TZ" style={{ width: 20, borderRadius: 2 }} />
                  <span style={{ color: "var(--muted)", fontSize: 16, fontWeight: 500 }}>+255</span>
                </div>
                <input
                  id="phone"
                  className="input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").substring(0, 10))}
                  placeholder="712 345 678"
                  style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(250, 204, 21, 0.2)", paddingLeft: 84 }}
                  required
                />
              </div>
            </div>
            <button className="btn breathe" type="submit" disabled={busy} style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(161,98,7,0.3))", borderColor: "rgba(250,204,21,0.5)", color: "#fef08a", fontWeight: 700, padding: "14px", marginTop: "4px", boxShadow: "0 0 20px rgba(250, 204, 21, 0.15)", fontSize: 15 }}>
              {busy ? t.loading : t.sendResetLink}
            </button>
          </form>
          
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <p className="muted" style={{ fontSize: 14 }}>
              <Link to="/login" style={{ color: "#facc15", textDecoration: "underline", fontWeight: 600 }}>{t.backToLogin}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
