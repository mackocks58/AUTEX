import { useState, useEffect } from "react";
import { ref, onValue, update, get, push } from "firebase/database";
import { db } from "@/firebase";

// ── Inline copy button with tick feedback ──
function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */ 
    }
  };
  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label ?? text}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
        border: copied ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.12)",
        borderRadius: 6, padding: "2px 8px", cursor: "pointer",
        fontSize: 11, fontWeight: 600,
        color: copied ? "#10b981" : "#94a3b8",
        transition: "all 0.2s ease", lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {label ?? "Copy"}
        </>
      )}
    </button>
  );
}

type Payment = {
  id: string;
  uid: string;
  email: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: number;
  description: string;
  method?: string;
  network?: string;
  accountName?: string;
};

export function AdminWithdraws() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject", payment: Payment } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      const allPayments: Payment[] = [];

      if (usersData) {
        Object.keys(usersData).forEach((uid) => {
          const user = usersData[uid];
          const userPayments = user.payments;
          if (userPayments) {
            Object.keys(userPayments).forEach((pid) => {
              const p = userPayments[pid];
              if (p.type === "withdraw") {
                allPayments.push({
                  id: pid,
                  uid: uid,
                  email: user.email || "Unknown",
                  type: p.type,
                  amount: p.amount,
                  currency: p.currency || "USD",
                  status: p.status,
                  createdAt: p.createdAt || 0,
                  description: p.description || "",
                  reference: p.reference || "",
                  method: p.method,
                  network: p.network,
                  accountName: p.accountName,
                });
              }
            });
          }
        });
      }
      // Sort by newest first
      allPayments.sort((a, b) => b.createdAt - a.createdAt);
      setPayments(allPayments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const executeConfirm = async () => {
    if (!confirmAction) return;
    const { type, payment } = confirmAction;
    
    setErr(null);
    setMsg(null);
    setProcessing(true);

    try {
      const updates: any = {};
      const newNotifKey = push(ref(db, `userNotifications/${payment.uid}`)).key;
      
      if (type === "approve") {
        // Balance was already deducted when they requested the withdraw.
        updates[`users/${payment.uid}/payments/${payment.id}/status`] = "completed";
        
        if (newNotifKey) {
          updates[`userNotifications/${payment.uid}/${newNotifKey}`] = {
            title: "Withdrawal Processed",
            message: `Your withdrawal of $${Number(payment.amount).toFixed(2)} to ${payment.reference || payment.description} has been successfully processed and sent.`,
            type: "activity",
            createdAt: Date.now()
          };
        }
      } else {
        // Rejecting means we must refund the user's balance
        const userRef = ref(db, `users/${payment.uid}`);
        const userSnap = await get(userRef);
        if (!userSnap.exists()) throw new Error("User not found in database.");
        
        const userData = userSnap.val();
        const currentBalance = Number(userData.balance || 0);
        const newBalance = currentBalance + Number(payment.amount);

        updates[`users/${payment.uid}/payments/${payment.id}/status`] = "failed";
        updates[`users/${payment.uid}/balance`] = newBalance;
        
        if (newNotifKey) {
          updates[`userNotifications/${payment.uid}/${newNotifKey}`] = {
            title: "Withdrawal Rejected",
            message: `Your withdrawal request of $${Number(payment.amount).toFixed(2)} has been rejected and the funds have been refunded to your account balance.`,
            type: "activity",
            createdAt: Date.now()
          };
        }
      }

      await update(ref(db), updates);
      setMsg(type === "approve" ? `Successfully approved withdrawal for ${payment.email}.` : `Withdrawal rejected and refunded for ${payment.email}.`);
      setTimeout(() => setMsg(null), 3000);
      setConfirmAction(null);
    } catch (e: any) {
      setErr(e.message || `Could not ${type} withdrawal.`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Manage Withdrawals</h2>

        {msg && <div className="alert info" style={{ marginBottom: 16 }}>{msg}</div>}
        {err && <div className="alert" style={{ marginBottom: 16 }}>{err}</div>}

        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--stroke)" }}>
                <th style={{ padding: 12 }}>Date</th>
                <th style={{ padding: 12 }}>User</th>
                <th style={{ padding: 12 }}>Details</th>
                <th style={{ padding: 12 }}>Destination</th>
                <th style={{ padding: 12 }}>Amount</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 12, textAlign: "center", color: "var(--muted)" }}>
                    Loading withdrawals...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 12, textAlign: "center", color: "var(--muted)" }}>
                    No withdrawals found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.email}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{p.uid.slice(0, 8)}...</span>
                        <CopyBtn text={p.email} label="Email" />
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontSize: 14 }}>{p.description}</div>
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontFamily: "monospace", color: "var(--muted)" }}>{p.reference || "-"}</span>
                        {p.reference && <CopyBtn text={p.reference} label="Number" />}
                      </div>
                      {p.accountName && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ color: "#e2e8f0", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>📋 {p.accountName}</span>
                          <CopyBtn text={p.accountName} label="Name" />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 12, fontWeight: 700, color: "var(--accent)" }}>
                      ${Number(p.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span className="pill mono" style={{ 
                        fontSize: 12, 
                        background: p.status === 'completed' ? 'rgba(16,185,129,0.1)' : 
                                    p.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        color: p.status === 'completed' ? '#10b981' : 
                               p.status === 'failed' ? '#ef4444' : '#f59e0b',
                        border: 'none'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      {p.status === "pending" ? (
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button 
                            className="btn btn-ghost" 
                            style={{ color: "#10b981", padding: "6px 12px", minHeight: 0 }}
                            onClick={() => setConfirmAction({ type: "approve", payment: p })}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: "6px 12px", minHeight: 0 }}
                            onClick={() => setConfirmAction({ type: "reject", payment: p })}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmAction && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20
        }}>
          <div style={{
            background: "#1e2329", width: "100%", maxWidth: 400,
            borderRadius: 12, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 20, color: "#fff" }}>
              {confirmAction.type === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </h3>
            
            <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>User Email:</span>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{confirmAction.payment.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Amount:</span>
                <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>${Number(confirmAction.payment.amount).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Method:</span>
                <span style={{ color: "#fff", fontSize: 13 }}>{confirmAction.payment.description}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Destination:</span>
                <span style={{ color: "#fff", fontSize: 13, fontFamily: "monospace", wordBreak: "break-all", maxWidth: 180, textAlign: "right" }}>{confirmAction.payment.reference}</span>
              </div>
            </div>

            {confirmAction.type === "approve" ? (
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                Approving this withdrawal will mark it as <strong style={{ color: "#10b981" }}>completed</strong>. The user's balance was already deducted when they made the request. You should now send the funds to their destination address/account.
              </p>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                Rejecting this withdrawal will mark it as <strong style={{ color: "#ef4444" }}>failed</strong> and will <strong style={{ color: "#f0b90b" }}>automatically refund</strong> ${Number(confirmAction.payment.amount).toFixed(2)} back to the user's balance.
              </p>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button 
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={processing}
                style={{
                  flex: 1, padding: "12px", borderRadius: 8, background: "transparent",
                  border: "1px solid var(--stroke)", color: "#fff", cursor: processing ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeConfirm}
                disabled={processing}
                style={{
                  flex: 1, padding: "12px", borderRadius: 8, border: "none",
                  background: confirmAction.type === "approve" ? "#10b981" : "#ef4444",
                  color: "#fff", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer",
                  opacity: processing ? 0.7 : 1
                }}
              >
                {processing ? "Processing..." : confirmAction.type === "approve" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
