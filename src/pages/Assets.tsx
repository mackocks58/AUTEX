import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { Shell } from "@/components/Shell";
import { Link } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: number;
  description?: string;
}

// ── Shimmer helper ─────────────────────────────────────────────────────────────
const SH: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "asstShimmer 1.8s ease-in-out infinite",
  borderRadius: 6,
};

function SkeletonAssets() {
  return (
    <div style={{ padding: "0 16px 80px", maxWidth: 640, margin: "0 auto" }}>
      <style>{`@keyframes asstShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Header */}
      <div style={{ paddingTop: 20, marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ ...SH, width: "50%", height: 26 }} />
        <div style={{ ...SH, width: "35%", height: 13 }} />
      </div>

      {/* Balance hero */}
      <div style={{ background: "#181a20", borderRadius: 16, padding: 24, marginBottom: 16, border: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ ...SH, width: "45%", height: 12, marginBottom: 12 }} />
        <div style={{ ...SH, width: "60%", height: 36, marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[0, 1].map(i => (
            <div key={i}>
              <div style={{ ...SH, width: "55%", height: 11, marginBottom: 6 }} />
              <div style={{ ...SH, width: "40%", height: 16 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Category cards */}
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ background: "#181a20", borderRadius: 12, padding: 18, marginBottom: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ ...SH, width: 36, height: 36, borderRadius: 10 }} />
            <div>
              <div style={{ ...SH, width: 90, height: 13, marginBottom: 5 }} />
              <div style={{ ...SH, width: 60, height: 10 }} />
            </div>
            <div style={{ marginLeft: "auto", ...SH, width: 60, height: 20, borderRadius: 6 }} />
          </div>
          {[0, 1].map(j => (
            <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: j === 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ ...SH, width: "45%", height: 11 }} />
              <div style={{ ...SH, width: "20%", height: 11 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Category Definitions ───────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: "deposits",
    label: "Deposits",
    icon: "↓",
    color: "#0ecb81",
    types: ["deposit"],
    description: "Fiat & crypto deposits",
  },
  {
    key: "bot_income",
    label: "Bot Income",
    icon: "🤖",
    color: "#3b82f6",
    types: ["bot_income"],
    description: "Daily earnings from trading bots",
  },
  {
    key: "commissions",
    label: "Referral Commissions",
    icon: "👥",
    color: "#fcd535",
    types: ["commission"],
    description: "3-level affiliate earnings",
  },
  {
    key: "bonuses",
    label: "Bonuses",
    icon: "🎁",
    color: "#8b5cf6",
    types: ["welcome_bonus", "bonus"],
    description: "Welcome bonus & promotions",
  },
  {
    key: "withdrawals",
    label: "Withdrawals",
    icon: "↑",
    color: "#f6465d",
    types: ["withdrawal", "withdraw"],
    description: "Funds sent out",
  },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatAmount(amount: number, positive: boolean) {
  return `${positive ? "+" : "-"}$${Math.abs(amount).toFixed(2)}`;
}

// ── Category Section ───────────────────────────────────────────────────────────
function CategorySection({ cat, items }: { cat: typeof CATEGORIES[number], items: Payment[] }) {
  const [open, setOpen] = useState(false);

  const positiveTypes = ["deposit", "bot_income", "commission", "welcome_bonus", "bonus", "refund", "credit"];
  const isPositive = positiveTypes.includes(cat.types[0]);

  const totalAmount = items.reduce((s, p) => s + p.amount, 0);
  const completed = items.filter(p => p.status === "completed").length;

  return (
    <div style={{
      background: "#181a20",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.03)",
      overflow: "hidden",
      marginBottom: 12,
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 18,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Icon circle */}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `${cat.color}18`,
          border: `1px solid ${cat.color}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}>
          {cat.icon}
        </div>

        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#eaecef" }}>{cat.label}</div>
          <div style={{ fontSize: 11, color: "#848e9c", marginTop: 2 }}>{cat.description}</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: items.length === 0 ? "#848e9c" : isPositive ? "#0ecb81" : "#f6465d",
          }}>
            {items.length === 0 ? "$0.00" : formatAmount(totalAmount, isPositive)}
          </div>
          <div style={{ fontSize: 10, color: "#848e9c", marginTop: 2 }}>{items.length} records</div>
        </div>

        {/* Chevron */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#474d57"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded records */}
      {open && items.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {items.slice(0, 10).map((item, i) => (
            <div key={item.id || i} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 18px",
              borderBottom: i < Math.min(items.length, 10) - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#c7ccd4" }}>
                  {item.description || cat.label}
                </div>
                <div style={{ fontSize: 11, color: "#5e6673", marginTop: 2 }}>{formatDate(item.createdAt)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isPositive ? "#0ecb81" : "#f6465d" }}>
                  {formatAmount(item.amount, isPositive)}
                </div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: item.status === "completed" ? "#0ecb81" : item.status === "failed" ? "#f6465d" : "#f0b90b",
                  marginTop: 2,
                }}>
                  {(item.status || "pending").toUpperCase()}
                </div>
              </div>
            </div>
          ))}
          {items.length > 10 && (
            <div style={{ padding: "10px 18px", textAlign: "center" }}>
              <Link to="/transactions" style={{ fontSize: 12, color: "#fcd535", textDecoration: "none", fontWeight: 600 }}>
                View all {items.length} records →
              </Link>
            </div>
          )}
        </div>
      )}

      {open && items.length === 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "20px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#5e6673" }}>No records yet</div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Assets() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const [dataArrived, setDataArrived] = useState(false);

  const showSkeleton = !timerDone || !dataArrived;

  useEffect(() => {
    const t = setTimeout(() => setTimerDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) { setDataArrived(true); return; }

    let balLoaded = false, txLoaded = false;
    const check = () => { if (balLoaded && txLoaded) setDataArrived(true); };

    const unsub1 = onValue(ref(db, `users/${user.uid}/balance`), snap => {
      setBalance(Number(snap.val() || 0));
      balLoaded = true; check();
    });

    const unsub2 = onValue(ref(db, `users/${user.uid}/payments`), snap => {
      if (snap.exists()) {
        const raw = snap.val();
        const list: Payment[] = Object.entries(raw).map(([id, v]: [string, any]) => ({ id, ...v }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setPayments(list);
      } else {
        setPayments([]);
      }
      txLoaded = true; check();
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  // Group payments by category
  const grouped = (types: string[]) =>
    payments.filter(p => types.includes(p.type?.toLowerCase()));

  const totalIn = payments
    .filter(p => ["deposit", "bot_income", "commission", "welcome_bonus", "bonus", "refund", "credit"].includes(p.type?.toLowerCase()))
    .filter(p => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);

  const totalOut = payments
    .filter(p => ["withdrawal", "withdraw"].includes(p.type?.toLowerCase()))
    .filter(p => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <Shell>
      {showSkeleton ? (
        <SkeletonAssets />
      ) : (
        <div style={{ padding: "0 16px 80px", maxWidth: 640, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ paddingTop: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <Link to="/account" style={{ color: "#848e9c", textDecoration: "none", display: "flex", alignItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#eaecef" }}>My Assets</h1>
              <p style={{ margin: 0, fontSize: 12, color: "#848e9c" }}>All earnings and financial activity</p>
            </div>
          </div>

          {/* Balance Hero Card */}
          <div style={{
            background: "linear-gradient(135deg, #1a2035 0%, #181a20 100%)",
            borderRadius: 16,
            padding: 22,
            marginBottom: 16,
            border: "1px solid rgba(252,213,53,0.12)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Soft glow */}
            <div style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              background: "radial-gradient(circle, rgba(252,213,53,0.08) 0%, transparent 70%)",
              borderRadius: "50%",
            }} />

            <div style={{ fontSize: 12, color: "#848e9c", marginBottom: 6, fontWeight: 500 }}>Total Balance (USDT)</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#eaecef", marginBottom: 18, letterSpacing: "-0.02em" }}>
              ${balance.toFixed(2)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#848e9c", marginBottom: 4 }}>Total Received</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0ecb81" }}>+${totalIn.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#848e9c", marginBottom: 4 }}>Total Withdrawn</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f6465d" }}>-${totalOut.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <Link to="/deposit" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "rgba(14,203,129,0.1)",
              border: "1px solid rgba(14,203,129,0.2)",
              borderRadius: 10,
              padding: "12px",
              fontSize: 13,
              fontWeight: 600,
              color: "#0ecb81",
              textDecoration: "none",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              Deposit
            </Link>
            <Link to="/withdraw" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "rgba(246,70,93,0.1)",
              border: "1px solid rgba(246,70,93,0.2)",
              borderRadius: 10,
              padding: "12px",
              fontSize: 13,
              fontWeight: 600,
              color: "#f6465d",
              textDecoration: "none",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              Withdraw
            </Link>
          </div>

          {/* Section Label */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#eaecef" }}>Breakdown by Category</div>
            <Link to="/transactions" style={{ fontSize: 12, color: "#fcd535", textDecoration: "none", fontWeight: 600 }}>
              Full History →
            </Link>
          </div>

          {/* Categories */}
          {CATEGORIES.map(cat => (
            <CategorySection
              key={cat.key}
              cat={cat}
              items={grouped(cat.types)}
            />
          ))}

        </div>
      )}
    </Shell>
  );
}
