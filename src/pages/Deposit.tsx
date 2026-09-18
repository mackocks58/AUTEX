import { useState, useEffect } from "react";
import { ref, push, set, serverTimestamp, onValue } from "firebase/database";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { CheckCircle2, Copy, Wallet, Smartphone, AlertCircle, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Tab = "binance" | "mobile";

export default function Deposit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("mobile");
  
  // Binance state
  const [cryptoNetwork, setCryptoNetwork] = useState("TRC20");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [txId, setTxId] = useState("");
  
  // Mobile Money state
  const [mobileNetwork, setMobileNetwork] = useState("Ecocash");
  const [mobileAmount, setMobileAmount] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hasPending, setHasPending] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [cryptoSettings, setCryptoSettings] = useState<Record<string, { enabled: boolean; address: string }>>({
    TRC20: { enabled: true, address: "TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
    BEP20: { enabled: true, address: "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
    ERC20: { enabled: true, address: "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
  });
  const [mobileSettings, setMobileSettings] = useState<Record<string, { enabled: boolean; accountNo: string; accountName: string }>>({
    Ecocash: { enabled: true, accountNo: "123456", accountName: "AUTEX TRADING" },
    OneMoney: { enabled: true, accountNo: "654321", accountName: "AUTEX LTD" },
    Telecash: { enabled: true, accountNo: "112233", accountName: "AUTEX CORP" },
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
    return onValue(pRef, (snap) => {
      const data = snap.val() as Record<string, any>;
      let foundPending = false;
      if (data) {
        for (const key in data) {
          if (data[key].type === "deposit" && data[key].status === "pending") {
            foundPending = true;
            break;
          }
        }
      }
      setHasPending(foundPending);
      setCheckingPending(false);
    });
  }, [user]);

  const enabledCrypto = Object.keys(cryptoSettings).filter(k => cryptoSettings[k].enabled);
  const enabledMobile = Object.keys(mobileSettings).filter(k => mobileSettings[k].enabled);

  useEffect(() => {
    if (!enabledCrypto.includes(cryptoNetwork) && enabledCrypto.length > 0) setCryptoNetwork(enabledCrypto[0]);
  }, [enabledCrypto, cryptoNetwork]);

  useEffect(() => {
    if (!enabledMobile.includes(mobileNetwork) && enabledMobile.length > 0) setMobileNetwork(enabledMobile[0]);
  }, [enabledMobile, mobileNetwork]);

  // Auto-switch tab when settings load: if mobile is disabled but crypto is available, default to binance
  useEffect(() => {
    if (settingsLoading) return;
    if (enabledMobile.length === 0 && enabledCrypto.length > 0) {
      setTab("binance");
    } else if (enabledMobile.length > 0) {
      setTab("mobile");
    }
  }, [settingsLoading]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Step 1: validate inputs then open confirmation sheet
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const isCrypto = tab === "binance";
    const amount = parseFloat(isCrypto ? cryptoAmount : mobileAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (isCrypto && !txId.trim()) {
      setError("Please enter the Transaction Hash (TxID).");
      return;
    }
    if (!isCrypto && !receiptNo.trim()) {
      setError("Please enter the Receipt Number.");
      return;
    }
    setShowConfirmSheet(true);
  };

  // Step 2: user confirmed — do the actual Firebase write
  const handleConfirmedSubmit = async () => {
    if (!user) return;
    setShowConfirmSheet(false);
    setError("");
    setSubmitting(true);
    try {
      const isCrypto = tab === "binance";
      const amount = parseFloat(isCrypto ? cryptoAmount : mobileAmount);
      const paymentsRef = ref(db, `users/${user.uid}/payments`);
      const newTxRef = push(paymentsRef);
      await set(newTxRef, {
        type: "deposit",
        amount: amount,
        currency: "USD",
        status: "pending",
        createdAt: serverTimestamp(),
        description: isCrypto ? `Binance Deposit (${cryptoNetwork})` : `Mobile Money Deposit (${mobileNetwork})`,
        reference: isCrypto ? txId.trim() : receiptNo.trim(),
        network: isCrypto ? cryptoNetwork : mobileNetwork,
        method: isCrypto ? "crypto" : "mobile_money"
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/transactions");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit deposit request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0b0e11", color: "#eaecef", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <CheckCircle2 size={64} color="#0ecb81" style={{ marginBottom: 24, animation: "scale-in 0.3s ease-out" }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "#fff" }}>Deposit Submitted</h2>
        <p style={{ color: "#848e9c", textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>
          Your deposit request has been received and is currently pending verification.
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
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 16px", color: "#fff", letterSpacing: "-0.5px" }}>
              Deposit
            </h1>
            
            {(checkingPending || settingsLoading) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
                <style>{`@keyframes depShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)",
                    backgroundSize: "200% 100%",
                    animation: "depShimmer 1.8s ease-in-out infinite",
                    height: i === 0 ? 80 : 60,
                    borderRadius: 12
                  }} />
                ))}
              </div>
            ) : hasPending ? (
              <div style={{ background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.3)", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <AlertCircle size={40} color="#f0b90b" style={{ marginBottom: 16 }} />
                <h2 style={{ fontSize: 18, color: "#fff", margin: "0 0 8px" }}>Pending Deposit</h2>
                <p style={{ color: "#848e9c", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  You already have a deposit request pending verification. Please wait for our team to process it before submitting another request.
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

                  <div className="input-group" style={{ marginTop: 16, background: "#1e2329", padding: 16, borderRadius: 12 }}>
                    <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Deposit Address</label>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "#fff", fontFamily: "'SF Mono', monospace", wordBreak: "break-all" }}>
                        {cryptoSettings[cryptoNetwork]?.address}
                      </span>
                      <button type="button" onClick={() => handleCopy(cryptoSettings[cryptoNetwork]?.address)} style={{ background: "transparent", border: "none", color: "#f0b90b", cursor: "pointer", padding: 4 }}>
                        <Copy size={16} />
                      </button>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: "#f6465d", display: "flex", gap: 6 }}>
                      <AlertCircle size={14} /> Send only USDT ({cryptoNetwork}) to this address.
                    </div>
                  </div>

                  <div className="input-group" style={{ marginTop: 24 }}>
                    <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Amount (USD)</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number" step="0.01" min="0" required
                        value={cryptoAmount} onChange={e => setCryptoAmount(e.target.value)}
                        placeholder="0.00"
                        style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 16, outline: "none" }}
                      />
                      <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#848e9c", fontSize: 14, fontWeight: 600 }}>USDT</span>
                    </div>
                  </div>

                  <div className="input-group" style={{ marginTop: 20 }}>
                    <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Transaction Hash (TxID)</label>
                    <input
                      type="text" required
                      value={txId} onChange={e => setTxId(e.target.value)}
                      placeholder="Paste TxID here"
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

                  <div className="input-group" style={{ marginTop: 16, background: "#1e2329", padding: 16, borderRadius: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: "#848e9c", fontWeight: 500 }}>Account No:</span>
                      <span style={{ fontSize: 13, color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                        {mobileSettings[mobileNetwork]?.accountNo}
                        <button type="button" onClick={() => handleCopy(mobileSettings[mobileNetwork]?.accountNo)} style={{ background: "transparent", border: "none", color: "#f0b90b", cursor: "pointer", padding: 0 }}>
                          <Copy size={14} />
                        </button>
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#848e9c", fontWeight: 500 }}>Account Name</span>
                      <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
                        {mobileSettings[mobileNetwork]?.accountName}
                      </span>
                    </div>
                  </div>

                  <div className="input-group" style={{ marginTop: 24 }}>
                    <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Amount (USD)</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number" step="0.01" min="0" required
                        value={mobileAmount} onChange={e => setMobileAmount(e.target.value)}
                        placeholder="0.00"
                        style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 16, outline: "none" }}
                      />
                      <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#848e9c", fontSize: 14, fontWeight: 600 }}>USD</span>
                    </div>
                  </div>

                  <div className="input-group" style={{ marginTop: 20 }}>
                    <label style={{ display: "block", fontSize: 13, color: "#848e9c", marginBottom: 8, fontWeight: 500 }}>Receipt Number</label>
                    <input
                      type="text" required
                      value={receiptNo} onChange={e => setReceiptNo(e.target.value)}
                      placeholder="e.g. PPXXXXXXXXX"
                      style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 16, outline: "none", textTransform: "uppercase" }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%", padding: "16px", borderRadius: 8, marginTop: 32,
                  background: submitting ? "#f0b90b80" : "#f0b90b",
                  color: "#0b0e11", fontSize: 16, fontWeight: 700, border: "none",
                  cursor: submitting ? "not-allowed" : "pointer", transition: "all 0.2s"
                }}
              >
                {submitting ? "Submitting..." : "Submit Deposit"}
              </button>
            </form>
            </>
            )}
          </div>
        </div>

        <BottomNav />
      </div>

      {/* ── Confirmation Bottom Sheet ── */}
      {showConfirmSheet && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowConfirmSheet(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
              zIndex: 1000, animation: "fadeBackdrop 0.25s ease"
            }}
          />
          {/* Sheet */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "#1e2329",
            borderRadius: "20px 20px 0 0",
            padding: "28px 24px 40px",
            zIndex: 1001,
            animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
            maxWidth: 500, margin: "0 auto",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.5)"
          }}>
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: "#2b3139", borderRadius: 99, margin: "0 auto 24px" }} />

            {/* Warning icon */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(240,185,11,0.12)",
                border: "1.5px solid rgba(240,185,11,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <ShieldAlert size={30} color="#f0b90b" />
              </div>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", textAlign: "center", margin: "0 0 12px" }}>
              Confirm Your Deposit
            </h2>

            {/* Warning box */}
            <div style={{
              background: "rgba(240,185,11,0.08)",
              border: "1px solid rgba(240,185,11,0.25)",
              borderRadius: 12, padding: "14px 16px", marginBottom: 20
            }}>
              <p style={{ color: "#f0b90b", fontSize: 13, fontWeight: 600, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={14} /> Important Notice
              </p>
              <p style={{ color: "#c9aa54", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Before submitting, please confirm that you have <strong style={{ color: "#fff" }}>already sent</strong> the exact amount to the account details provided above.
              </p>
              <p style={{ color: "#848e9c", fontSize: 12, lineHeight: 1.6, margin: "8px 0 0" }}>
                Submitting this request without completing the transfer will result in delays or rejection of your deposit.
              </p>
            </div>

            {/* Summary */}
            <div style={{ background: "#2b3139", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#848e9c", fontSize: 13 }}>Amount</span>
              <span style={{ color: "#f0b90b", fontSize: 16, fontWeight: 700 }}>
                ${parseFloat(tab === "binance" ? cryptoAmount : mobileAmount).toFixed(2)} {tab === "binance" ? "USDT" : "USD"}
              </span>
            </div>

            {/* Buttons */}
            <button
              onClick={handleConfirmedSubmit}
              style={{
                width: "100%", padding: "15px", borderRadius: 10,
                background: "#f0b90b", color: "#0b0e11",
                fontSize: 15, fontWeight: 700, border: "none",
                cursor: "pointer", marginBottom: 12, transition: "opacity 0.2s"
              }}
            >
              ✓ Yes, I've Transferred — Submit
            </button>
            <button
              onClick={() => setShowConfirmSheet(false)}
              style={{
                width: "100%", padding: "14px", borderRadius: 10,
                background: "transparent", color: "#848e9c",
                fontSize: 15, fontWeight: 600,
                border: "1px solid #2b3139", cursor: "pointer"
              }}
            >
              Go Back &amp; Check
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeBackdrop { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
