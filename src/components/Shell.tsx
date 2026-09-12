import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { db } from "@/firebase";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "radial-gradient(ellipse at 30% 20%, rgba(161,98,7,0.18) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(120,53,15,0.14) 0%, transparent 60%), var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      textAlign: "center",
      backdropFilter: "blur(20px)",
    }}>
      {/* Animated gears */}
      <div style={{ position: "relative", width: 120, height: 120, marginBottom: 32 }}>
        {/* Outer gear spin */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "spin 8s linear infinite",
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path
              d="M60 20 L65 10 L75 14 L74 25 Q82 29 88 36 L99 33 L105 42 L97 49 Q99 57 97 65 L106 72 L103 82 L92 81 Q88 88 82 92 L85 103 L76 107 L69 98 Q62 100 55 98 L48 107 L39 103 L42 92 Q36 88 32 81 L21 82 L18 72 L27 65 Q25 57 27 49 L19 42 L25 33 L36 36 Q42 29 50 25 L49 14 L59 10 Z"
              stroke="rgba(250,204,21,0.5)"
              strokeWidth="2"
              fill="rgba(250,204,21,0.07)"
            />
          </svg>
        </div>
        {/* Inner gear counter-spin */}
        <div style={{
          position: "absolute",
          inset: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "spin 5s linear infinite reverse",
        }}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path
              d="M30 10 L33 5 L38 7 L37 13 Q41 15 44 18 L50 17 L53 21 L49 25 Q50 29 49 33 L53 36 L52 41 L46 41 Q44 44 41 46 L43 52 L38 54 L35 49 Q31 50 27 49 L24 54 L19 52 L21 46 Q18 44 16 41 L10 41 L9 36 L13 33 Q12 29 13 25 L9 21 L12 17 L18 18 Q21 15 25 13 L24 7 L29 5 Z"
              stroke="rgba(250,204,21,0.7)"
              strokeWidth="2"
              fill="rgba(250,204,21,0.12)"
            />
          </svg>
        </div>
        {/* Center dot */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#facc15",
          boxShadow: "0 0 20px rgba(250,204,21,0.8)",
          animation: "pulse 2s ease-in-out infinite",
        }} />
      </div>

      {/* Title */}
      <h1 style={{
        margin: "0 0 12px",
        fontSize: "clamp(24px, 6vw, 36px)",
        fontWeight: 900,
        background: "linear-gradient(135deg, #fef08a, #facc15, #eab308)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
      }}>
        Under Maintenance
      </h1>

      {/* Divider */}
      <div style={{
        width: 60,
        height: 3,
        borderRadius: 2,
        background: "linear-gradient(90deg, transparent, #facc15, transparent)",
        margin: "0 auto 20px",
      }} />

      {/* Message */}
      <p style={{
        margin: "0 0 32px",
        fontSize: "clamp(14px, 4vw, 16px)",
        color: "rgba(254,240,138,0.8)",
        lineHeight: 1.6,
        maxWidth: 400,
      }}>
        {message || "We are currently performing scheduled maintenance. We'll be back shortly. Thank you for your patience!"}
      </p>

      {/* Status chips */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
        {["System Update", "Data Security", "Performance"].map((label) => (
          <div key={label} style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            background: "rgba(250,204,21,0.08)",
            border: "1px solid rgba(250,204,21,0.25)",
            color: "#fde047",
            fontSize: 12,
            fontWeight: 600,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#facc15",
              boxShadow: "0 0 6px rgba(250,204,21,0.8)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
            {label}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p style={{
        margin: 0,
        fontSize: 12,
        color: "rgba(148,163,184,0.6)",
        letterSpacing: "0.03em",
      }}>
        🔒 Access temporarily restricted — please check back soon
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function NetworkDetector() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setJustCameOnline(true);
      setTimeout(() => setJustCameOnline(false), 3500); // Hide the "back online" message after 3.5s
    }

    function handleOffline() {
      setIsOnline(false);
      setJustCameOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    if (justCameOnline) {
      return (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(16, 185, 129, 0.9)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 30,
          fontWeight: 700,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 8px 32px rgba(16,185,129,0.3)",
          zIndex: 99999,
          animation: "slideUpFade 0.4s ease-out",
        }}>
          <span style={{ fontSize: 18 }}>🟢</span>
          Back Online!
          <style>{`
            @keyframes slideUpFade {
              from { opacity: 0; transform: translate(-50%, 20px); }
              to { opacity: 1; transform: translate(-50%, 0); }
            }
          `}</style>
        </div>
      );
    }
    return null;
  }

  // Offline Full Screen Blocker
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, transparent 70%), var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      textAlign: "center",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        width: 100,
        height: 100,
        borderRadius: "50%",
        background: "rgba(220,38,38,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        boxShadow: "0 0 40px rgba(220,38,38,0.2)",
        animation: "pulseRed 2s infinite ease-in-out",
      }}>
        <span style={{ fontSize: 48, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>📡</span>
      </div>

      <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 900, color: "#f87171" }}>
        No Internet Connection
      </h1>

      <p style={{ margin: "0 0 24px", fontSize: 15, color: "var(--muted)", maxWidth: 320, lineHeight: 1.5 }}>
        You are currently offline. Please check your network or Wi-Fi settings to continue using the app.
      </p>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 20,
        background: "rgba(220,38,38,0.1)",
        border: "1px solid rgba(220,38,38,0.2)",
        color: "#fca5a5",
        fontSize: 13,
        fontWeight: 600,
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#ef4444",
          animation: "blink 1s infinite",
        }} />
        Waiting for network...
      </div>

      <style>{`
        @keyframes pulseRed {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const { t } = useLanguage();
  const { isAdmin, loading: authLoading } = useAuth();
  const query = params.get("q") || "";

  const [maintenance, setMaintenance] = useState<MaintenanceSettings>({
    maintenanceMode: false,
    maintenanceMessage: "",
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const r = ref(db, "settings");
    return onValue(r, (snap) => {
      const val = snap.val();
      setMaintenance({
        maintenanceMode: Boolean(val?.maintenanceMode),
        maintenanceMessage: val?.maintenanceMessage || "",
      });
      setSettingsLoaded(true);
    }, () => {
      // If we can't read settings (e.g. offline), don't block users
      setSettingsLoaded(true);
    });
  }, []);

  // Block non-admin users when maintenance is on
  // Wait for both auth and settings to load to avoid flash
  const isBlocked = settingsLoaded && !authLoading && maintenance.maintenanceMode && !isAdmin;

  return (
    <div className="shell">
      <NetworkDetector />
      {/* Full-screen maintenance block for non-admin users */}
      {isBlocked && <MaintenanceScreen message={maintenance.maintenanceMessage} />}

      <Navbar />

      {/* Subtle maintenance banner for admins — so they know it's active */}
      {maintenance.maintenanceMode && isAdmin && (
        <div style={{
          background: "rgba(234,179,8,0.15)",
          borderBottom: "1px solid rgba(250,204,21,0.35)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: "#fde047",
          fontWeight: 700,
        }}>
          <span>🔧</span>
          <span>Maintenance mode is ON — only you (admin) can see this. Users are blocked.</span>
          <a href="/admin" style={{ color: "#facc15", marginLeft: "auto", textDecoration: "underline" }}>
            Manage →
          </a>
        </div>
      )}

      <div className="search-container">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder={t.searchPlaceholder}
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
        />
      </div>
      {children}
      <BottomNav />
    </div>
  );
}
