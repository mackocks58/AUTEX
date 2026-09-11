import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { triggerErrorFeedback } from "@/utils/haptics";

export default function Login() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const generatedEmail = `+255${phone.replace(/\D/g, "")}@mfalmewamikeka.com`;
      await signInWithEmailAndPassword(auth, generatedEmail, password);
      nav("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        setError(t.errInvalidCred);
      } else if (msg.includes("network-request-failed")) {
        setError(t.errNetwork);
      } else if (msg.includes("too-many-requests")) {
        setError(t.errTooMany);
      } else {
        setError(t.errDefault);
      }
      
      setShake(true);
      triggerErrorFeedback();
      setTimeout(() => setShake(false), 400);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "16px", position: "relative", background: "var(--bg)", overflow: "hidden" }}>
      {/* Glowing orb background */}
        <div className="breathe" style={{ position: "absolute", width: 400, height: 400, background: "radial-gradient(circle, rgba(250, 204, 21, 0.12) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0 }}></div>
        
        <div className={`card animate-enter ${shake ? "shake" : ""}`} style={{ maxWidth: 440, width: "100%", zIndex: 1, border: "1px solid rgba(250, 204, 21, 0.3)", boxShadow: "0 0 50px rgba(250, 204, 21, 0.1)", background: "linear-gradient(180deg, rgba(17, 27, 51, 0.85), rgba(5, 8, 22, 0.95))", backdropFilter: "blur(16px)" }}>
          <div className="card-body" style={{ padding: "24px 20px" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div className="breathe" style={{ width: 56, height: 56, margin: "0 auto 12px", borderRadius: 16, background: "linear-gradient(135deg, #1a1400, #050816)", boxShadow: "0 0 0 1px rgba(250,204,21,0.3), 0 12px 40px rgba(250, 204, 21, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="36" height="30" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="crown-lg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fef9c3" />
                      <stop offset="45%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#92400e" />
                    </linearGradient>
                  </defs>
                  <polygon points="4,36 13,12 24,26 35,12 44,36" fill="url(#crown-lg)" />
                  <circle cx="4" cy="12" r="4" fill="#facc15" />
                  <circle cx="24" cy="5" r="4" fill="#fef08a" />
                  <circle cx="44" cy="12" r="4" fill="#facc15" />
                  <rect x="2" y="34" width="44" height="5" rx="2.5" fill="url(#crown-lg)" />
                </svg>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span className="brand-text-mfalme" style={{ fontSize: 22 }}>Mfalme wa Mikeka</span>
              </div>
              <h1 style={{ margin: 0, background: "linear-gradient(to right, #fef08a, #facc15)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: 20, letterSpacing: "-0.02em" }}>{t.welcomeBack}</h1>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>{t.signInSubtitle}</p>
            </div>

            {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}
            
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
              <div className="field">
                <label htmlFor="password" style={{ color: "#fef08a", opacity: 0.9 }}>{t.password}</label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(250, 204, 21, 0.2)" }}
                  required
                />
              </div>
              <button className="btn breathe" type="submit" disabled={busy} style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(161,98,7,0.3))", borderColor: "rgba(250,204,21,0.5)", color: "#fef08a", fontWeight: 700, padding: "14px", marginTop: "4px", boxShadow: "0 0 20px rgba(250, 204, 21, 0.15)", fontSize: 15 }}>
                {busy ? t.loading : t.signIn}
              </button>
            </form>
            
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <p className="muted" style={{ fontSize: 14, marginBottom: 8 }}>
                <Link to="/forgot-password" style={{ color: "rgba(250, 204, 21, 0.8)", textDecoration: "underline" }}>{t.forgotPassword}</Link>
              </p>
              <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                {t.noAccount} <Link to="/register" style={{ color: "#facc15", textDecoration: "underline", fontWeight: 600 }}>{t.createAccount}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
