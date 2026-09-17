import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Home from "@/pages/Home";
import MovieGroupDetail from "@/pages/MovieGroupDetail";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import Register from "@/pages/Register";
import Admin from "@/pages/Admin";
import Transactions from "@/pages/Transactions";
import Support from "@/pages/Support";
import Chat from "@/pages/Chat";
import PaymentReturn from "@/pages/PaymentReturn";
import PaymentCancel from "@/pages/PaymentCancel";
import Account from "@/pages/Account";
import Bots from "@/pages/Bots";
import MyBots from "@/pages/MyBots";
import Notifications from "@/pages/Notifications";
import Movies from "@/pages/Movies";
import Affiliate from "@/pages/Affiliate";
import LiveMatches from "@/pages/LiveMatches";
import { Shell } from "@/components/Shell";
import { GlobalFeatures } from "@/components/GlobalFeatures";
import Deposit from "@/pages/Deposit";
import Withdraw from "@/pages/Withdraw";
import Assets from "@/pages/Assets";

function AdminRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Shell>
        <p className="muted">Loading…</p>
      </Shell>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    const s: React.CSSProperties = {
      background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)",
      backgroundSize: "200% 100%",
      animation: "prShimmer 1.8s ease-in-out infinite",
      borderRadius: 8,
    };
    return (
      <Shell>
        <style>{`
          @keyframes prShimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
          {/* Header skeleton */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...s, width: 48, height: 48, borderRadius: "50%" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div style={{ ...s, width: "40%", height: 14 }} />
              <div style={{ ...s, width: "25%", height: 11 }} />
            </div>
          </div>
          {/* Summary block skeleton */}
          <div style={{ background: "#181a20", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...s, width: "45%", height: 12 }} />
            <div style={{ ...s, width: "55%", height: 28 }} />
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ ...s, width: 80, height: 11 }} />
                <div style={{ ...s, width: 60, height: 14 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ ...s, width: 60, height: 11 }} />
                <div style={{ ...s, width: 30, height: 14 }} />
              </div>
            </div>
          </div>
          {/* Card skeletons */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: "#181a20", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ ...s, width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ ...s, width: "40%", height: 14 }} />
                <div style={{ ...s, width: "14%", height: 18, borderRadius: 4 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ ...s, width: "70%", height: 11 }} />
                    <div style={{ ...s, width: "55%", height: 14 }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <GlobalFeatures />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/affiliate" element={<Affiliate />} />
        <Route path="/live" element={<LiveMatches />} />

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
        <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/bots" element={<ProtectedRoute><Bots /></ProtectedRoute>} />
        <Route path="/my-bots" element={<ProtectedRoute><MyBots /></ProtectedRoute>} />
        <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/payment/return" element={<ProtectedRoute><PaymentReturn /></ProtectedRoute>} />
        <Route path="/payment/cancel" element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:groupId" element={<MovieGroupDetail />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
