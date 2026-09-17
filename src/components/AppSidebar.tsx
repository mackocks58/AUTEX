import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: JSX.Element;
}

const USER_NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/bots",
    label: "Trading Bots",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <line x1="12" y1="3" x2="12" y2="7" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    ),
  },
  {
    href: "/deposit",
    label: "Deposit",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    ),
  },
  {
    href: "/withdraw",
    label: "Withdraw",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    href: "/affiliate",
    label: "Affiliate",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Account",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/support",
    label: "Support",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

export function AppSidebar() {
  const { open, close } = useSidebar();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const navItems = isAdmin ? [...ADMIN_NAV, ...USER_NAV] : USER_NAV;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Sidebar panel */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 1001,
          width: 290,
          background:
            "linear-gradient(160deg, rgba(11,18,36,0.98) 0%, rgba(5,8,22,0.98) 100%)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(148,163,184,0.1)",
          boxShadow: "8px 0 40px rgba(0,0,0,0.6)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid rgba(148,163,184,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Crown logo */}
            <svg width="24" height="20" viewBox="0 0 28 24" fill="none">
              <defs>
                <linearGradient id="sb-crown-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fef9c3" />
                  <stop offset="40%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#a16207" />
                </linearGradient>
              </defs>
              <polygon points="2,22 7,8 14,16 21,8 26,22" fill="url(#sb-crown-grad)" />
              <circle cx="2" cy="8" r="2.5" fill="#facc15" />
              <circle cx="14" cy="4" r="2.5" fill="#fef08a" />
              <circle cx="26" cy="8" r="2.5" fill="#facc15" />
            </svg>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                background: "linear-gradient(135deg, #facc15, #fef08a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.06em",
              }}
            >
              AUTEX AI
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={close}
            title="Close menu"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User info pill */}
        {user && (
          <div
            style={{
              margin: "16px 16px 8px",
              padding: "12px 16px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 16,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {(user.email?.[0] ?? "U").toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </div>
              <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginTop: 2 }}>
                {isAdmin ? "⚡ Administrator" : "✦ Member"}
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ padding: "8px 12px", flex: 1 }}>
          {isAdmin && (
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 8px 4px" }}>
              Admin
            </div>
          )}
          {isAdmin && ADMIN_NAV.map((item) => (
            <SidebarLink key={item.href} item={item} active={location.pathname === item.href} onClick={close} />
          ))}

          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 8px 4px" }}>
            Navigation
          </div>
          {USER_NAV.map((item) => (
            <SidebarLink key={item.href} item={item} active={location.pathname === item.href} onClick={close} />
          ))}
        </nav>

        {/* Footer sign out */}
        {user && (
          <div style={{ padding: "16px", borderTop: "1px solid rgba(148,163,184,0.08)" }}>
            <button
              onClick={() => { void logout(); close(); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(251,113,133,0.2)",
                background: "rgba(251,113,133,0.06)",
                color: "#fb7185",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function SidebarLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        marginBottom: 2,
        color: active ? "#10b981" : "#94a3b8",
        background: active ? "rgba(16,185,129,0.1)" : "transparent",
        border: active ? "1px solid rgba(16,185,129,0.18)" : "1px solid transparent",
        fontWeight: active ? 700 : 500,
        fontSize: 14,
        textDecoration: "none",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          e.currentTarget.style.color = "#e2e8f0";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#94a3b8";
        }
      }}
    >
      <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
      {item.label}
      {active && (
        <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
      )}
    </Link>
  );
}
