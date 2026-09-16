import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

function linkCls({ isActive }: { isActive: boolean }) {
  return isActive ? "dock-item active" : "dock-item";
}

/** Modal that appears when a guest taps a protected nav item */
function LoginPromptModal({
  section,
  onClose,
}: {
  section: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 8, 22, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 200,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: "fixed",
          bottom: 100,
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 40px)",
          maxWidth: 360,
          zIndex: 201,
          background: "linear-gradient(160deg, rgba(17,27,51,0.98), rgba(5,8,22,0.98))",
          border: "1px solid rgba(250, 204, 21, 0.35)",
          borderRadius: 20,
          boxShadow: "0 0 60px rgba(250, 204, 21, 0.18), 0 24px 60px rgba(0,0,0,0.6)",
          padding: "28px 24px 24px",
          animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          textAlign: "center",
        }}
      >
        {/* Crown icon */}
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 16px",
            borderRadius: 16,
            background: "linear-gradient(135deg, #1a1400, #050816)",
            boxShadow: "0 0 0 1px rgba(250,204,21,0.3), 0 8px 28px rgba(250,204,21,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="32" height="26" viewBox="0 0 28 24" fill="none">
            <defs>
              <linearGradient id="modal-crown" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef9c3" />
                <stop offset="45%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
            </defs>
            <polygon points="2,22 7,8 14,16 21,8 26,22" fill="url(#modal-crown)" />
            <circle cx="2" cy="8" r="2.5" fill="#facc15" />
            <circle cx="14" cy="4" r="2.5" fill="#fef08a" />
            <circle cx="26" cy="8" r="2.5" fill="#facc15" />
          </svg>
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 18,
            fontWeight: 800,
            background: "linear-gradient(to right, #fef08a, #facc15)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t.signInRequired}
        </h2>
        <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>
          {t.signInDesc(section)}
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.25)",
              background: "transparent",
              color: "var(--muted)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onClose(); navigate("/register"); }}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 12,
              border: "1px solid rgba(250,204,21,0.4)",
              background: "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(161,98,7,0.3))",
              color: "#fef08a",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t.register}
          </button>
          <button
            onClick={() => { onClose(); navigate("/login"); }}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #facc15, #a16207)",
              color: "#050816",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t.logIn}
          </button>
        </div>
      </div>
    </>
  );
}

/** A dock item that intercepts the tap if the user is a guest */
function GuardedDockItem({
  to,
  label,
  icon,
  isGuest,
  onGuest,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  isGuest: boolean;
  onGuest: (section: string) => void;
}) {
  if (isGuest) {
    return (
      <button
        className="dock-item"
        onClick={() => onGuest(label)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <NavLink to={to} className={({ isActive }) => isActive ? "dock-item active" : "dock-item"}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export function BottomNav() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [promptSection, setPromptSection] = useState<string | null>(null);
  const isGuest = !user;

  const handleGuest = (section: string) => setPromptSection(section);
  const closePrompt = () => setPromptSection(null);

  return (
    <>
      <div className="bottom-dock-container">
        <nav className="bottom-dock">
          {/* Home — always accessible */}
          <NavLink to="/" className={linkCls} end>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{t.home}</span>
          </NavLink>

          {/* Chat — protected */}
          <GuardedDockItem
            to="/chat"
            label={t.chat}
            isGuest={isGuest}
            onGuest={handleGuest}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            }
          />

          {/* Bots — protected */}
          <GuardedDockItem
            to="/bots"
            label="Bots"
            isGuest={isGuest}
            onGuest={handleGuest}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8" y2="16" />
                <line x1="16" y1="16" x2="16" y2="16" />
              </svg>
            }
          />

          {/* Wallet — protected */}
          <GuardedDockItem
            to="/payments"
            label={t.wallet}
            isGuest={isGuest}
            onGuest={handleGuest}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
          />

          {/* Profile — protected */}
          <GuardedDockItem
            to="/account"
            label={t.profile}
            isGuest={isGuest}
            onGuest={handleGuest}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </nav>
      </div>

      {/* Login prompt modal */}
      {promptSection && (
        <LoginPromptModal section={promptSection} onClose={closePrompt} />
      )}
    </>
  );
}
