import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { ArrowDownLeft, ArrowUpRight, Gift, Clock, CheckCircle2, XCircle } from "lucide-react";

type TxRecord = {
  id: string;
  type: string;
  amount: number;
  currency?: string;
  status: string;
  createdAt: number;
  updatedAt?: number;
  description?: string;
  orderId?: string;
  reference?: string;
  selcomTransid?: string;
  palmpesaTransid?: string;
  itemId?: string;
};

type Tab = "all" | "deposits" | "bonuses" | "withdrawals";

// ── Status config ──────────────────────────────────────────
const STATUS_MAP: Record<string, { color: string; icon: JSX.Element; text: string }> = {
  completed: { color: "#0ecb81", icon: <CheckCircle2 size={13} />, text: "Completed" },
  success:   { color: "#0ecb81", icon: <CheckCircle2 size={13} />, text: "Completed" },
  paid:      { color: "#0ecb81", icon: <CheckCircle2 size={13} />, text: "Completed" },
  failed:    { color: "#f6465d", icon: <XCircle size={13} />,      text: "Failed"    },
  error:     { color: "#f6465d", icon: <XCircle size={13} />,      text: "Failed"    },
  expired:   { color: "#f6465d", icon: <XCircle size={13} />,      text: "Failed"    },
  cancelled: { color: "#f6465d", icon: <XCircle size={13} />,      text: "Failed"    },
};

function getStatus(s: string) {
  return STATUS_MAP[s.toLowerCase()] ?? { color: "#f0b90b", icon: <Clock size={13} />, text: "Pending" };
}

function isPositive(type: string) {
  return ["deposit", "bonus", "welcome_bonus", "refund", "credit", "bot_income", "commission"].includes(type.toLowerCase());
}

function isBonus(type: string) {
  return ["bonus", "welcome_bonus", "bot_income", "commission"].includes(type.toLowerCase());
}

function txLabel(type: string) {
  if (type.toLowerCase() === "welcome_bonus") return "Welcome Bonus";
  if (type.toLowerCase() === "bot_income") return "Bot Income";
  if (type.toLowerCase() === "commission") return "Referral Commission";
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function TxIcon({ type, pos }: { type: string; pos: boolean }) {
  if (isBonus(type)) return <Gift size={20} />;
  return pos ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />;
}

// ── Copy to clipboard helper ───────────────────────────────
function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      background: "none", border: "none", cursor: "pointer",
      color: copied ? "#0ecb81" : "#848e9c", padding: 0, marginLeft: 6, display: "inline-flex",
      alignItems: "center", flexShrink: 0, transition: "color 0.2s",
    }}>
      {copied
        ? <CheckCircle2 size={14} />
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  );
}

