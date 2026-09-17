import { useState, useEffect } from "react";
import { ref, push, set, serverTimestamp, onValue } from "firebase/database";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { CheckCircle2, Copy, Wallet, Smartphone, AlertCircle } from "lucide-react";
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError("");
    setSubmitting(true);
    
    try {
      const isCrypto = tab === "binance";
      const amount = parseFloat(isCrypto ? cryptoAmount : mobileAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount.");
      }
      if (isCrypto && !txId.trim()) {
        throw new Error("Please enter the Transaction Hash (TxID).");
      }
      if (!isCrypto && !receiptNo.trim()) {
        throw new Error("Please enter the Receipt Number.");
      }

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
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <div style={{ width: 24, height: 24, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#f0b90b", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
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

            <form onSubmit={handleSubmit}>
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
                      style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "'SF Mono', monospace" }}
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
                      style={{ width: "100%", background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8, padding: "14px 16px", color: "#fff", fontSize: 14, outline: "none", textTransform: "uppercase" }}
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
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
