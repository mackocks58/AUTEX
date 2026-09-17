import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ref, onValue, set } from "firebase/database";
import { db } from "@/firebase";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/context/AuthContext";
import type { AppNotification } from "@/types";

export default function Notifications() {
  const { user } = useAuth();
  
  const [globalNotifs, setGlobalNotifs] = useState<AppNotification[]>([]);
  const [userNotifs, setUserNotifs] = useState<AppNotification[]>([]);
  const [reads, setReads] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"all" | "system" | "activity">("all");

  useEffect(() => {
    if (!user) return;
    
    let loadedGlobal = false;
    let loadedUser = false;
    
    const checkLoaded = () => {
      if (loadedGlobal && loadedUser) {
        setLoading(false);
      }
    };

    const unsubGlobal = onValue(ref(db, "notifications"), (snap) => {
      const data = snap.val() as Record<string, AppNotification> | null;
      if (data) {
        setGlobalNotifs(Object.entries(data).map(([id, val]) => ({ ...val, id, type: val.type || "system" })));
      } else {
        setGlobalNotifs([]);
      }
      loadedGlobal = true;
      checkLoaded();
    });

    const unsubUser = onValue(ref(db, `userNotifications/${user.uid}`), (snap) => {
      const data = snap.val() as Record<string, AppNotification> | null;
      if (data) {
        setUserNotifs(Object.entries(data).map(([id, val]) => ({ ...val, id, type: val.type || "activity" })));
      } else {
        setUserNotifs([]);
      }
      loadedUser = true;
      checkLoaded();
    });

    const unsubReads = onValue(ref(db, `userReads/${user.uid}`), (snap) => {
      setReads(snap.val() || {});
    });

    return () => {
      unsubGlobal();
      unsubUser();
      unsubReads();
    };
  }, [user]);

  const allNotifications = useMemo(() => {
    return [...globalNotifs, ...userNotifs].sort((a, b) => b.createdAt - a.createdAt);
  }, [globalNotifs, userNotifs]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return allNotifications;
    return allNotifications.filter(n => n.type === activeTab);
  }, [allNotifications, activeTab]);

  const unreadCount = allNotifications.filter((n) => n.id && !reads[n.id]).length;

  const markAsRead = async (id: string) => {
    if (!user || reads[id]) return;
    try {
      await set(ref(db, `userReads/${user.uid}/${id}`), true);
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const newReads = { ...reads };
    allNotifications.forEach((n) => {
      if (n.id) newReads[n.id] = true;
    });
    try {
      await set(ref(db, `userReads/${user.uid}`), newReads);
    } catch {
      // ignore
    }
  };

  if (!user) {
    return (
      <Shell>
        <div className="alert">
          Log in to view your notifications. <Link to="/login">Log in</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <style>{`
        .binance-tabs {
          display: flex;
          gap: 24px;
          border-bottom: 1px solid var(--stroke);
          margin-bottom: 24px;
        }
        .binance-tab {
          background: transparent;
          border: none;
          color: var(--muted);
          font-size: 15px;
          font-weight: 600;
          padding: 12px 4px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }
        .binance-tab:hover {
          color: var(--text);
        }
        .binance-tab.active {
          color: #fcd535; /* Binance yellow */
        }
        .binance-tab.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: #fcd535;
          border-radius: 3px 3px 0 0;
        }
        .notif-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 16px;
          transition: background 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        .notif-card:hover {
          background: rgba(255,255,255,0.05);
        }
        .notif-card.unread {
          background: rgba(252, 213, 53, 0.05);
          border-color: rgba(252, 213, 53, 0.2);
        }
        .shimmer {
          background: #2a2e33;
          background-image: linear-gradient(to right, #2a2e33 0%, #32383e 20%, #2a2e33 40%, #2a2e33 100%);
          background-repeat: no-repeat;
          background-size: 800px 100%; 
          animation: placeholderShimmer 1.5s infinite linear forwards;
          border-radius: 4px;
        }
        @keyframes placeholderShimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon-system {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }
        .icon-activity {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Notification Center</h1>
          {unreadCount > 0 && (
            <button 
              onClick={() => void markAllAsRead()}
              style={{ background: "transparent", border: "none", color: "#fcd535", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="binance-tabs">
          <button className={`binance-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
            All
          </button>
          <button className={`binance-tab ${activeTab === "system" ? "active" : ""}`} onClick={() => setActiveTab("system")}>
            System Messages
          </button>
          <button className={`binance-tab ${activeTab === "activity" ? "active" : ""}`} onClick={() => setActiveTab("activity")}>
            Activities
          </button>
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            // Shimmer Loading State
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="notif-card" style={{ cursor: "default" }}>
                <div className="shimmer icon-circle" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                  <div className="shimmer" style={{ width: "40%", height: 16 }} />
                  <div className="shimmer" style={{ width: "80%", height: 14 }} />
                  <div className="shimmer" style={{ width: "20%", height: 12, marginTop: 4 }} />
                </div>
              </div>
            ))
          ) : filteredNotifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 12 }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 16 }}>
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
              </svg>
              <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>No Notifications</h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>You are all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isUnread = n.id && !reads[n.id];
              const isActivity = n.type === "activity";
              
              return (
                <div
                  key={n.id}
                  className={`notif-card ${isUnread ? "unread" : ""}`}
                  onClick={() => {
                    if (isUnread && n.id) void markAsRead(n.id);
                  }}
                >
                  <div className={`icon-circle ${isActivity ? "icon-activity" : "icon-system"}`}>
                    {isActivity ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="22"></line>
                        <polyline points="17 5 12 2 7 5"></polyline>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: isUnread ? "var(--text)" : "var(--muted)" }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", marginLeft: 16 }}>
                        {new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                    
                    <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" }}>
                      {n.message}
                    </div>
                    
                    {n.imageUrl && (
                      <img
                        src={n.imageUrl}
                        alt="attachment"
                        style={{ marginTop: 12, maxWidth: "100%", maxHeight: 200, borderRadius: 8, objectFit: "cover" }}
                      />
                    )}
                  </div>
                  
                  {isUnread && (
                    <div style={{ display: "flex", alignItems: "center", paddingLeft: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fcd535" }} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Shell>
  );
}
