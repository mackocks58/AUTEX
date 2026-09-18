import { useState, useEffect } from "react";
import { ref, push, set, serverTimestamp, get, onValue } from "firebase/database";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Tab = "binance" | "mobile";

// ── Confirmation Bottom Sheet ──────────────────────────────────────────────
interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  details: {
    method: string;
    network: string;
    amount: string;
    destination: string;
    accountName?: string;
    balanceAfter: string;
  };
}

function ConfirmSheet({ open, onClose, onConfirm, submitting, details }: ConfirmSheetProps) {
  const rows: { label: string; value: string; mono?: boolean; highlight?: boolean }[] = [
    { label: "Method",   value: details.method },
    { label: "Network",  value: details.network },
    { label: "Amount",   value: `$${details.amount}`, highlight: true },
    ...(details.accountName ? [{ label: "Name", value: details.accountName }] : []),
    { label: details.method === "Crypto" ? "Address" : "Account No.",
      value: details.destination, mono: true },
    { label: "Bal. After", value: `$${details.balanceAfter}` },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={!submitting ? onClose : undefined}
        style={{
          position: "fixed", inset: 0, zIndex: 1200,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0,
          zIndex: 1201,
          background: "linear-gradient(180deg, #161b27 0%, #0f1420 100%)",
          borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(148,163,184,0.1)",
          borderBottom: "none",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.7)",
          transform: open ? "translateY(0)" : "translateY(105%)",
          transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          padding: "0 0 24px",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: "rgba(148,163,184,0.3)" }} />
        </div>

        {/* Icon + title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px 10px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "rgba(251,146,60,0.12)",
            border: "1.5px solid rgba(251,146,60,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>Confirm Withdrawal</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Review carefully — this cannot be undone</div>
          </div>
        </div>

        {/* Detail rows */}
        <div style={{ margin: "0 12px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.08)", overflow: "hidden" }}>
          {rows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 12px",
                borderBottom: i < rows.length - 1 ? "1px solid rgba(148,163,184,0.06)" : "none",
              }}
            >
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, flexShrink: 0, marginRight: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {row.label}
              </span>
              <span style={{
                fontSize: row.highlight ? 15 : 12,
                fontWeight: row.highlight ? 800 : 600,
                color: row.highlight ? "#fb923c" : "#e2e8f0",
                fontFamily: row.mono ? "'SF Mono', 'Roboto Mono', monospace" : "inherit",
                textAlign: "right",
                wordBreak: "break-all",
                maxWidth: "65%",
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Warning note */}
        <div style={{
          margin: "0 12px 12px",
          padding: "8px 12px",
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.18)",
          borderRadius: 8,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p style={{ margin: 0, fontSize: 11, color: "#fca5a5", lineHeight: 1.4 }}>
            Wrong details may result in permanent loss of funds.
          </p>
        </div>

        {/* Buttons — side by side */}
        <div style={{ padding: "0 12px", display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              color: "#94a3b8", fontSize: 14, fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={submitting}
            style={{
              flex: 2, padding: "13px 0", borderRadius: 10,
              background: submitting
                ? "rgba(251,146,60,0.4)"
                : "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
              color: "#fff", fontSize: 14, fontWeight: 800,
              border: "none", cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: submitting ? "none" : "0 4px 16px rgba(234,88,12,0.35)",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {submitting ? (
              <>
                <div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Processing...
              </>
            ) : "✓ Confirm Withdrawal"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Withdraw() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("mobile");

  // Binance state
  const [cryptoNetwork, setCryptoNetwork] = useState("TRC20");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");

  // Mobile Money state
  const [mobileNetwork, setMobileNetwork] = useState("Ecocash");
  const [mobileAmount, setMobileAmount] = useState("");
  const [mobileAccount, setMobileAccount] = useState("");
  const [mobileAccountName, setMobileAccountName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hasPending, setHasPending] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const [balance, setBalance] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [cryptoSettings, setCryptoSettings] = useState<Record<string, { enabled: boolean }>>({
    TRC20: { enabled: true },
    BEP20: { enabled: true },
    ERC20: { enabled: true },
  });
  const [mobileSettings, setMobileSettings] = useState<Record<string, { enabled: boolean }>>({
    Ecocash: { enabled: true },
    OneMoney: { enabled: true },
    Telecash: { enabled: true },
  });

  useEffect(() => {
    const sRef = ref(db, "settings/deposits");
    return onValue(sRef, (snap) => {
      const val = snap.val();
      if (val?.crypto) setCryptoSettings(prev => ({ ...prev, ...val.crypto }));
      if (val?.mobile) setMobileSettings(prev => ({ ...prev, ...val.mobile }));
      setSettingsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const pRef = ref(db, `users/${user.uid}/payments`);
    const unsubP = onValue(pRef, (snap) => {
      const data = snap.val() as Record<string, any>;
      let foundPending = false;
      if (data) {
        for (const key in data) {
          if (data[key].type === "withdraw" && data[key].status === "pending") {
            foundPending = true;
            break;
          }
        }
      }
      setHasPending(foundPending);
      setCheckingPending(false);
    });

    const bRef = ref(db, `users/${user.uid}/balance`);
    const unsubB = onValue(bRef, (snap) => {
      setBalance(Number(snap.val() || 0));
    });

    return () => { unsubP(); unsubB(); };
  }, [user]);

  const enabledCrypto = Object.keys(cryptoSettings).filter(k => cryptoSettings[k].enabled);
  const enabledMobile = Object.keys(mobileSettings).filter(k => mobileSettings[k].enabled);

  useEffect(() => {
    if (!enabledCrypto.includes(cryptoNetwork) && enabledCrypto.length > 0) setCryptoNetwork(enabledCrypto[0]);
  }, [enabledCrypto, cryptoNetwork]);

  useEffect(() => {
    if (!enabledMobile.includes(mobileNetwork) && enabledMobile.length > 0) setMobileNetwork(enabledMobile[0]);
  }, [enabledMobile, mobileNetwork]);

  // Step 1: validate and open sheet
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const isCrypto = tab === "binance";
    const amount = parseFloat(isCrypto ? cryptoAmount : mobileAmount);

    if (isNaN(amount) || amount < 10) {
      setError("Minimum withdrawal amount is $10.");
      return;
    }
    if (amount > balance) {
      setError(`Insufficient funds. Your balance is $${balance.toFixed(2)}`);
      return;
    }
    if (isCrypto && !cryptoAddress.trim()) {
      setError("Please enter your Receiving Address.");
      return;
    }
    if (!isCrypto && !mobileAccount.trim()) {
      setError("Please enter your Account Number.");
      return;
    }
    if (!isCrypto && !mobileAccountName.trim()) {
      setError("Please enter your Account Name.");
      return;
    }

    setShowConfirm(true);
  };

  // Step 2: confirmed — execute
  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const isCrypto = tab === "binance";
      const amount = parseFloat(isCrypto ? cryptoAmount : mobileAmount);

      const userRef = ref(db, `users/${user.uid}/balance`);
      const bSnap = await get(userRef);
      const currentBalance = Number(bSnap.val() || 0);

      if (amount > currentBalance) {
        throw new Error(`Insufficient funds. Your balance is $${currentBalance.toFixed(2)}`);
      }

      const paymentsRef = ref(db, `users/${user.uid}/payments`);
      const newTxRef = push(paymentsRef);

      await set(userRef, currentBalance - amount);
      await set(newTxRef, {
        type: "withdraw",
        amount,
        currency: "USD",
        status: "pending",
        createdAt: serverTimestamp(),
        description: isCrypto ? `Crypto Withdrawal (${cryptoNetwork})` : `Mobile Withdrawal (${mobileNetwork})`,
        reference: isCrypto ? cryptoAddress.trim() : `${mobileAccount.trim()} (${mobileAccountName.trim()})`,
        network: isCrypto ? cryptoNetwork : mobileNetwork,
        accountName: isCrypto ? null : mobileAccountName.trim(),
        method: isCrypto ? "crypto" : "mobile_money",
      });

      setShowConfirm(false);
      setSuccess(true);
      setTimeout(() => navigate("/transactions"), 2000);
    } catch (err: any) {
      setShowConfirm(false);
      setError(err.message || "Failed to submit withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  };

  // Build details object for the sheet
  const isCrypto = tab === "binance";
  const amount = parseFloat(isCrypto ? cryptoAmount : mobileAmount) || 0;
  const confirmDetails = {
    method: isCrypto ? "Crypto" : "Mobile Money",
    network: isCrypto ? cryptoNetwork : mobileNetwork,
    amount: amount.toFixed(2),
    destination: isCrypto ? cryptoAddress : mobileAccount,
    accountName: isCrypto ? undefined : mobileAccountName,
    balanceAfter: Math.max(0, balance - amount).toFixed(2),
  };

  if (success) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0b0e11", color: "#eaecef", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <CheckCircle2 size={64} color="#0ecb81" style={{ marginBottom: 24, animation: "scale-in 0.3s ease-out" }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "#fff" }}>Withdrawal Submitted</h2>
        <p style={{ color: "#848e9c", textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>
          Your withdrawal request has been received and your funds have been deducted pending verification.
        </p>
        <style>{`@keyframes scale-in { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <div style={{
        minHeight: "100dvh",
        background: "#0b0e11",
        color: "#eaecef",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <Navbar />

        <div style={{ paddingTop: 56, paddingBottom: 100, maxWidth: 500, margin: "0 auto" }}>
          <div style={{ padding: "8px 20px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#fff", letterSpacing: "-0.5px" }}>
                Withdraw
              </h1>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>
                Bal: <strong style={{ color: "#fff" }}>${balance.toFixed(2)}</strong>
              </div>
            </div>

            {(checkingPending || settingsLoading) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
                <style>{`@keyframes withShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)",
                    backgroundSize: "200% 100%",
                    animation: "withShimmer 1.8s ease-in-out infinite",
                    height: i === 0 ? 80 : 60,
                    borderRadius: 12
                  }} />
                ))}
              </div>
            ) : hasPending ? (
              <div style={{ background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.3)", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <AlertCircle size={40} color="#f0b90b" style={{ marginBottom: 16 }} />
                <h2 style={{ fontSize: 18, color: "#fff", margin: "0 0 8px" }}>Pending Withdrawal</h2>
                <p style={{ color: "#848e9c", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  You already have a withdrawal request pending verification. Please wait for our team to process it before submitting another request.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/transactions")}
                  style={{ marginTop: 24, padding: "10px 20px", borderRadius: 8, background: "#f0b90b", color: "#0b0e11", border: "none", fontWeight: 600, cursor: "pointer" }}
                >
                  View Transactions
                </button>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div style={{ display: "flex", background: "#1e2329", borderRadius: 8, padding: 4, marginBottom: 24 }}>
                  {enabledMobile.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab("mobile")}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 6,
                        background: tab === "mobile" ? "#2b3139" : "transparent",
                        color: tab === "mobile" ? "#fff" : "#848e9c",
                        border: "none", fontSize: 14, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                      }}
                    >
                      <img src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" alt="Mobile" width="16" height="16" />
                      Mobile Money
                    </button>
                  )}
                  {enabledCrypto.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab("binance")}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 6,
                        background: tab === "binance" ? "#2b3139" : "transparent",
                        color: tab === "binance" ? "#fff" : "#848e9c",
                        border: "none", fontSize: 14, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                      }}
                    >
                      <img src="https://cryptologos.cc/logos/bnb-bnb-logo.png" alt="Binance" width="16" height="16" />
                      Crypto
                    </button>
                  )}
                </div>

                <form onSubmit={handleFormSubmit}>
                  {error && (
                    <div style={{ background: "rgba(246,70,93,0.1)", border: "1px solid rgba(246,70,93,0.4)", color: "#f6465d", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>{error}</div>
                    </div>
                  )}

                  {tab === "binance" && (
                    <div style={{ animation: "fade-in 0.2s ease" }}>
                      <div className="input-group">
                        <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Select Network</label>
                        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
                          {enabledCrypto.map(net => (
                            <button
                              key={net} type="button"
                              onClick={() => setCryptoNetwork(net)}
                              style={{
                                padding: "8px 16px", borderRadius: 100,
                                border: cryptoNetwork === net ? "1px solid #f0b90b" : "1px solid #2b3139",
                                background: cryptoNetwork === net ? "rgba(240,185,11,0.1)" : "transparent",
                                color: cryptoNetwork === net ? "#f0b90b" : "#eaecef",
                                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                              }}
                            >
                              {net}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="input-group" style={{ marginTop: 24 }}>
                        <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Withdrawal Amount (USD)</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="number" step="0.01" min="10" required max={balance}
                            value={cryptoAmount} onChange={e => setCryptoAmount(e.target.value)}
                            placeholder="0.00"
                            style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 16, outline: "none" }}
                          />
                          <button
                            type="button"
                            onClick={() => setCryptoAmount(balance.toString())}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#f0b90b", fontSize: 12, fontWeight: 700, background: "rgba(240,185,11,0.1)", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
                          >
                            MAX
                          </button>
                        </div>
                      </div>

                      <div className="input-group" style={{ marginTop: 20 }}>
                        <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Receiving Address ({cryptoNetwork})</label>
                        <input
                          type="text" required
                          value={cryptoAddress} onChange={e => setCryptoAddress(e.target.value)}
                          placeholder="Paste your address here"
                          style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 16, outline: "none", fontFamily: "'SF Mono', monospace" }}
                        />
                      </div>
                    </div>
                  )}

                  {tab === "mobile" && (
                    <div style={{ animation: "fade-in 0.2s ease" }}>
                      <div className="input-group">
                        <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Select Network</label>
                        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
                          {enabledMobile.map(net => (
                            <button
                              key={net} type="button"
                              onClick={() => setMobileNetwork(net)}
                              style={{
                                padding: "8px 16px", borderRadius: 100,
                                border: mobileNetwork === net ? "1px solid #f0b90b" : "1px solid #2b3139",
                                background: mobileNetwork === net ? "rgba(240,185,11,0.1)" : "transparent",
                                color: mobileNetwork === net ? "#f0b90b" : "#eaecef",
                                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                              }}
                            >
                              {net}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="input-group" style={{ marginTop: 24 }}>
                        <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Withdrawal Amount (USD)</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="number" step="0.01" min="10" required max={balance}
                            value={mobileAmount} onChange={e => setMobileAmount(e.target.value)}
                            placeholder="0.00"
                            style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 16, outline: "none" }}
                          />
                          <button
                            type="button"
                            onClick={() => setMobileAmount(balance.toString())}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#f0b90b", fontSize: 12, fontWeight: 700, background: "rgba(240,185,11,0.1)", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
                          >
                            MAX
                          </button>
                        </div>
                      </div>

                      <div className="input-group" style={{ marginTop: 20 }}>
                        <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Your Account Number</label>
                        <input
                          type="text" required
                          value={mobileAccount} onChange={e => setMobileAccount(e.target.value)}
                          placeholder="e.g. 077XXXXXXXX"
                          style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 16, outline: "none" }}
                        />
                      </div>

                      <div className="input-group" style={{ marginTop: 20 }}>
                        <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Account Name</label>
                        <input
                          type="text" required
                          value={mobileAccountName} onChange={e => setMobileAccountName(e.target.value)}
                          placeholder="Name registered to this account"
                          style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 16, outline: "none" }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{
                      width: "100%", padding: "16px", borderRadius: 8, marginTop: 32,
                      background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
                      color: "#fff", fontSize: 16, fontWeight: 700, border: "none",
                      cursor: "pointer", transition: "all 0.2s",
                      boxShadow: "0 4px 16px rgba(234,88,12,0.3)",
                    }}
                  >
                    Review Withdrawal →
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <BottomNav />
      </div>

      {/* Confirmation Bottom Sheet */}
      <ConfirmSheet
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        submitting={submitting}
        details={confirmDetails}
      />

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
