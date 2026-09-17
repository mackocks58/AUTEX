import { Link, NavLink, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSidebar } from "@/context/SidebarContext";
import type { AppNotification } from "@/types";

function linkCls({ isActive }: { isActive: boolean }) {
  return isActive ? "active" : undefined;
}

export function Navbar() {
  const { user, loading, isAdmin, logout } = useAuth();
  const { t } = useLanguage();
  const { toggle } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Search state
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    let notifications: AppNotification[] = [];
    let userNotifications: AppNotification[] = [];
    let reads: Record<string, boolean> = {};

    const updateCount = () => {
      const all = [...notifications, ...userNotifications];
      const count = all.filter(n => n.id && !reads[n.id]).length;
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

    const userNotifRef = ref(db, `userNotifications/${user.uid}`);
    const unsubUserNotifs = onValue(userNotifRef, (snap) => {
      const data = snap.val() as Record<string, AppNotification> | null;
      if (data) {
        userNotifications = Object.entries(data).map(([id, val]) => ({ ...val, id }));
      } else {
        userNotifications = [];
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
      unsubUserNotifs();
      unsubReads();
    };
  }, [user]);

  if (isSearchActive) {
    return (
      <nav className="nav" style={{ justifyContent: "center" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 12,
          animation: "fadeIn 0.2s ease"
        }}>
          <button 
            type="button" 
            onClick={() => {
              setIsSearchActive(false);
              params.delete("q");
              setParams(params);
            }}
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "var(--text)", 
              cursor: "pointer",
              padding: 4,
              display: "flex"
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          
          <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
            <input
              type="text"
              autoFocus
              placeholder="Search coins..."
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  params.set("q", val);
                } else {
                  params.delete("q");
                }
                setParams(params);
              }}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "var(--text)",
                fontSize: 16,
                outline: "none",
              }}
            />
            {query && (
              <button 
                type="button"
                onClick={() => {
                  params.delete("q");
                  setParams(params);
                }}
                style={{
                  position: "absolute",
                  right: 0,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text)",
                  cursor: "pointer"
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="nav">
      <Link to="/" className="brand" title="AUTEX AI">
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
        <span className="brand-text-mfalme" style={{ fontSize: 14, letterSpacing: "0.06em", fontStyle: "normal" }}>AUTEX AI</span>
      </Link>
      
      <div className="nav-links">
        {/* Search Icon */}
        <button
          type="button"
          onClick={() => setIsSearchActive(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text)",
            cursor: "pointer",
            padding: "5px",
            display: "flex",
            alignItems: "center"
          }}
          title="Search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>




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
            <button type="button" onClick={() => void logout()} style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "5px 8px"
            }}>
              {t.signOut}
            </button>
          </div>
        )}

        {/* Settings / Menu toggle — always visible */}
        <button
          type="button"
          onClick={toggle}
          title="Menu"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(16,185,129,0.15)";
            e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
            e.currentTarget.style.color = "#10b981";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "var(--text)";
          }}
        >
          {/* Settings / sliders icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
            <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
