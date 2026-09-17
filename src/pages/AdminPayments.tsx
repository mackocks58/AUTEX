import { useState, useEffect } from "react";
import { ref, onValue, update, get, push } from "firebase/database";
import { db } from "@/firebase";

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
  reference: string;
  method?: string;
  network?: string;
};

export function AdminPayments() {
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
              if (p.type === "deposit") {
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
        const userRef = ref(db, `users/${payment.uid}`);
        const userSnap = await get(userRef);
        if (!userSnap.exists()) throw new Error("User not found in database.");
        
        const userData = userSnap.val();
        const currentBalance = Number(userData.balance || 0);
        const newBalance = currentBalance + Number(payment.amount);

        updates[`users/${payment.uid}/payments/${payment.id}/status`] = "completed";
        updates[`users/${payment.uid}/balance`] = newBalance;
        
        // Push notification
        if (newNotifKey) {
          updates[`userNotifications/${payment.uid}/${newNotifKey}`] = {
            title: "Deposit Successful",
            message: `Your deposit of $${Number(payment.amount).toFixed(2)} via ${payment.description} has been approved and credited to your balance.`,
            type: "activity",
            createdAt: Date.now()
          };
        }
      } else {
        updates[`users/${payment.uid}/payments/${payment.id}/status`] = "failed";
        
        // Push notification
        if (newNotifKey) {
          updates[`userNotifications/${payment.uid}/${newNotifKey}`] = {
            title: "Deposit Rejected",
            message: `Your deposit request of $${Number(payment.amount).toFixed(2)} via ${payment.description} has been rejected. Please contact support if you believe this is an error.`,
            type: "activity",
            createdAt: Date.now()
          };
        }
      }

      await update(ref(db), updates);
      setMsg(type === "approve" ? `Successfully approved deposit for ${payment.email}.` : `Deposit rejected for ${payment.email}.`);
      setTimeout(() => setMsg(null), 3000);
      setConfirmAction(null);
    } catch (e: any) {
      setErr(e.message || `Could not ${type} payment.`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Manage Deposits</h2>

        {msg && <div className="alert info" style={{ marginBottom: 16 }}>{msg}</div>}
        {err && <div className="alert" style={{ marginBottom: 16 }}>{err}</div>}

        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--stroke)" }}>
                <th style={{ padding: 12 }}>Date</th>
                <th style={{ padding: 12 }}>User</th>
                <th style={{ padding: 12 }}>Details</th>
                <th style={{ padding: 12 }}>Ref/TxID</th>
                <th style={{ padding: 12 }}>Amount</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 12, textAlign: "center", color: "var(--muted)" }}>
                    Loading deposits...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 12, textAlign: "center", color: "var(--muted)" }}>
                    No deposits found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600 }}>{p.email}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{p.uid.slice(0, 8)}...</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontSize: 14 }}>{p.description}</div>
                    </td>
                    <td style={{ padding: 12, fontFamily: "monospace", fontSize: 13, color: "var(--muted)" }}>
                      {p.reference || "-"}
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
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Ref/TxID:</span>
                <span style={{ color: "#fff", fontSize: 13, fontFamily: "monospace", wordBreak: "break-all", maxWidth: 180, textAlign: "right" }}>{confirmAction.payment.reference}</span>
              </div>
            </div>

            {confirmAction.type === "approve" ? (
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                Approving this deposit will change the status to <strong style={{ color: "#10b981" }}>completed</strong> and automatically add <strong style={{ color: "#fff" }}>${Number(confirmAction.payment.amount).toFixed(2)}</strong> to the user's balance.
              </p>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                Rejecting this deposit will change the status to <strong style={{ color: "#ef4444" }}>failed</strong>. The user's balance will remain unchanged.
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
