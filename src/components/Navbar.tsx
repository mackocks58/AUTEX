import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { AppNotification } from "@/types";

function linkCls({ isActive }: { isActive: boolean }) {
  return isActive ? "active" : undefined;
}

export function Navbar() {
  const { user, loading, isAdmin, logout } = useAuth();
  const { lang, toggle, t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    let notifications: AppNotification[] = [];
    let reads: Record<string, boolean> = {};

    const updateCount = () => {
      const count = notifications.filter(n => n.id && !reads[n.id]).length;
      setUnreadCount(count);
    };

    const notifRef = ref(db, "notifications");
    const unsubNotifs = onValue(notifRef, (snap) => {
      const data = snap.val() as Record<string, AppNotification> | null;
      if (data) {
        notifications = Object.entries(data).map(([id, val]) => ({ ...val, id }));
      } else {
        notifications = [];
      }
      updateCount();
    });

    const readsRef = ref(db, `userReads/${user.uid}`);
    const unsubReads = onValue(readsRef, (snap) => {
      reads = snap.val() || {};
      updateCount();
    });

    return () => {
      unsubNotifs();
      unsubReads();
    };
  }, [user]);

  return (
    <nav className="nav">
      <Link to="/" className="brand" title="Mfalme wa Mikeka">
        <span aria-hidden style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="22" height="18" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="crown-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef9c3" />
                <stop offset="40%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
            </defs>
            <polygon points="2,22 7,8 14,16 21,8 26,22" fill="url(#crown-grad)" />
            <circle cx="2" cy="8" r="2.5" fill="#facc15" />
            <circle cx="14" cy="4" r="2.5" fill="#fef08a" />
            <circle cx="26" cy="8" r="2.5" fill="#facc15" />
          </svg>
        </span>
        <span className="brand-text-mfalme" style={{ fontSize: 14, letterSpacing: "0.06em", fontStyle: "normal" }}>MWM</span>
      </Link>
      <div className="nav-links">
        {/* Language toggle */}
        <button
          type="button"
          onClick={toggle}
          title={t.languageToggle}
          style={{
            background: "rgba(250,204,21,0.1)",
            border: "1px solid rgba(250,204,21,0.25)",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 700,
            color: "#facc15",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.2s",
            letterSpacing: "0.04em",
          }}
        >
          🌐 {lang === "en" ? "SW" : "EN"}
        </button>

        <NavLink to="/movies" className={linkCls}>
          {t.movies}
        </NavLink>
        {user && isAdmin && (
          <NavLink to="/admin" className={linkCls}>
            {t.admin}
          </NavLink>
        )}
        {!loading && !user && (
          <>
            <NavLink to="/login" className={linkCls}>
              {t.logIn}
            </NavLink>
            <NavLink to="/register" className={linkCls}>
              {t.register}
            </NavLink>
          </>
        )}
        {user && (
          <div className="row" style={{ alignItems: "center", gap: 16 }}>
            <Link to="/notifications" style={{ position: "relative", display: "flex", alignItems: "center", color: "var(--text)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "var(--danger)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "bold",
                  borderRadius: "10px",
                  padding: "2px 6px",
                  minWidth: 18,
                  textAlign: "center"
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <button type="button" onClick={() => void logout()}>
              {t.signOut}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