// ── Transaction Detail Modal (Binance-style) ───────────────
function TxDetailModal({ tx, onClose }: { tx: TxRecord; onClose: () => void }) {
  const pos    = isPositive(tx.type);
  const bonus  = isBonus(tx.type);
  const status = getStatus(tx.status);
  const amtColor  = bonus ? "#f0b90b" : pos ? "#0ecb81" : "#f6465d";
  const iconColor = amtColor;
  const bgColor   = bonus ? "rgba(240,185,11,0.1)" : pos ? "rgba(14,203,129,0.1)" : "rgba(246,70,93,0.1)";

  const fullDate = (ts: number) =>
    new Date(ts).toLocaleString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });

  // Detail rows helper
  const Row = ({ label, value, mono = false, copy = false }: {
    label: string; value: string; mono?: boolean; copy?: boolean;
  }) => (
    <div style={{
      display: "flex", alignItems: "flex-start",
      justifyContent: "space-between",
      padding: "14px 0",
      borderBottom: "1px solid #1e2329",
      gap: 12,
    }}>
      <span style={{ fontSize: 13, color: "#848e9c", flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", textAlign: "right" }}>
        <span style={{
          fontSize: 13, color: "#eaecef", fontWeight: 500,
          fontFamily: mono ? "'SF Mono', 'Fira Code', monospace" : undefined,
          wordBreak: "break-all",
        }}>{value}</span>
        {copy && <CopyValue value={value} />}
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          animation: "tx-fade-in 0.25s ease",
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#161a1e",
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        zIndex: 9999,
        padding: "0 0 40px",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
        animation: "tx-slide-up 0.32s cubic-bezier(0.2,0.8,0.2,1)",
        maxHeight: "85dvh",
        overflowY: "auto",
      }}>
        {/* Handle bar */}
        <div style={{
          width: 36, height: 4, background: "#2b3139",
          borderRadius: 999, margin: "12px auto 0",
        }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 20px 0",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#fff" }}>
            Transaction Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "#1e2329", border: "none",
              width: 32, height: 32, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#848e9c",
            }}
          >
            <XCircle size={16} />
          </button>
        </div>

        {/* Big status icon + amount */}
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", padding: "28px 20px 20px",
          borderBottom: "1px solid #1e2329",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: bgColor, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: iconColor, marginBottom: 16,
          }}>
            <TxIcon type={tx.type} pos={pos} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: amtColor, marginBottom: 6 }}>
            {pos ? "+" : "−"}${Number(tx.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2, maximumFractionDigits: 2,
            })} {tx.currency ?? "USD"}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: status.color + "18",
            color: status.color,
            padding: "5px 14px", borderRadius: 999,
            fontSize: 13, fontWeight: 700,
          }}>
            {status.icon}
            {status.text}
          </div>
        </div>

        {/* Detail rows */}
        <div style={{ padding: "0 20px" }}>
          <Row label="Type"       value={txLabel(tx.type)} />
          <Row label="Date"       value={fullDate(tx.createdAt)} />
          {tx.updatedAt && (
            <Row label="Updated"  value={fullDate(tx.updatedAt)} />
          )}
          <Row label="Transaction ID" value={tx.id}        mono copy />
          {tx.orderId        && <Row label="Order ID"         value={tx.orderId}        mono copy />}
          {tx.reference      && <Row label="Reference"        value={tx.reference}      mono copy />}
          {tx.selcomTransid  && <Row label="Selcom Trans ID"  value={tx.selcomTransid}  mono copy />}
          {tx.palmpesaTransid && <Row label="Palmpesa Trans ID" value={tx.palmpesaTransid} mono copy />}
          {tx.itemId         && <Row label="Item ID"          value={tx.itemId}         mono copy />}
          {tx.description    && <Row label="Note"             value={tx.description} />}
        </div>
      </div>

      <style>{`
        @keyframes tx-fade-in   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tx-slide-up  { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
}

// ── Shimmer skeleton row ───────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "18px 20px", borderBottom: "1px solid #1e2329",
    }}>
      <div className="tx-shimmer" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="tx-shimmer" style={{ height: 13, width: "42%", borderRadius: 6, marginBottom: 8 }} />
        <div className="tx-shimmer" style={{ height: 11, width: "28%", borderRadius: 6, opacity: 0.6 }} />
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="tx-shimmer" style={{ height: 13, width: 70, borderRadius: 6, marginBottom: 8, marginLeft: "auto" }} />
        <div className="tx-shimmer" style={{ height: 11, width: 52, borderRadius: 6, marginLeft: "auto", opacity: 0.6 }} />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function Transactions() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems]     = useState<TxRecord[]>([]);
  const [tab, setTab]         = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TxRecord | null>(null);

  useEffect(() => {
    // Keep skeleton while auth is still resolving
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const startTime = Date.now();
    const paymentsRef = ref(db, `users/${user.uid}/payments`);
    return onValue(paymentsRef, (snap) => {
      // Enforce 1.2 s minimum skeleton like the home page
      const delay = Math.max(0, 1200 - (Date.now() - startTime));
      setTimeout(() => {
        if (snap.exists()) {
          const data = snap.val() as Record<string, Omit<TxRecord, "id">>;
          const list: TxRecord[] = Object.keys(data).map(k => ({ id: k, ...data[k] }));
          list.sort((a, b) => b.createdAt - a.createdAt);
          setItems(list);
        } else {
          setItems([]);
        }
        setLoading(false);
      }, delay);
    });
  }, [user, authLoading]);

  const filtered = items.filter(tx => {
    const t = tx.type.toLowerCase();
    if (tab === "all")         return true;
    if (tab === "deposits")    return t === "deposit";
    if (tab === "bonuses")     return isBonus(tx.type);
    if (tab === "withdrawals") return t === "withdrawal";
    return true;
  });

  const TABS: { key: Tab; label: string }[] = [
    { key: "all",         label: "All"         },
    { key: "deposits",    label: "Deposits"    },
    { key: "bonuses",     label: "Bonuses"     },
    { key: "withdrawals", label: "Withdrawals" },
  ];

  return (
    <>
      {/* ── Full-bleed Binance dark surface — NO Shell/card wrapper ── */}
      <div style={{
        minHeight: "100dvh",
        background: "#0b0e11",
        color: "#eaecef",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}>
        <Navbar />

        {/* Content starts below fixed Navbar */}
        <div style={{ paddingTop: 64, paddingBottom: 80 }}>

          {/* Page header */}
          <div style={{ padding: "22px 20px 0" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 3px", color: "#fff", letterSpacing: "-0.3px" }}>
              Transaction History
            </h1>
            <p style={{ margin: "0 0 18px", color: "#848e9c", fontSize: 13 }}>
              {loading ? "Loading…" : `${items.length} transaction${items.length !== 1 ? "s" : ""}`}
            </p>

            {/* Pill tabs */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none" }}>
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 100,
                    border: tab === key ? "1px solid #f0b90b" : "1px solid #2b3139",
                    background: tab === key ? "rgba(240,185,11,0.12)" : "transparent",
                    color: tab === key ? "#f0b90b" : "#848e9c",
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#1e2329" }} />

          {/* Transaction rows */}
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px 40px", color: "#848e9c" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#1e2329", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 18px",
              }}>
                <Clock size={30} color="#474d57" />
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "#eaecef" }}>
                No transactions yet
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>
                Your history will appear here once you make a transaction.
              </p>
            </div>
          ) : (
            filtered.map(tx => {
              const pos       = isPositive(tx.type);
              const bonus     = isBonus(tx.type);
              const status    = getStatus(tx.status);
              const iconColor = bonus ? "#f0b90b" : pos ? "#0ecb81" : "#f6465d";
              const amtColor  = bonus ? "#f0b90b" : pos ? "#0ecb81" : "#f6465d";
              const bgColor   = bonus
                ? "rgba(240,185,11,0.1)"
                : pos ? "rgba(14,203,129,0.1)" : "rgba(246,70,93,0.1)";

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelected(tx)}
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid #1e2329",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Left */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: bgColor, display: "flex",
                      alignItems: "center", justifyContent: "center", color: iconColor,
                    }}>
                      <TxIcon type={tx.type} pos={pos} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "#eaecef", marginBottom: 3 }}>
                        {txLabel(tx.type)}
                      </div>
                      <div style={{ fontSize: 12, color: "#848e9c" }}>{formatDate(tx.createdAt)}</div>
                    </div>
                  </div>

                  {/* Right */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, color: amtColor }}>
                      {pos ? "+" : "−"}${Number(tx.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2, maximumFractionDigits: 2,
                      })}
                    </div>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 11, fontWeight: 600, color: status.color,
                    }}>
                      {status.icon}
                      {status.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <BottomNav />
      </div>

      {/* Transaction detail modal */}
      {selected && <TxDetailModal tx={selected} onClose={() => setSelected(null)} />}

      {/* Shimmer animation + force body bg to Binance dark while on this page */}
      <style>{`
        @keyframes tx-shimmer-wave {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .tx-shimmer {
          background: linear-gradient(90deg, #1e2329 25%, #2b3139 50%, #1e2329 75%);
          background-size: 800px 100%;
          animation: tx-shimmer-wave 1.2s infinite linear;
        }
        body:has(.tx-page) {
          background: #0b0e11 !important;
        }
      `}</style>
      <div className="tx-page" style={{ display: "none" }} />
    </>
  );
}
