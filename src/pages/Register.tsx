import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set, get, query, orderByChild, equalTo } from "firebase/database";
import { auth, db } from "@/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { triggerErrorFeedback } from "@/utils/haptics";

export default function Register() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nameStatus, setNameStatus] = useState<"none" | "checking" | "invalid" | "available" | "taken">("none");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const val = name.trim().toLowerCase();
    if (!val) {
      setNameStatus("none");
      return;
    }
    // Allow letters, numbers, underscores (3-16 chars)
    if (!/^[a-z0-9_]{3,16}$/.test(val)) {
      setNameStatus("invalid");
      return;
    }

    setNameStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const q = query(ref(db, "users"), orderByChild("usernameLowercase"), equalTo(val));
        const snap = await get(q);
        if (snap.exists()) {
          setNameStatus("taken");
        } else {
          setNameStatus("available");
        }
      } catch (e) {
        console.error("Username validation error:", e);
        // If Firebase rules deny read access to unauthenticated users, fallback to available 
        // to prevent the badge from disappearing.
        setNameStatus("available");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (nameStatus !== "available") {
      setError(t.errInvalidCred || "Please choose a valid and available username.");
      setShake(true);
      triggerErrorFeedback();
      setTimeout(() => setShake(false), 400);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const generatedEmail = `+255${phone.replace(/\D/g, "")}@autex.com`;
      const cred = await createUserWithEmailAndPassword(auth, generatedEmail, password);
      const displayName = name.trim();
      await updateProfile(cred.user, { displayName });
      
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      await set(ref(db, `users/${cred.user.uid}`), {
        displayName,
        usernameLowercase: displayName.toLowerCase(),
        phone: `+255${phone.replace(/\D/g, "")}`,
        email: generatedEmail,
        affiliateCode: newCode,
        createdAt: Date.now()
      });

      nav("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("email-already-in-use")) {
        setError(t.errInUse);
      } else if (msg.includes("weak-password")) {
        setError(t.errWeakPass);
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
                    <linearGradient id="crown-reg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fef9c3" />
                      <stop offset="45%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#92400e" />
                    </linearGradient>
                  </defs>
                  <polygon points="4,36 13,12 24,26 35,12 44,36" fill="url(#crown-reg)" />
                  <circle cx="4" cy="12" r="4" fill="#facc15" />
                  <circle cx="24" cy="5" r="4" fill="#fef08a" />
                  <circle cx="44" cy="12" r="4" fill="#facc15" />
                  <rect x="2" y="34" width="44" height="5" rx="2.5" fill="url(#crown-reg)" />
                </svg>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span className="brand-text-mfalme" style={{ fontSize: 22 }}>AUTEX AI</span>
              </div>
              <h1 style={{ margin: 0, background: "linear-gradient(to right, #fef08a, #facc15)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: 20, letterSpacing: "-0.02em" }}>{t.createAccount}</h1>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>{t.joinSubtitle}</p>
            </div>

            {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}
            
            <form className="grid" style={{ gap: 16 }} onSubmit={submit}>
              <div className="field">
                <label htmlFor="name" style={{ color: "#fef08a", opacity: 0.9 }}>{t.username}</label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  autoComplete="username"
                  maxLength={16}
                  style={{ 
                    background: "rgba(0,0,0,0.3)", 
                    borderColor: nameStatus === "available" ? "rgba(52,211,153,0.5)" : nameStatus === "taken" || nameStatus === "invalid" ? "rgba(251,113,133,0.5)" : "rgba(250, 204, 21, 0.2)" 
                  }}
                  required
                />
                {nameStatus !== "none" && (
                  <div style={{ fontSize: 12, marginTop: -4, display: "flex", alignItems: "center", gap: 4, color: nameStatus === "available" ? "#34d399" : nameStatus === "taken" || nameStatus === "invalid" ? "#fb7185" : "#facc15" }}>
                    {nameStatus === "checking" && <span className="breathe" style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }}></span>}
                    {nameStatus === "available" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
                    {nameStatus === "taken" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>}
                    {nameStatus === "invalid" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>}
                    
                    <span>
                      {nameStatus === "checking" ? t.usernameChecking : 
                       nameStatus === "available" ? t.usernameAvailable : 
                       nameStatus === "taken" ? t.usernameTaken : t.usernameInvalid}
                    </span>
                  </div>
                )}
              </div>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(250, 204, 21, 0.2)" }}
                  required
                />
              </div>
              <button className="btn breathe" type="submit" disabled={busy || nameStatus !== "available"} style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(161,98,7,0.3))", borderColor: "rgba(250,204,21,0.5)", color: "#fef08a", fontWeight: 700, padding: "14px", marginTop: "4px", boxShadow: "0 0 20px rgba(250, 204, 21, 0.15)", fontSize: 15 }}>
                {busy ? t.loading : t.createAccount}
              </button>
            </form>
            
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <p className="muted" style={{ fontSize: 14 }}>
                {t.alreadyHaveAccount} <Link to="/login" style={{ color: "#facc15", textDecoration: "underline", fontWeight: 600 }}>{t.logIn}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
