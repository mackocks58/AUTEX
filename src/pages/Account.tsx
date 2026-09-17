import { Link } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";

export default function Account() {
  const { user, isAdmin, logout } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [activeBots, setActiveBots] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    
    // Load balance
    const balanceRef = ref(db, `users/${user.uid}/balance`);
    const balanceSub = onValue(balanceRef, (snap) => {
      if (snap.exists()) {
        setBalance(snap.val());
      } else {
        setBalance(0);
      }
    });

    // Load user's bots
    const botsRef = ref(db, `userBots/${user.uid}`);
    const botsSub = onValue(botsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setActiveBots(Object.keys(data).length);
      } else {
        setActiveBots(0);
      }
    });

    return () => {
      balanceSub();
      botsSub();
    };
  }, [user]);

  if (!user) {
    return (
      <Shell>
        <div className="alert">Log in to view your account <Link to="/login">Log In</Link></div>
      </Shell>
    );
  }

  const firstName = (user.displayName || user.email?.split("@")[0] || "User").split(" ")[0];

  return (
    <Shell>
      {/* HEADER SECTION (Binance Style - Compact) */}
      <div style={{
        background: "linear-gradient(180deg, #181a20 0%, #0b0e11 100%)",
        padding: "20px 16px",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        marginBottom: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
      }}>
        {/* User Info Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="shimmer-wrapper" style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fcd535, #f0b90b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: "800",
              color: "#0b0e11",
              boxShadow: "0 4px 12px rgba(240, 185, 11, 0.2)",
              flexShrink: 0
            }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "700", color: "#eaecef" }}>
                {firstName}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="mono" style={{ fontSize: "12px", color: "#848e9c" }}>
                  UID: {user.uid.substring(0, 8)}...
                </span>
                <span className="shimmer-wrapper" style={{
                  background: isAdmin ? "rgba(14, 203, 129, 0.15)" : "rgba(240, 185, 11, 0.15)",
                  color: isAdmin ? "#0ecb81" : "#fcd535",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.2px",
                  textTransform: "uppercase",
                  border: isAdmin ? "1px solid rgba(14, 203, 129, 0.3)" : "1px solid rgba(240, 185, 11, 0.3)"
                }}>
                  {isAdmin ? "Admin" : "Verified"}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ color: "#848e9c" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

        {/* Portfolio Balance & Bots Summary */}
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ color: "#848e9c", fontSize: "12px", marginBottom: "4px", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                Estimated Balance
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#eaecef" }}>
                ${balance.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
               <div style={{ color: "#848e9c", fontSize: "12px", marginBottom: "4px", fontWeight: "500" }}>
                Active Bots
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#10b981" }}>
                {activeBots}
              </div>
            </div>
          </div>

          {/* Quick Action Hub (Icon Based) */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
            <QuickActionButton to="/deposit" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>} label="Deposit" primary />
            <QuickActionButton to="/withdraw" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>} label="Withdraw" />
            <QuickActionButton to="/transactions" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>} label="History" />
            {isAdmin && <QuickActionButton to="/admin" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>} label="Admin" accent />}
          </div>
        </div>
      </div>

      {/* COMPACT SETTINGS LIST */}
      <div style={{
        background: "#181a20",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        overflow: "hidden",
        marginBottom: "16px"
      }}>
        <div style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "600", color: "#eaecef", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
          Services
        </div>
        <SettingsRow icon="🤖" title="My Trading Bots" onClick={() => window.location.href = "/my-bots"} />
        <Divider />
        <SettingsRow icon="💰" title="My Assets" onClick={() => window.location.href = "/assets"} />
        <Divider />
        <SettingsRow icon="✨" title="Affiliate & Referral" onClick={() => window.location.href = "/affiliate"} />
        <Divider />
        <SettingsRow icon="🛡️" title="Security & API" onClick={() => {}} />
      </div>

      <div style={{
        background: "#181a20",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        overflow: "hidden",
        marginBottom: "16px"
      }}>
        <div style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "600", color: "#eaecef", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
          Support
        </div>
        <SettingsRow icon="🎧" title="Help Center" onClick={() => window.location.href = "/support"} />
        <Divider />
        <SettingsRow icon="💬" title="Community Chat" onClick={() => {}} />
        <Divider />
        <SettingsRow icon="⚙️" title="App Settings" onClick={() => {}} />
      </div>

      {/* Sign Out Button */}
      <button 
        onClick={() => void logout()}
        style={{
          width: "100%",
          background: "rgba(246, 70, 93, 0.08)",
          border: "1px solid rgba(246, 70, 93, 0.2)",
          padding: "14px",
          borderRadius: "16px",
          color: "#f6465d",
          fontSize: "14px",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(246, 70, 93, 0.15)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(246, 70, 93, 0.08)"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        Log Out
      </button>

    </Shell>
  );
}

function QuickActionButton({ to, icon, label, primary, accent }: { to: string, icon: JSX.Element, label: string, primary?: boolean, accent?: boolean }) {
  return (
    <Link to={to} style={{
      flex: "1",
      background: primary ? "#fcd535" : accent ? "rgba(14, 203, 129, 0.1)" : "rgba(255, 255, 255, 0.06)",
      color: primary ? "#181a20" : accent ? "#0ecb81" : "#eaecef",
      padding: "10px 4px",
      borderRadius: "8px",
      textDecoration: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
      transition: "all 0.2s",
      border: primary ? "none" : accent ? "1px solid rgba(14, 203, 129, 0.2)" : "1px solid rgba(255, 255, 255, 0.05)"
    }}
    onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
    onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(1)"}>
      <div style={{ opacity: primary ? 1 : 0.8 }}>
        {icon}
      </div>
      <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.2px" }}>{label}</span>
    </Link>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.04)", margin: "0 16px" }} />;
}

function SettingsRow({ icon, title, onClick }: { icon: string, title: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        padding: "14px 16px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "background 0.2s"
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ fontSize: "18px", opacity: 0.9 }}>
          {icon}
        </div>
        <div style={{ fontSize: "14px", fontWeight: "500", color: "#eaecef" }}>{title}</div>
      </div>
      <div style={{ color: "#848e9c" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </div>
  );
}
